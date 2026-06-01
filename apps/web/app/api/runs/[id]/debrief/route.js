import { getServerSession } from "next-auth";
import { sql } from "@vercel/postgres";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";
import {
  PROMPT_VERSION,
  buildSystemPrompt,
  buildUserMessage,
} from "@/lib/coach-prompt";
import { extractMemories } from "@/lib/memory-extract";

// Per RELEASE_GUIDE: Step 4 = free tier only. Haiku 4.5 + tier=free.
// Step 8 will branch to Sonnet 4.6 for paid users.
const MODEL = "claude-haiku-4-5-20251001";
const TIER = "free";

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const runId = params.id;

  // ── 1. Verify the run exists and belongs to this user ──────────────
  const runResult = await sql`
    SELECT
      r.id, r.user_id, r.started_at, r.run_type,
      r.distance_meters, r.duration_seconds, r.avg_heart_rate,
      r.hr_zone_breakdown, r.splits, r.notes, r.raw_payload,
      c.sleep_hours, c.sleep_quality, c.energy, c.stress, c.notes AS context_notes
    FROM runs r
    LEFT JOIN run_contexts c ON c.run_id = r.id
    WHERE r.id = ${runId} AND r.user_id = ${userId} AND r.deleted_at IS NULL
    LIMIT 1
  `;

  if (runResult.rows.length === 0) {
    return new Response("Run not found", { status: 404 });
  }

  const row = runResult.rows[0];

  // ── 2. Short-circuit if a debrief already exists ───────────────────
  const existing = await sql`
    SELECT content, status FROM debriefs WHERE run_id = ${runId} LIMIT 1
  `;
  if (existing.rows.length > 0 && existing.rows[0].status === "complete") {
    // Return the cached debrief as a single stream chunk.
    const cached = existing.rows[0].content;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(cached));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // ── 3. Fetch recent runs (last 5, excluding this one) ─────────────
  const recentRunsResult = await sql`
    SELECT id, started_at, run_type, distance_meters, duration_seconds, avg_heart_rate
    FROM runs
    WHERE user_id = ${userId} AND id != ${runId} AND deleted_at IS NULL
    ORDER BY started_at DESC
    LIMIT 5
  `;
  const recentRuns = recentRunsResult.rows;

  // ── 4. Fetch user memories (most recent per key) ───────────────────
  const memoriesResult = await sql`
    SELECT DISTINCT ON (key) id, key, value
    FROM user_memories
    WHERE user_id = ${userId}
    ORDER BY key, created_at DESC
  `;
  const memories = memoriesResult.rows;

  // ── 5. Build prompts ───────────────────────────────────────────────
  const run = {
    started_at: row.started_at,
    run_type: row.run_type,
    distance_meters: row.distance_meters,
    duration_seconds: row.duration_seconds,
    avg_heart_rate: row.avg_heart_rate,
    hr_zone_breakdown: row.hr_zone_breakdown,
    splits: row.splits,
    notes: row.notes,
    raw_payload: row.raw_payload,
  };
  const context = {
    sleep_hours: row.sleep_hours,
    sleep_quality: row.sleep_quality,
    energy: row.energy,
    stress: row.stress,
    notes: row.context_notes,
  };
  // Goal: not in schema yet. Step 10 adds the goals table.
  const goal = null;

  const systemPrompt = buildSystemPrompt(TIER);
  const userMessage = buildUserMessage({ run, context, goal, recentRuns, memories });

  // ── 6. Stream from Anthropic ──────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set");
    return new Response("Server misconfigured", { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });

  // Track full content so we can save it on completion.
  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let failed = false;
  let errorMessage = null;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const apiStream = await anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [{ role: "user", content: userMessage }],
        });

        for await (const event of apiStream) {
          if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
            const chunk = event.delta.text;
            fullText += chunk;
            controller.enqueue(encoder.encode(chunk));
          } else if (event.type === "message_delta" && event.usage) {
            if (event.usage.output_tokens) outputTokens = event.usage.output_tokens;
          } else if (event.type === "message_start" && event.message?.usage) {
            const u = event.message.usage;
            inputTokens = u.input_tokens || 0;
            outputTokens = u.output_tokens || 0;
            console.log(`[debrief] tokens — input: ${u.input_tokens}, cache_write: ${u.cache_creation_input_tokens ?? 0}, cache_read: ${u.cache_read_input_tokens ?? 0}, output: ${u.output_tokens}`);
          }
        }
      } catch (err) {
        console.error("Anthropic stream error:", err);
        failed = true;
        errorMessage = err.message || "stream error";
        const errChunk = "\n\n[Debrief generation failed. Try again.]";
        fullText += errChunk;
        controller.enqueue(encoder.encode(errChunk));
      } finally {
        controller.close();

        // Persist to DB after stream closes. Fire-and-forget (don't block response).
        // upsert so a partial regeneration overwrites.
        try {
          await sql`
            INSERT INTO debriefs (
              run_id, user_id, tier_at_generation, prompt_version, model,
              content, input_tokens, output_tokens, status, error_message
            ) VALUES (
              ${runId}, ${userId}, ${TIER}, ${PROMPT_VERSION}, ${MODEL},
              ${fullText}, ${inputTokens || null}, ${outputTokens || null},
              ${failed ? "failed" : "complete"}, ${errorMessage}
            )
            ON CONFLICT (run_id) DO UPDATE SET
              content = EXCLUDED.content,
              input_tokens = EXCLUDED.input_tokens,
              output_tokens = EXCLUDED.output_tokens,
              status = EXCLUDED.status,
              error_message = EXCLUDED.error_message,
              tier_at_generation = EXCLUDED.tier_at_generation,
              prompt_version = EXCLUDED.prompt_version,
              model = EXCLUDED.model,
              updated_at = now()
          `;
        } catch (dbErr) {
          console.error("debrief save error:", dbErr);
        }

        // Extract and persist memories after the debrief saves.
        // Awaited here even though stream is already closed — fire-and-forget
        // is unreliable in serverless after response completes.
        if (!failed) {
          try {
            const runSummary = [
              `Date: ${row.started_at}`,
              `Type: ${row.run_type}`,
              `Distance: ${row.distance_meters ? (row.distance_meters / 1609.344).toFixed(1) : "?"} miles`,
            ].join(", ");
            const notes = [row.notes, row.context_notes].filter(Boolean).join(" | ");

            const facts = await extractMemories({ runSummary, debrief: fullText, notes });
            for (const { key, value } of facts) {
              await sql`
                INSERT INTO user_memories (user_id, key, value, run_id)
                VALUES (${userId}, ${key}, ${value}, ${runId})
              `;
            }
            if (facts.length > 0) {
              console.log(`[memory] extracted ${facts.length} facts for run ${runId}`);
            }
          } catch (memErr) {
            console.error("[memory] extraction error:", memErr.message);
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

import { getServerSession } from "next-auth";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { rows } = await sql`
    SELECT id, key, value, source, run_id, created_at
    FROM user_memories
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
  `;

  return Response.json(rows);
}

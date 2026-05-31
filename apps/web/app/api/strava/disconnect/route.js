import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/auth";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  const { rows } = await sql`
    SELECT access_token FROM strava_connections
    WHERE user_id = ${userId} AND disconnected_at IS NULL
    LIMIT 1
  `;

  if (rows.length > 0) {
    try {
      await fetch("https://www.strava.com/oauth/deauthorize", {
        method: "POST",
        headers: { Authorization: `Bearer ${rows[0].access_token}` },
      });
    } catch (err) {
      console.error("Strava deauth failed:", err);
    }
  }

  await sql`
    UPDATE strava_connections SET disconnected_at = now(), updated_at = now()
    WHERE user_id = ${userId} AND disconnected_at IS NULL
  `;

  return NextResponse.json({ ok: true });
}

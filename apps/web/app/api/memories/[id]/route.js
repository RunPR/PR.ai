import { getServerSession } from "next-auth";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/auth";

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { rowCount } = await sql`
    DELETE FROM user_memories
    WHERE id = ${params.id} AND user_id = ${session.user.id}
  `;

  if (rowCount === 0) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(null, { status: 204 });
}

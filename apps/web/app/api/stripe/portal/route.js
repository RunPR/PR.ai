import { getServerSession } from "next-auth";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { rows } = await sql`
    SELECT stripe_customer_id FROM users WHERE id = ${session.user.id} LIMIT 1
  `;
  const user = rows[0];

  if (!user?.stripe_customer_id) {
    return new Response("No billing account found", { status: 404 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${baseUrl}/dashboard/settings`,
  });

  return Response.json({ url: portalSession.url });
}

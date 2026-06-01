import { getServerSession } from "next-auth";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/auth";
import { stripe, PRICE_ID } from "@/lib/stripe";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { rows } = await sql`
    SELECT email, stripe_customer_id FROM users WHERE id = ${session.user.id} LIMIT 1
  `;
  const user = rows[0];
  if (!user) return new Response("Not found", { status: 404 });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    ...(user.stripe_customer_id
      ? { customer: user.stripe_customer_id }
      : { customer_email: user.email }),
    success_url: `${baseUrl}/dashboard/settings?upgraded=1`,
    cancel_url: `${baseUrl}/dashboard/settings`,
    metadata: { user_id: session.user.id },
    allow_promotion_codes: true,
  });

  return Response.json({ url: checkoutSession.url });
}

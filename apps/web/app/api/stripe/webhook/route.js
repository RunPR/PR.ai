import { sql } from "@vercel/postgres";
import { stripe } from "@/lib/stripe";

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object;
        if (cs.mode !== "subscription") break;

        const userId = cs.metadata?.user_id;
        if (!userId) {
          console.error("[webhook] checkout.session.completed missing user_id metadata");
          break;
        }

        await sql`
          UPDATE users SET
            tier = 'paid',
            stripe_customer_id = ${cs.customer},
            stripe_subscription_id = ${cs.subscription},
            updated_at = now()
          WHERE id = ${userId}
        `;
        console.log(`[webhook] user ${userId} upgraded to paid`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await sql`
          UPDATE users SET
            tier = 'free',
            stripe_subscription_id = NULL,
            updated_at = now()
          WHERE stripe_customer_id = ${sub.customer}
        `;
        console.log(`[webhook] subscription cancelled for customer ${sub.customer}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        if (sub.status === "active") {
          await sql`
            UPDATE users SET tier = 'paid', updated_at = now()
            WHERE stripe_customer_id = ${sub.customer} AND tier != 'paid'
          `;
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}

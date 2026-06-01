import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const PRICE_ID = "price_1TdKw5Rq3u3mn7SwxEjGQznz";
export const TRIAL_DAYS = 14;

export const PAID_MODEL = "claude-sonnet-4-6";
export const FREE_MODEL = "claude-haiku-4-5-20251001";

export function getEffectiveTier(user) {
  if (user.tier === "paid") return "paid";
  if (user.tier === "trial") {
    const trialEnd = new Date(user.trial_started_at);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
    if (trialEnd > new Date()) return "paid";
  }
  return "free";
}

export function trialDaysRemaining(user) {
  if (user.tier !== "trial") return 0;
  const trialEnd = new Date(user.trial_started_at);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
  const ms = trialEnd - new Date();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

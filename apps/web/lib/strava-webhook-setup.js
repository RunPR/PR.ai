// One-time helper to register your Strava webhook subscription.
// Run once AFTER deploying the app to production (Strava can't reach localhost).
//
// Usage:
//   PROD_URL=https://your-app.vercel.app node lib/strava-webhook-setup.js
//
// To list:   node lib/strava-webhook-setup.js --list
// To delete: node lib/strava-webhook-setup.js --delete <subscription_id>

require("dotenv").config({ path: ".env.local" });

const clientId = process.env.STRAVA_CLIENT_ID;
const clientSecret = process.env.STRAVA_CLIENT_SECRET;
const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
const prodUrl = process.env.PROD_URL || process.env.NEXTAUTH_URL;

if (!clientId || !clientSecret) {
  console.error("Missing STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET");
  process.exit(1);
}

const SUB_URL = "https://www.strava.com/api/v3/push_subscriptions";
const args = process.argv.slice(2);

async function listSubs() {
  const url = `${SUB_URL}?client_id=${clientId}&client_secret=${clientSecret}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

async function deleteSub(id) {
  const url = `${SUB_URL}/${id}?client_id=${clientId}&client_secret=${clientSecret}`;
  const res = await fetch(url, { method: "DELETE" });
  console.log(res.ok ? `Deleted subscription ${id}` : `Failed: ${res.status}`);
}

async function createSub() {
  if (!prodUrl || !verifyToken) {
    console.error("Need PROD_URL and STRAVA_WEBHOOK_VERIFY_TOKEN");
    process.exit(1);
  }
  const callback = `${prodUrl.replace(/\/$/, "")}/api/strava/webhook`;
  console.log(`Creating webhook subscription: ${callback}`);

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    callback_url: callback,
    verify_token: verifyToken,
  });

  const res = await fetch(SUB_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Failed:", data);
    process.exit(1);
  }
  console.log("✓ Webhook created:", data);
}

(async () => {
  if (args[0] === "--list") {
    await listSubs();
  } else if (args[0] === "--delete") {
    await deleteSub(args[1]);
  } else {
    await createSub();
  }
})();

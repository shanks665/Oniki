/**
 * Stripe integration smoke test.
 *
 * Checks env → Stripe API → checkout session → webhook guard → (optional) portal.
 *
 * Usage:
 *   node scripts/test-stripe.mjs [email] [password] [baseUrl]
 *
 * Defaults:
 *   email/password = baroath@demo.bar / demo1234
 *   baseUrl        = http://localhost:3000  (or NEXT_PUBLIC_APP_URL)
 *
 * Requires .env.local with test-mode Stripe keys filled in.
 */
import { readFileSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

function loadEnvFile(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function parseEnv(content) {
  const out = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v.replace(/\\n/g, "\n");
  }
  return out;
}

const env = {
  ...parseEnv(loadEnvFile(".env")),
  ...parseEnv(loadEnvFile(".env.local")),
};

const email = process.argv[2] || "baroath@demo.bar";
const password = process.argv[3] || "demo1234";
const baseUrl = (process.argv[4] || env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

let passed = 0;
let failed = 0;
let skipped = 0;

function pass(msg) {
  passed++;
  console.log(`  PASS  ${msg}`);
}
function fail(msg, detail) {
  failed++;
  console.log(`  FAIL  ${msg}`);
  if (detail) console.log(`        ${detail}`);
}
function skip(msg) {
  skipped++;
  console.log(`  SKIP  ${msg}`);
}

function mask(v) {
  if (!v) return "(empty)";
  if (v.length <= 12) return v.slice(0, 4) + "…";
  return v.slice(0, 10) + "…" + v.slice(-4);
}

async function signIn(apiKey) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.idToken;
}

async function main() {
  console.log("=== Stripe smoke test ===\n");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Account:  ${email}\n`);

  // ── 1. Env ──────────────────────────────────────────────
  console.log("1. Environment variables");
  const required = [
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_ID",
    "STRIPE_PRICE_ID_PRIORITY",
    "NEXT_PUBLIC_FIREBASE_API_KEY",
  ];

  let envOk = true;
  for (const key of required) {
    const v = env[key] || "";
    if (!v) {
      fail(`${key} is missing/empty`);
      envOk = false;
    } else {
      pass(`${key} = ${mask(v)}`);
    }
  }

  if (env.STRIPE_SECRET_KEY?.startsWith("sk_live")) {
    fail("STRIPE_SECRET_KEY is LIVE mode — use sk_test_ for this script");
    envOk = false;
  } else if (env.STRIPE_SECRET_KEY?.startsWith("sk_test")) {
    pass("STRIPE_SECRET_KEY is test mode");
  }

  if (env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test")) {
    pass("Publishable key is test mode");
  } else if (env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    fail("Publishable key is not pk_test_…");
    envOk = false;
  }

  if (!envOk) {
    console.log(`\nFill Stripe keys in .env.local (see .env.example), then re-run.`);
    console.log(`\nResult: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    process.exit(1);
  }

  // ── 2. Stripe API ───────────────────────────────────────
  console.log("\n2. Stripe API (prices)");
  const Stripe = require("stripe");
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  });

  for (const [label, priceId] of [
    ["premium", env.STRIPE_PRICE_ID],
    ["priority", env.STRIPE_PRICE_ID_PRIORITY],
  ]) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      if (!price.active) {
        fail(`${label} price ${priceId} exists but is inactive`);
      } else {
        pass(
          `${label}: ${price.id} ${price.unit_amount ?? "?"} ${price.currency} / ${price.recurring?.interval ?? "one-time"}`
        );
      }
    } catch (e) {
      fail(`${label} price retrieve failed`, e instanceof Error ? e.message : String(e));
    }
  }

  // ── 3. App reachability ─────────────────────────────────
  console.log("\n3. App server");
  let serverUp = false;
  try {
    const res = await fetch(`${baseUrl}/`, { redirect: "manual" });
    if (res.status >= 200 && res.status < 500) {
      pass(`GET ${baseUrl}/ → ${res.status}`);
      serverUp = true;
    } else {
      fail(`GET ${baseUrl}/ → ${res.status}`);
    }
  } catch (e) {
    fail(
      `Cannot reach ${baseUrl}`,
      e instanceof Error ? e.message : String(e)
    );
  }

  if (!serverUp) {
    skip("Checkout/portal/webhook HTTP tests (start: npm run dev)");
    console.log(`\nResult: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    process.exit(failed ? 1 : 0);
  }

  // ── 4. Webhook signature guard ──────────────────────────
  console.log("\n4. Webhook rejects invalid signature");
  try {
    const res = await fetch(`${baseUrl}/api/stripe/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1,v1=invalid",
      },
      body: JSON.stringify({ id: "evt_test_invalid" }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 400) {
      pass(`webhook without valid sig → 400 (${body.error || "ok"})`);
    } else {
      fail(`webhook expected 400, got ${res.status}`, JSON.stringify(body));
    }
  } catch (e) {
    fail("webhook request failed", e instanceof Error ? e.message : String(e));
  }

  try {
    const res = await fetch(`${baseUrl}/api/stripe/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (res.status === 400) {
      pass("webhook without stripe-signature → 400");
    } else {
      fail(`webhook no-sig expected 400, got ${res.status}`);
    }
  } catch (e) {
    fail("webhook no-sig request failed", e instanceof Error ? e.message : String(e));
  }

  // ── 5. Auth + checkout ──────────────────────────────────
  console.log("\n5. Checkout session (premium + priority)");
  let idToken;
  try {
    idToken = await signIn(env.NEXT_PUBLIC_FIREBASE_API_KEY);
    pass("Firebase sign-in OK");
  } catch (e) {
    fail("Firebase sign-in failed", e instanceof Error ? e.message : String(e));
    console.log(`\nResult: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    process.exit(1);
  }

  const meRes = await fetch(`${baseUrl}/api/store/me`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const me = await meRes.json();
  if (!me.store?.id) {
    fail("/api/store/me returned no store", JSON.stringify(me));
    console.log(`\nResult: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    process.exit(1);
  }
  pass(`store ${me.store.name} (${me.store.id}) plan=${me.store.plan} sub=${me.store.subscriptionStatus}`);

  for (const tier of ["premium", "priority"]) {
    const res = await fetch(`${baseUrl}/api/stripe/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ storeId: me.store.id, tier }),
    });
    const data = await res.json();
    if (res.ok && data.url?.includes("checkout.stripe.com")) {
      pass(`${tier} checkout URL created`);
      console.log(`        ${data.url.slice(0, 80)}…`);
    } else if (res.status === 400 && /既にこのプラン/.test(data.error || "")) {
      pass(`${tier} already subscribed (expected for active store)`);
    } else {
      fail(`${tier} checkout → ${res.status}`, JSON.stringify(data));
    }
  }

  // Unauthorized checkout
  {
    const res = await fetch(`${baseUrl}/api/stripe/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: me.store.id, tier: "premium" }),
    });
    if (res.status === 401) pass("checkout without auth → 401");
    else fail(`checkout without auth expected 401, got ${res.status}`);
  }

  // ── 6. Portal ───────────────────────────────────────────
  console.log("\n6. Customer portal");
  {
    const res = await fetch(`${baseUrl}/api/stripe/portal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ storeId: me.store.id }),
    });
    const data = await res.json();
    if (res.ok && data.url?.includes("billing.stripe.com")) {
      pass("portal URL created");
      console.log(`        ${data.url.slice(0, 80)}…`);
    } else if (res.status === 400 && /No Stripe customer/.test(data.error || "")) {
      pass("portal correctly blocked (no stripeCustomerId yet)");
    } else {
      fail(`portal → ${res.status}`, JSON.stringify(data));
    }
  }

  console.log(`\n=== Result: ${passed} passed, ${failed} failed, ${skipped} skipped ===`);
  if (failed === 0) {
    console.log(`
Next (manual E2E with test card):
  1. Open ${baseUrl}/login  →  ${email} / ${password}
  2. Go to /dashboard/billing → start checkout
  3. Card: 4242 4242 4242 4242  / any future expiry / any CVC
  4. Confirm Firestore store.subscriptionStatus updates via webhook
     (local: stripe listen --forward-to ${baseUrl}/api/stripe/webhook)
`);
  }
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Verify store owners cannot escalate plan / subscription via client Firestore.
 *
 * Usage:
 *   node scripts/test-store-rules.mjs [email] [password]
 *
 * Defaults to seed demo account: baroath@demo.bar / demo1234
 */
import { readFileSync } from "fs";

function loadEnvValue(key) {
  const content = readFileSync(".env.local", "utf8");
  const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
  if (!match) return null;
  return match[1].trim().replace(/^"|"$/g, "");
}

const API_KEY = loadEnvValue("NEXT_PUBLIC_FIREBASE_API_KEY");
const PROJECT_ID = loadEnvValue("FIREBASE_PROJECT_ID") || loadEnvValue("NEXT_PUBLIC_FIREBASE_PROJECT_ID");

if (!API_KEY || !PROJECT_ID) {
  console.error("Missing NEXT_PUBLIC_FIREBASE_API_KEY or FIREBASE_PROJECT_ID in .env.local");
  process.exit(1);
}

const email = process.argv[2] || "baroath@demo.bar";
const password = process.argv[3] || "demo1234";

async function signIn(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Sign in failed: ${data.error.message}`);
  return { idToken: data.idToken, localId: data.localId };
}

async function findStoreId(idToken, ownerId) {
  const url = new URL(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`
  );
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "stores" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "ownerId" },
            op: "EQUAL",
            value: { stringValue: ownerId },
          },
        },
        limit: 1,
      },
    }),
  });
  const rows = await res.json();
  if (!Array.isArray(rows) || !rows[0]?.document) {
    throw new Error(`No store found for owner ${ownerId}: ${JSON.stringify(rows)}`);
  }
  const name = rows[0].document.name; // projects/.../documents/stores/{id}
  const storeId = name.split("/").pop();
  const fields = rows[0].document.fields || {};
  return {
    storeId,
    plan: fields.plan?.stringValue,
    subscriptionStatus: fields.subscriptionStatus?.stringValue ?? null,
    isActive: fields.isActive?.booleanValue,
    name: fields.name?.stringValue,
  };
}

async function clientPatch(idToken, storeId, fieldPaths, fields) {
  const mask = fieldPaths.map((p) => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join("&");
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/stores/${storeId}?${mask}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });
  const body = await res.json();
  return { status: res.status, body };
}

function assertDenied(label, result) {
  const denied =
    result.status === 403 ||
    result.body?.error?.status === "PERMISSION_DENIED" ||
    String(result.body?.error?.message || "").includes("PERMISSION_DENIED");

  if (denied) {
    console.log(`  PASS  ${label} → PERMISSION_DENIED (${result.status})`);
    return true;
  }
  console.log(`  FAIL  ${label} → expected deny, got ${result.status}`);
  console.log(`        ${JSON.stringify(result.body).slice(0, 300)}`);
  return false;
}

async function main() {
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Account: ${email}\n`);

  console.log("1. Sign in as store owner...");
  const { idToken, localId } = await signIn(email, password);
  console.log(`   uid: ${localId}`);

  console.log("\n2. Load owned store (client read)...");
  const store = await findStoreId(idToken, localId);
  console.log(`   store: ${store.name} (${store.storeId})`);
  console.log(`   plan=${store.plan} subscriptionStatus=${store.subscriptionStatus} isActive=${store.isActive}`);

  console.log("\n3. Attempt billing escalation via client PATCH (should all fail)...");
  let ok = true;

  ok =
    assertDenied(
      "set plan=priority",
      await clientPatch(idToken, store.storeId, ["plan"], {
        plan: { stringValue: "priority" },
      })
    ) && ok;

  ok =
    assertDenied(
      "set subscriptionStatus=active",
      await clientPatch(idToken, store.storeId, ["subscriptionStatus"], {
        subscriptionStatus: { stringValue: "active" },
      })
    ) && ok;

  ok =
    assertDenied(
      "set isActive=true",
      await clientPatch(idToken, store.storeId, ["isActive"], {
        isActive: { booleanValue: true },
      })
    ) && ok;

  ok =
    assertDenied(
      "set status=available (client status write)",
      await clientPatch(idToken, store.storeId, ["status"], {
        status: { stringValue: "available" },
      })
    ) && ok;

  ok =
    assertDenied(
      "set googleMapsDirectionUrl=javascript:alert(1)",
      await clientPatch(idToken, store.storeId, ["googleMapsDirectionUrl"], {
        googleMapsDirectionUrl: { stringValue: "javascript:alert(1)" },
      })
    ) && ok;

  console.log("\n4. Re-read store to confirm fields unchanged...");
  const after = await findStoreId(idToken, localId);
  const unchanged =
    after.plan === store.plan &&
    after.subscriptionStatus === store.subscriptionStatus &&
    after.isActive === store.isActive;

  if (unchanged) {
    console.log("  PASS  plan / subscriptionStatus / isActive unchanged");
  } else {
    console.log("  FAIL  fields changed after denied writes");
    console.log(`        before: ${JSON.stringify(store)}`);
    console.log(`        after:  ${JSON.stringify(after)}`);
    ok = false;
  }

  console.log(ok ? "\nAll checks passed." : "\nSome checks failed.");
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

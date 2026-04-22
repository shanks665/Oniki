import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const envContent = readFileSync(".env.local", "utf8");
function env(key) {
  const m = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^"|"$/g, "") : null;
}

const pk = env("FIREBASE_PRIVATE_KEY");

const app = initializeApp({
  credential: cert({
    projectId: env("FIREBASE_PROJECT_ID"),
    clientEmail: env("FIREBASE_CLIENT_EMAIL"),
    privateKey: pk.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(app);
const snap = await db.collection("stores").get();

console.log(`=== 全${snap.size}店舗のseatCapacity / seatDetail ===\n`);

snap.forEach((doc) => {
  const d = doc.data();
  const cap = d.seatCapacity;
  const det = d.seatDetail;

  console.log(`--- ${d.name} (ID: ${doc.id})`);
  console.log(`  seatCapacity: ${JSON.stringify(cap)}`);
  console.log(`  seatDetail:   ${JSON.stringify(det)}`);

  if (cap && det) {
    const ca = det.counterAvailable ?? 0;
    const ta = det.tableAvailable ?? 0;
    if (ca > cap.counterTotal) console.log(`  ⚠️  counterAvailable(${ca}) > counterTotal(${cap.counterTotal})`);
    if (ta > cap.tableTotal) console.log(`  ⚠️  tableAvailable(${ta}) > tableTotal(${cap.tableTotal})`);
  }
  if (!cap) console.log(`  ⚠️  seatCapacity が null`);
  console.log();
});

process.exit(0);

import { readFileSync } from "fs";

function loadEnvValue(key) {
  const content = readFileSync(".env.local", "utf8");
  const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
  return match ? match[1].trim() : null;
}

const API_KEY = loadEnvValue("NEXT_PUBLIC_FIREBASE_API_KEY");
if (!API_KEY) { console.error("API key not found in .env.local"); process.exit(1); }
const BASE = "http://localhost:3005";

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
  return data.idToken;
}

async function testStoreMe(token) {
  const res = await fetch(`${BASE}/api/store/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
}

async function main() {
  const email = process.argv[2] || "baroath@demo.bar";
  const password = process.argv[3] || "demo1234";

  console.log(`Testing with: ${email}`);
  
  console.log("\n1. Signing in...");
  const token = await signIn(email, password);
  console.log("   Token obtained (first 50 chars):", token.substring(0, 50) + "...");

  console.log("\n2. Calling /api/store/me...");
  const result = await testStoreMe(token);
  console.log("   Result:", JSON.stringify(result, null, 2));
  
  if (result.store) {
    console.log("\n   Store found:", result.store.name);
    console.log("   Store ID:", result.store.id);
    console.log("   Owner ID:", result.store.ownerId);
  } else {
    console.log("\n   NO STORE FOUND for this user.");
  }
}

main().catch(console.error);

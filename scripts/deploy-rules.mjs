import { readFileSync } from "fs";
import { createSign } from "crypto";

function loadEnvValue(key) {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, "m"));
  return match ? match[1].trim() : null;
}

const envContent = readFileSync(".env.local", "utf8");
const SA_EMAIL = loadEnvValue("FIREBASE_CLIENT_EMAIL");
const PROJECT_ID = loadEnvValue("FIREBASE_PROJECT_ID");

if (!SA_EMAIL || !PROJECT_ID) {
  console.error("Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PROJECT_ID in .env.local");
  process.exit(1);
}

function loadEnv() {
  const content = readFileSync(".env.local", "utf8");
  const match = content.match(/FIREBASE_PRIVATE_KEY="([\s\S]*?)"/);
  if (!match) throw new Error("Could not find FIREBASE_PRIVATE_KEY in .env.local");
  return match[1].replace(/\\n/g, "\n");
}

const privateKey = loadEnv();

// Create a JWT to get an access token
function createJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: SA_EMAIL,
    scope: "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url");
  
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(privateKey, "base64url");
  
  return `${header}.${payload}.${signature}`;
}

async function getAccessToken() {
  const jwt = createJwt();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get token: " + JSON.stringify(data));
  return data.access_token;
}

async function deployFirestoreRules(token) {
  const rulesSource = readFileSync("firebase/firestore.rules", "utf8");
  
  // 1. Create ruleset
  const createRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: {
          files: [{ name: "firestore.rules", content: rulesSource }],
        },
      }),
    }
  );
  
  const rulesetData = await createRes.json();
  if (!rulesetData.name) {
    throw new Error("Failed to create ruleset: " + JSON.stringify(rulesetData));
  }
  console.log("Ruleset created:", rulesetData.name);
  
  // 2. Release (activate) the ruleset
  const releaseName = `projects/${PROJECT_ID}/releases/cloud.firestore`;
  
  // Try update first, then create
  let releaseRes = await fetch(
    `https://firebaserules.googleapis.com/v1/${releaseName}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        release: {
          name: releaseName,
          rulesetName: rulesetData.name,
        },
      }),
    }
  );
  
  if (!releaseRes.ok) {
    releaseRes = await fetch(
      `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: releaseName,
          rulesetName: rulesetData.name,
        }),
      }
    );
  }
  
  const releaseData = await releaseRes.json();
  if (releaseRes.ok) {
    console.log("Firestore rules deployed successfully!");
  } else {
    throw new Error("Failed to release: " + JSON.stringify(releaseData));
  }
}

async function deployStorageRules(token) {
  const rulesSource = readFileSync("firebase/storage.rules", "utf8");
  
  const createRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: {
          files: [{ name: "storage.rules", content: rulesSource }],
        },
      }),
    }
  );
  
  const rulesetData = await createRes.json();
  if (!rulesetData.name) {
    throw new Error("Failed to create storage ruleset: " + JSON.stringify(rulesetData));
  }
  console.log("Storage ruleset created:", rulesetData.name);
  
  const releaseName = `projects/${PROJECT_ID}/releases/firebase.storage/${PROJECT_ID}.firebasestorage.app`;
  
  let releaseRes = await fetch(
    `https://firebaserules.googleapis.com/v1/${releaseName}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        release: {
          name: releaseName,
          rulesetName: rulesetData.name,
        },
      }),
    }
  );
  
  if (!releaseRes.ok) {
    releaseRes = await fetch(
      `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: releaseName,
          rulesetName: rulesetData.name,
        }),
      }
    );
  }
  
  const releaseData = await releaseRes.json();
  if (releaseRes.ok) {
    console.log("Storage rules deployed successfully!");
  } else {
    console.warn("Storage rules deployment may have issues:", JSON.stringify(releaseData));
  }
}

async function main() {
  console.log("Getting access token...");
  const token = await getAccessToken();
  
  console.log("\nDeploying Firestore rules...");
  await deployFirestoreRules(token);
  
  console.log("\nDeploying Storage rules...");
  await deployStorageRules(token);
}

main().catch(console.error);

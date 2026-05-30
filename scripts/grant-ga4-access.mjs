/**
 * One-time script: grant the service account viewer access to the GA4 property.
 * Uses direct REST calls to the Analytics Admin API (avoids googleapis client issues).
 */

import { google } from "googleapis";
import http from "http";

const PROPERTY_ID = "530156420";
const SERVICE_ACCOUNT_EMAIL = "bar-guide-analytics@bar-kuma.iam.gserviceaccount.com";
const REDIRECT_URI = "http://localhost:3333/oauth2callback";
const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("ERROR: OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET are required.");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/analytics.manage.users"],
});

console.log("\n🔗 ブラウザで以下のURLを開いてください:\n");
console.log(authUrl);
console.log("\n（承認後、自動的に処理が続きます）\n");

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/oauth2callback")) return;

  const url = new URL(req.url, "http://localhost:3333");
  const code = url.searchParams.get("code");

  if (!code) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Error: no code received.");
    server.close();
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("OK - check your terminal.");
  server.close();

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get a fresh access token
    const { token } = await oauth2Client.getAccessToken();

    // Try userLinks first (v1alpha), fall back to accessBindings (newer)
    const body = JSON.stringify({
      emailAddress: SERVICE_ACCOUNT_EMAIL,
      directRoles: ["predefinedRoles/viewer"],
    });

    // Attempt 1: properties.userLinks (legacy but still in v1alpha)
    let res1 = await fetch(
      `https://analyticsadmin.googleapis.com/v1alpha/properties/${PROPERTY_ID}/userLinks`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body,
      }
    );

    if (res1.status === 404 || res1.status === 405) {
      console.log("userLinks not available, trying accessBindings...");
      // Attempt 2: accessBindings (newer GA4 Admin API)
      res1 = await fetch(
        `https://analyticsadmin.googleapis.com/v1alpha/properties/${PROPERTY_ID}/accessBindings`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            user: SERVICE_ACCOUNT_EMAIL,
            roles: ["predefinedRoles/viewer"],
          }),
        }
      );
    }

    const data = await res1.json();

    if (res1.ok) {
      console.log("\n✅ サービスアカウントに GA4 閲覧者権限を付与しました:");
      console.log(JSON.stringify(data, null, 2));
      process.exit(0);
    } else {
      console.error("\n❌ 失敗 (HTTP", res1.status, "):");
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }
  } catch (err) {
    console.error("\n❌ 例外:", err.message);
    process.exit(1);
  }
});

server.listen(3333, () => {
  console.log("Waiting for OAuth2 callback on http://localhost:3333 ...\n");
});

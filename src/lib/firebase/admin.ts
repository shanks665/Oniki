import { initializeApp, getApps, cert, type App, type Credential } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

/** Strip wrapping quotes / whitespace that Vercel or .env files sometimes add. */
function env(key: string): string {
  const raw = process.env[key];
  if (!raw) return "";
  let v = raw.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v.trim();
}

function buildCredential(): Credential {
  // Prefer explicit Admin env vars; fall back to public project id / GA SA JSON.
  let projectId =
    env("FIREBASE_PROJECT_ID") || env("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  let clientEmail = env("FIREBASE_CLIENT_EMAIL");
  let privateKey = env("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  if ((!projectId || !clientEmail || !privateKey) && env("GOOGLE_SERVICE_ACCOUNT_JSON")) {
    try {
      const sa = JSON.parse(env("GOOGLE_SERVICE_ACCOUNT_JSON")) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      projectId = projectId || sa.project_id || "";
      clientEmail = clientEmail || sa.client_email || "";
      privateKey = privateKey || (sa.private_key || "").replace(/\\n/g, "\n");
    } catch {
      // ignore parse errors; validation below reports a clear message
    }
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials are incomplete. Set FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID), FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY on the server (available at runtime)."
    );
  }

  return cert({
    projectId,
    clientEmail,
    privateKey,
  });
}

function getAdminApp(): App {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  _app = initializeApp({
    credential: buildCredential(),
  });
  return _app;
}

export function getAdminAuth(): Auth {
  if (!_auth) _auth = getAuth(getAdminApp());
  return _auth;
}

export function getAdminDb(): Firestore {
  if (!_db) _db = getFirestore(getAdminApp());
  return _db;
}

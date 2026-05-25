import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _rtdb: Database | null = null;

function getApp(): FirebaseApp {
  if (_app) return _app;
  _app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return _app;
}

/**
 * Auth must persist across reloads. Default `getAuth()` may silently fall back
 * to `inMemoryPersistence` in some browsers (Safari private mode, embedded
 * webviews), which causes the login state to be lost the moment a tab is
 * suspended or the page is reloaded. Explicitly request the strongest
 * persistence available.
 */
export function getClientAuth(): Auth {
  if (_auth) return _auth;
  const app = getApp();
  if (typeof window === "undefined") {
    _auth = getAuth(app);
    return _auth;
  }
  try {
    _auth = initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
      ],
    });
  } catch {
    // initializeAuth throws if Auth was already initialized for this app.
    _auth = getAuth(app);
  }
  return _auth;
}

export function getClientDb(): Firestore {
  if (!_db) _db = getFirestore(getApp());
  return _db;
}

export function getClientStorage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(getApp());
  return _storage;
}

export function getClientRtdb(): Database {
  if (!_rtdb) _rtdb = getDatabase(getApp());
  return _rtdb;
}

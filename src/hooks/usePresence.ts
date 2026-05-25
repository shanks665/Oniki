"use client";

import { useEffect } from "react";
import { ref, set, onDisconnect, serverTimestamp } from "firebase/database";
import { getClientRtdb } from "@/lib/firebase/config";

let _sessionId: string | null = null;

function getSessionId(): string {
  if (_sessionId) return _sessionId;
  // Reuse across remounts within the same page session
  const stored = sessionStorage.getItem("_presenceSessionId");
  if (stored) {
    _sessionId = stored;
    return _sessionId;
  }
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  sessionStorage.setItem("_presenceSessionId", id);
  _sessionId = id;
  return _sessionId;
}

/**
 * Registers this browser tab as an active viewer of the given store in
 * Firebase Realtime Database. The entry is automatically removed when the
 * tab disconnects (onDisconnect), or when the component unmounts.
 */
export function usePresence(storeId: string) {
  useEffect(() => {
    if (!storeId || typeof window === "undefined") return;
    if (!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) return;

    const sessionId = getSessionId();
    const db = getClientRtdb();
    const presenceRef = ref(db, `presence/${storeId}/${sessionId}`);

    // Write our presence and schedule automatic cleanup on disconnect
    set(presenceRef, { connectedAt: serverTimestamp() }).catch(console.error);
    onDisconnect(presenceRef).remove().catch(console.error);

    return () => {
      // Manual cleanup when navigating away (component unmounts)
      set(presenceRef, null).catch(console.error);
    };
  }, [storeId]);
}

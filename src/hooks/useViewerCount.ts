"use client";

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { getClientRtdb } from "@/lib/firebase/config";

/**
 * Subscribes to the real-time viewer count for a store.
 * Returns 0 when the RTDB is not configured or while loading.
 */
export function useViewerCount(storeId: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!storeId || typeof window === "undefined") return;
    if (!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) return;

    const db = getClientRtdb();
    const presenceRef = ref(db, `presence/${storeId}`);

    const unsubscribe = onValue(
      presenceRef,
      (snapshot) => {
        setCount(snapshot.exists() ? snapshot.size : 0);
      },
      (err) => {
        console.error("useViewerCount error:", err);
      }
    );

    return () => unsubscribe();
  }, [storeId]);

  return count;
}

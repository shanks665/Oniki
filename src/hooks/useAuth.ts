"use client";

import { useState, useEffect, useRef } from "react";
import { type User } from "firebase/auth";
import { onAuthChange } from "@/lib/firebase/auth";
import { getClientAuth } from "@/lib/firebase/config";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const nullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      if (nullTimerRef.current) {
        clearTimeout(nullTimerRef.current);
        nullTimerRef.current = null;
      }

      if (u) {
        setUser(u);
        setLoading(false);
      } else {
        // Firebase can briefly emit null when a tab is resumed from suspension
        // or when an ID token is being refreshed. Wait 600 ms and re-check
        // before treating it as a definitive logged-out state.
        nullTimerRef.current = setTimeout(() => {
          const current = getClientAuth().currentUser;
          setUser(current);
          setLoading(false);
        }, 600);
      }
    });

    return () => {
      unsubscribe();
      if (nullTimerRef.current) clearTimeout(nullTimerRef.current);
    };
  }, []);

  return { user, loading };
}

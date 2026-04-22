"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { type User } from "firebase/auth";
import { onAuthChange } from "@/lib/firebase/auth";
import type { Store } from "@/types";

interface StoreAuthState {
  user: User | null;
  store: Store | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const StoreAuthContext = createContext<StoreAuthState>({
  user: null,
  store: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

async function fetchMyStore(user: User): Promise<Store | null> {
  const token = await user.getIdToken();
  const res = await fetch("/api/store/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  const json = await res.json();
  return json.store ?? null;
}

export function StoreAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRef = useRef<User | null>(null);

  const loadStore = useCallback(async (u: User) => {
    try {
      const s = await fetchMyStore(u);
      setStore(s);
      setError(s ? null : "このアカウントに紐づく店舗が見つかりません");
    } catch (e) {
      console.error("Failed to fetch store:", e);
      setError("店舗情報の取得に失敗しました。再度お試しください。");
      setStore(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (u) => {
      setLoading(true);
      setUser(u);
      userRef.current = u;
      if (u) {
        await loadStore(u);
      } else {
        setStore(null);
        setError(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [loadStore]);

  const refresh = useCallback(async () => {
    if (userRef.current) await loadStore(userRef.current);
  }, [loadStore]);

  useEffect(() => {
    if (!userRef.current || !store) return;
    const u = userRef.current;
    const interval = setInterval(() => loadStore(u), 15_000);
    return () => clearInterval(interval);
  }, [store, loadStore]);

  return (
    <StoreAuthContext.Provider value={{ user, store, loading, error, refresh }}>
      {children}
    </StoreAuthContext.Provider>
  );
}

export function useStoreAuthContext() {
  return useContext(StoreAuthContext);
}

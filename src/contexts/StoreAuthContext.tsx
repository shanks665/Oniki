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
  // forceRefresh=true on retry to avoid stale token after long idle.
  const token = await user.getIdToken();
  const res = await fetch("/api/store/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    const fresh = await user.getIdToken(true);
    const retry = await fetch("/api/store/me", {
      headers: { Authorization: `Bearer ${fresh}` },
    });
    if (!retry.ok) {
      throw new Error(`HTTP ${retry.status}: ${await retry.text()}`);
    }
    const json = await retry.json();
    return json.store ?? null;
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.store ?? null;
}

export function StoreAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  // Loading is true until the first auth state is known AND, if a user is
  // present, the store fetch has finished. This prevents pages from briefly
  // observing a (loading=false, user=null) state during the IndexedDB restore
  // window, or a (loading=false, user!=null, store=null) state right after.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRef = useRef<User | null>(null);
  const hasLoadedStoreRef = useRef(false);

  const loadStore = useCallback(async (u: User, opts?: { silent?: boolean }) => {
    try {
      const s = await fetchMyStore(u);
      hasLoadedStoreRef.current = true;
      setStore(s);
      setError(s ? null : "このアカウントに紐づく店舗が見つかりません");
    } catch (e) {
      console.error("Failed to fetch store:", e);
      // Do not clear an existing store on transient failures. This prevents
      // the dashboard from flashing "店舗情報を取得できません" during a
      // network blip or token-refresh race when the user just navigated back
      // to the tab.
      if (opts?.silent && hasLoadedStoreRef.current) return;
      if (!hasLoadedStoreRef.current) {
        setError("店舗情報の取得に失敗しました。再度お試しください。");
        setStore(null);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthChange(async (u) => {
      // Always set the user immediately so consumers see the latest auth state.
      setUser(u);
      userRef.current = u;
      if (u) {
        // Keep loading=true until the store fetch finishes so pages never see
        // the transient state of (user!=null, store=null, loading=false).
        setLoading(true);
        await loadStore(u);
        if (!cancelled) setLoading(false);
      } else {
        hasLoadedStoreRef.current = false;
        setStore(null);
        setError(null);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [loadStore]);

  const refresh = useCallback(async () => {
    if (userRef.current) await loadStore(userRef.current);
  }, [loadStore]);

  // Background refresh every 30 s while a store is loaded. Failures are silent
  // so that one bad fetch doesn't tear down the dashboard.
  useEffect(() => {
    if (!userRef.current || !store) return;
    const u = userRef.current;
    const interval = setInterval(() => loadStore(u, { silent: true }), 30_000);
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

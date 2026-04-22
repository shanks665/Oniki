"use client";

import { useState, useEffect } from "react";
import { subscribeToStores, subscribeToStore } from "@/lib/firebase/firestore";
import type { Store } from "@/types";

export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToStores((data) => {
      setStores(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { stores, loading };
}

export function useStore(storeId: string) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToStore(storeId, (data) => {
      setStore(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [storeId]);

  return { store, loading };
}

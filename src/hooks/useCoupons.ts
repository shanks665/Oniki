"use client";

import { useState, useEffect } from "react";
import {
  subscribeToCoupons,
  subscribeToActiveCoupons,
} from "@/lib/firebase/firestore";
import type { Coupon } from "@/types";

export function useCoupons(storeId: string) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    const unsubscribe = subscribeToCoupons(storeId, (data) => {
      setCoupons(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [storeId]);

  return { coupons, loading };
}

export function useActiveCoupons(storeId: string) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    const unsubscribe = subscribeToActiveCoupons(storeId, (data) => {
      setCoupons(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [storeId]);

  return { coupons, loading };
}

"use client";

import { useState, useEffect } from "react";
import { subscribeToReviews } from "@/lib/firebase/firestore";
import type { Review } from "@/types";

export function useReviews(storeId: string, initialReviews: Review[] = []) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  useEffect(() => {
    if (!storeId) return;
    const unsub = subscribeToReviews(
      storeId,
      (data) => setReviews(data),
    );
    return () => unsub();
  }, [storeId]);

  return { reviews };
}

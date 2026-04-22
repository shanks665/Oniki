"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "barnavi_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch {
      // localStorage unavailable
    }
  }, []);

  const toggleFavorite = useCallback((storeId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (storeId: string) => favorites.includes(storeId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}

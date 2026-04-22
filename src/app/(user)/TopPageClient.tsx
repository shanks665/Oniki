"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { SearchPanel } from "@/components/ui/SearchPanel";
import { StoreCard } from "@/components/ui/StoreCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useStores } from "@/hooks/useStores";
import { getEffectiveStatus, sortStores } from "@/lib/utils";
import { MapPin, Search } from "lucide-react";
import type { Store, Coupon, AreaKey, GenreKey } from "@/types";

interface TopPageClientProps {
  initialStores: Store[];
  initialCouponMap: Record<string, Coupon[]>;
}

export function TopPageClient({ initialStores, initialCouponMap }: TopPageClientProps) {
  const { stores: liveStores, loading } = useStores();
  const { isFavorite, toggleFavorite, favorites } = useFavorites();
  const [hasReceivedLive, setHasReceivedLive] = useState(false);

  useEffect(() => {
    if (liveStores.length > 0 || (!loading && liveStores.length === 0)) {
      setHasReceivedLive(true);
    }
  }, [liveStores, loading]);

  const stores = hasReceivedLive ? liveStores : initialStores;

  const [selectedAreas, setSelectedAreas] = useState<AreaKey[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<GenreKey[]>([]);
  const [hideFullStores, setHideFullStores] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [couponMap, setCouponMap] = useState<Record<string, Coupon[]>>(initialCouponMap);

  useEffect(() => {
    const q = query(
      collection(getClientDb(), "coupons"),
      where("isActive", "==", true)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, Coupon[]> = {};
      snapshot.docs.forEach((doc) => {
        const coupon = { id: doc.id, ...doc.data() } as Coupon;
        if (!map[coupon.storeId]) map[coupon.storeId] = [];
        map[coupon.storeId].push(coupon);
      });
      setCouponMap(map);
    });
    return unsubscribe;
  }, []);

  const filteredStores = useMemo(() => {
    let result = stores;

    if (showFavoritesOnly) {
      result = result.filter((s) => favorites.includes(s.id));
    }

    if (selectedAreas.length > 0) {
      result = result.filter((s) => selectedAreas.includes(s.area as AreaKey));
    }

    if (selectedGenres.length > 0) {
      result = result.filter((s) =>
        selectedGenres.includes(s.genre as GenreKey)
      );
    }

    if (hideFullStores) {
      result = result.filter((s) => {
        const status = getEffectiveStatus(s);
        return status === "available" || status === "slightly_crowded";
      });
    }

    return sortStores(result);
  }, [stores, selectedAreas, selectedGenres, hideFullStores, showFavoritesOnly, favorites]);

  return (
    <>
      {/* Hero section */}
      <div className="relative overflow-hidden border-b border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent" />
        <div className="relative mx-auto max-w-2xl px-4 pb-5 pt-6">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-500/60">
            <MapPin className="h-3 w-3" />
            <span>KUMAMOTO CITY</span>
          </div>
          <h1 className="mt-1 text-[22px] font-extrabold leading-tight tracking-tight text-zinc-100">
            今夜のバーを
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
              リアルタイム
            </span>
            で探す
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
            空席状況がリアルタイムに更新。
            <br className="sm:hidden" />
            今から入れるお店がすぐ見つかる。
          </p>
        </div>
      </div>

      <SearchPanel
        selectedAreas={selectedAreas}
        selectedGenres={selectedGenres}
        hideFullStores={hideFullStores}
        showFavoritesOnly={showFavoritesOnly}
        onAreasChange={setSelectedAreas}
        onGenresChange={setSelectedGenres}
        onHideFullChange={setHideFullStores}
        onFavoritesChange={setShowFavoritesOnly}
      />

      <div className="mx-auto max-w-2xl px-4 py-5">
        {filteredStores.length === 0 && !loading ? (
          <div className="animate-fade-up flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                <Search className="h-7 w-7 text-zinc-700" />
              </div>
            </div>
            <p className="text-[15px] font-semibold text-zinc-400">
              {showFavoritesOnly
                ? "お気に入りの店舗がありません"
                : "条件に合う店舗が見つかりません"}
            </p>
            <p className="mt-1.5 text-[13px] text-zinc-600">
              {showFavoritesOnly
                ? "ハートをタップしてお気に入りに追加しましょう"
                : "絞り込み条件を変更してみてください"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-zinc-600">
                {filteredStores.length} 件の店舗
              </p>
              <div className="flex items-center gap-1 text-[10px] text-zinc-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                リアルタイム更新中
              </div>
            </div>
            {filteredStores.map((store, i) => (
              <div
                key={store.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <StoreCard
                  store={store}
                  isFavorite={isFavorite(store.id)}
                  onToggleFavorite={() => toggleFavorite(store.id)}
                  activeCoupons={couponMap[store.id] || []}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

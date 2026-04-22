"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, doc } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { Crown, Store as StoreIcon } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { AREAS, GENRES } from "@/constants";
import { cn } from "@/lib/utils";
import type { Store, AreaKey, GenreKey } from "@/types";

async function adminUpdateStore(
  token: string,
  storeId: string,
  updates: Record<string, unknown>,
): Promise<boolean> {
  const res = await fetch("/api/admin/update-store", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ storeId, ...updates }),
  });
  return res.ok;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/admin/login");
      return;
    }
    if (!user) return;

    const fdb = getClientDb();
    const adminUnsub = onSnapshot(doc(fdb, "admins", user.uid), (snap) => {
      if (snap.exists()) {
        setIsAdmin(true);
      } else {
        router.replace("/admin/login");
      }
    });

    const storesUnsub = onSnapshot(
      query(collection(fdb, "stores")),
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Store
        );
        setStores(data);
        setLoading(false);
      }
    );

    return () => {
      adminUnsub();
      storesUnsub();
    };
  }, [user, authLoading, router]);

  const handleTogglePlan = useCallback(async (storeId: string, currentPlan: string) => {
    if (!user) return;
    const token = await user.getIdToken();
    const newPlan = currentPlan === "premium" ? "free" : "premium";
    const ok = await adminUpdateStore(token, storeId, { plan: newPlan });
    if (!ok) alert("プラン変更に失敗しました");
  }, [user]);

  const handleToggleActive = useCallback(async (storeId: string, currentActive: boolean) => {
    if (!user) return;
    const token = await user.getIdToken();
    const ok = await adminUpdateStore(token, storeId, { isActive: !currentActive });
    if (!ok) alert("状態変更に失敗しました");
  }, [user]);

  if (authLoading || loading || !isAdmin)
    return <LoadingSpinner className="min-h-screen" />;

  const premiumCount = stores.filter((s) => s.plan === "premium").length;
  const activeCount = stores.filter((s) => s.isActive).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-zinc-100">店舗一覧</h1>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <StoreIcon className="h-4 w-4" />
            <span className="text-xs">総店舗数</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-zinc-100">
            {stores.length}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="text-xs">プレミアム</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-400">
            {premiumCount}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs">アクティブ</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {activeCount}
          </p>
        </div>
      </div>

      {/* Stores list */}
      <div className="space-y-2">
        {stores.map((store) => (
          <div
            key={store.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-zinc-100">{store.name}</h3>
                  {store.plan === "premium" && (
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  {!store.isActive && (
                    <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400">
                      無効
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {AREAS[store.area as AreaKey] || store.area} ·{" "}
                  {GENRES[store.genre as GenreKey] || store.genre}
                </p>
              </div>
              <StatusBadge status={store.status} size="sm" />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => handleTogglePlan(store.id, store.plan)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  store.plan === "premium"
                    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                )}
              >
                {store.plan === "premium"
                  ? "→ フリーに変更"
                  : "→ プレミアムに変更"}
              </button>
              <button
                onClick={() => handleToggleActive(store.id, store.isActive)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  store.isActive
                    ? "bg-zinc-800 text-red-400 hover:bg-zinc-700"
                    : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                )}
              >
                {store.isActive ? "無効にする" : "有効にする"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


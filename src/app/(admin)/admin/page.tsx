"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, doc, where, orderBy } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { Crown, Store as StoreIcon, Flag, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { AREAS, GENRES } from "@/constants";
import { cn, getRelativeTime } from "@/lib/utils";
import type { Store, Review, AreaKey, GenreKey } from "@/types";

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

async function adminDeleteReview(token: string, reviewId: string): Promise<boolean> {
  const res = await fetch("/api/admin/delete-review", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reviewId }),
  });
  return res.ok;
}

type Tab = "stores" | "reviews";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("stores");
  const [stores, setStores] = useState<Store[]>([]);
  const [reportedReviews, setReportedReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (authLoading || user) return;
    // Delay redirect slightly so a transient null (tab resume / token refresh)
    // doesn't kick the admin out before Firebase restores the session.
    const t = setTimeout(() => router.replace("/admin/login"), 700);
    return () => clearTimeout(t);
  }, [authLoading, user, router]);

  const uid = user?.uid;

  // Reset local data state whenever the uid changes so the page never shows
  // stale admin/store data from a previous session while new listeners load.
  useEffect(() => {
    setLoading(true);
    setIsAdmin(false);
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const fdb = getClientDb();
    const adminUnsub = onSnapshot(
      doc(fdb, "admins", uid),
      (snap) => {
        if (snap.exists()) {
          setIsAdmin(true);
        } else {
          // Not an admin: send to login. We do this only on a definitive
          // (non-error) snapshot so a transient permission/network error
          // doesn't kick a logged-in admin off the page.
          router.replace("/admin/login");
        }
      },
      (err) => {
        console.error("admin snapshot error:", err);
      }
    );

    const storesUnsub = onSnapshot(
      query(collection(fdb, "stores")),
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Store
        );
        setStores(data);
        setLoading(false);
      },
      (err) => {
        console.error("stores snapshot error:", err);
        setLoading(false);
      }
    );

    const reviewsUnsub = onSnapshot(
      query(
        collection(fdb, "reviews"),
        where("status", "==", "published"),
        where("reportCount", ">", 0),
        orderBy("reportCount", "desc")
      ),
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Review
        );
        setReportedReviews(data);
      },
      (err) => {
        console.error("reviews snapshot error:", err);
      }
    );

    return () => {
      adminUnsub();
      storesUnsub();
      reviewsUnsub();
    };
  }, [uid, router]);

  const handleToggleActive = useCallback(async (storeId: string, currentActive: boolean) => {
    if (!user) return;
    const token = await user.getIdToken();
    const ok = await adminUpdateStore(token, storeId, { isActive: !currentActive });
    if (!ok) alert("状態変更に失敗しました");
  }, [user]);

  const handleDeleteReview = useCallback(async (reviewId: string) => {
    if (!user) return;
    if (!confirm("この口コミを削除しますか？")) return;
    const token = await user.getIdToken();
    const ok = await adminDeleteReview(token, reviewId);
    if (!ok) alert("削除に失敗しました");
  }, [user]);

  if (authLoading || loading || !isAdmin)
    return <LoadingSpinner className="min-h-screen" />;

  const activeCount = stores.filter((s) => s.isActive).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-zinc-100">管理画面</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("stores")}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
            tab === "stores"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          店舗一覧
        </button>
        <button
          onClick={() => setTab("reviews")}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
            tab === "reviews"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <Flag className="h-3.5 w-3.5" />
          通報された口コミ
          {reportedReviews.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {reportedReviews.length}
            </span>
          )}
        </button>
      </div>

      {tab === "stores" && (
        <>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-2 text-zinc-500">
                <StoreIcon className="h-4 w-4" />
                <span className="text-xs">総店舗数</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-zinc-100">{stores.length}</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-2 text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs">アクティブ</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-emerald-400">{activeCount}</p>
            </div>
          </div>

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
        </>
      )}

      {tab === "reviews" && (
        <div className="space-y-3">
          {reportedReviews.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-600">
              通報された口コミはありません
            </p>
          ) : (
            reportedReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[13px] font-semibold text-zinc-300">
                      {review.authorName}
                    </span>
                    <span className="ml-2 text-[11px] text-zinc-600">
                      ★{review.rating}
                    </span>
                    <span className="ml-2 text-[10px] text-zinc-700">
                      {getRelativeTime(review.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400">
                      <Flag className="h-2.5 w-2.5" />
                      {review.reportCount}件の通報
                    </span>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3 w-3" />
                      削除
                    </button>
                  </div>
                </div>
                <p className="text-[13px] text-zinc-400">{review.body}</p>
                <p className="mt-1 text-[10px] text-zinc-700">
                  storeId: {review.storeId}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

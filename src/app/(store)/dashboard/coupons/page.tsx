"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Ticket } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useStoreAuth } from "@/hooks/useStoreAuth";
import { useCoupons } from "@/hooks/useCoupons";
import { createCoupon, toggleCoupon, deleteCoupon } from "@/lib/firebase/firestore";
import { cn } from "@/lib/utils";

export default function CouponsPage() {
  const router = useRouter();
  const { user, store, loading: authLoading, error: authError } = useStoreAuth();
  const { coupons, loading: couponsLoading } = useCoupons(store?.id || "");

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && store && store.plan !== "premium") {
      router.replace("/dashboard");
    }
  }, [authLoading, user, store, router]);

  const handleCreate = async () => {
    if (!store || !newTitle.trim()) return;
    setCreating(true);
    try {
      await createCoupon(store.id, newTitle.trim(), newDescription.trim());
      setNewTitle("");
      setNewDescription("");
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (couponId: string, currentState: boolean) => {
    try {
      await toggleCoupon(couponId, !currentState);
    } catch {
      alert("クーポンの更新に失敗しました");
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm("このクーポンを削除しますか？")) return;
    try {
      await deleteCoupon(couponId);
    } catch {
      alert("クーポンの削除に失敗しました");
    }
  };

  if (authLoading || (!authError && !store))
    return <LoadingSpinner className="min-h-screen" />;
  if (authError || !store) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="mb-3 text-[15px] font-bold text-red-400">店舗情報を取得できません</p>
        <p className="mb-4 text-[13px] text-zinc-500">{authError || "店舗が見つかりません"}</p>
        <button onClick={() => window.location.reload()} className="rounded-xl bg-zinc-800 px-6 py-2.5 text-[13px] text-zinc-300 hover:bg-zinc-700">再試行</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        ダッシュボードに戻る
      </button>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">クーポン管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-zinc-900 hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          新規作成
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <h3 className="mb-3 text-sm font-bold text-amber-400">
            新しいクーポン
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="クーポン名（例：最初の1杯半額！）"
              className="input-field"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="詳細（任意）"
              className="input-field"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={creating || !newTitle.trim()}
                className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
              >
                {creating ? "作成中..." : "作成"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setNewTitle("");
                  setNewDescription("");
                }}
                className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupons list */}
      {coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Ticket className="mb-3 h-10 w-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">
            クーポンがまだありません
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            「新規作成」からクーポンを追加しましょう
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-zinc-100">{coupon.title}</p>
                  {coupon.description && (
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {coupon.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="shrink-0 rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs font-medium",
                    coupon.isActive ? "text-emerald-400" : "text-zinc-500"
                  )}
                >
                  {coupon.isActive ? "配信中" : "停止中"}
                </span>
                <button
                  onClick={() => handleToggle(coupon.id, coupon.isActive)}
                  className={cn(
                    "relative h-7 w-12 rounded-full transition-colors",
                    coupon.isActive ? "bg-emerald-500" : "bg-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition-transform shadow-sm",
                      coupon.isActive && "translate-x-5"
                    )}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

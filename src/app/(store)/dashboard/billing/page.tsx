"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  Zap,
  Check,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useStoreAuth } from "@/hooks/useStoreAuth";
import { PLAN_PRICE, PLAN_PRICE_PRIORITY, PLAN_TRIAL_DAYS } from "@/constants";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const router = useRouter();
  const { user, store, loading: authLoading, error: authError } = useStoreAuth();
  const [loadingTier, setLoadingTier] = useState<"premium" | "priority" | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const handleUpgrade = async (tier: "premium" | "priority") => {
    if (!store || !user) return;
    setLoadingTier(tier);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ storeId: store.id, tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert(e instanceof Error ? e.message : "エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoadingTier(null);
    }
  };

  const handleManage = async () => {
    if (!store || !user) return;
    setLoadingPortal(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ storeId: store.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Portal failed");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert(e instanceof Error ? e.message : "エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoadingPortal(false);
    }
  };

  if (authLoading || !user || !store) return <LoadingSpinner className="min-h-screen" />;

  const isActive = store.subscriptionStatus === "active" || store.subscriptionStatus === "trialing";
  const isPastDue = store.subscriptionStatus === "past_due";
  const isTrialing = store.subscriptionStatus === "trialing";
  const isPriority = store.plan === "priority";

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        ダッシュボードに戻る
      </button>

      <h1 className="mb-6 text-xl font-bold text-zinc-100">プラン・お支払い</h1>

      {/* Current status */}
      {isActive && (
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="mb-1 text-xs text-zinc-500">現在のプラン</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-zinc-100">
              {isPriority ? "優先掲載プラン" : "掲載プラン"}
            </p>
            {isPriority
              ? <Zap className="h-5 w-5 text-violet-400" />
              : <Crown className="h-5 w-5 text-amber-500" />
            }
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            ¥{(isPriority ? PLAN_PRICE_PRIORITY : PLAN_PRICE).toLocaleString()} / 月（税込）
          </p>
          {isTrialing && (
            <p className="mt-1 text-sm text-amber-400">無料トライアル中</p>
          )}
          {isPastDue && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              お支払いに問題があります。7日以内に解決されない場合、掲載が停止されます。
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* Standard plan */}
        <div className={cn(
          "rounded-2xl border p-5",
          !isPriority && isActive
            ? "border-amber-500/50 bg-amber-500/5"
            : "border-zinc-800 bg-zinc-900"
        )}>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-lg font-bold text-zinc-100">掲載プラン</h3>
            <Crown className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mb-1 text-2xl font-bold text-zinc-100">
            ¥{PLAN_PRICE.toLocaleString()}
            <span className="text-sm font-normal text-zinc-500">/月（税込）</span>
          </p>
          <p className="mb-4 text-xs text-amber-400">初回{PLAN_TRIAL_DAYS}日間無料</p>
          <ul className="mb-4 space-y-2">
            <PlanFeature text="基本情報の掲載" />
            <PlanFeature text="リアルタイム空席更新" />
            <PlanFeature text="写真最大6枚" />
            <PlanFeature text="リアルタイムクーポン配信" />
          </ul>

          {!isPriority && isActive ? (
            <button
              onClick={handleManage}
              disabled={loadingPortal}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" />
              {loadingPortal ? "読み込み中..." : "お支払い情報を管理"}
            </button>
          ) : !isActive ? (
            <button
              onClick={() => handleUpgrade("premium")}
              disabled={loadingTier !== null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
            >
              <Crown className="h-4 w-4" />
              {loadingTier === "premium" ? "読み込み中..." : `このプランで始める（初回${PLAN_TRIAL_DAYS}日間無料）`}
            </button>
          ) : null}
        </div>

        {/* Priority plan */}
        <div className={cn(
          "rounded-2xl border p-5",
          isPriority && isActive
            ? "border-violet-500/50 bg-violet-500/5"
            : "border-zinc-800 bg-zinc-900"
        )}>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-lg font-bold text-zinc-100">優先掲載プラン</h3>
            <Zap className="h-4 w-4 text-violet-400" />
          </div>
          <p className="mb-1 text-2xl font-bold text-zinc-100">
            ¥{PLAN_PRICE_PRIORITY.toLocaleString()}
            <span className="text-sm font-normal text-zinc-500">/月（税込）</span>
          </p>
          <p className="mb-4 text-xs text-violet-400">初回{PLAN_TRIAL_DAYS}日間無料</p>
          <ul className="mb-4 space-y-2">
            <PlanFeature text="基本情報の掲載" />
            <PlanFeature text="リアルタイム空席更新" />
            <PlanFeature text="写真最大6枚" />
            <PlanFeature text="リアルタイムクーポン配信" />
            <PlanFeature text="一覧の最上位に表示" highlight />
          </ul>

          {isPriority && isActive ? (
            <button
              onClick={handleManage}
              disabled={loadingPortal}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" />
              {loadingPortal ? "読み込み中..." : "お支払い情報を管理"}
            </button>
          ) : (
            <button
              onClick={() => handleUpgrade("priority")}
              disabled={loadingTier !== null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              {loadingTier === "priority" ? "読み込み中..." : `このプランで始める（初回${PLAN_TRIAL_DAYS}日間無料）`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanFeature({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <Check className={cn("h-4 w-4 shrink-0", highlight ? "text-violet-400" : "text-emerald-400")} />
      <span className={highlight ? "font-semibold text-violet-300" : "text-zinc-300"}>{text}</span>
    </li>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  Check,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useStoreAuth } from "@/hooks/useStoreAuth";
import { PLAN_PRICE, PLAN_TRIAL_DAYS } from "@/constants";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const router = useRouter();
  const { user, store, loading: authLoading, error: authError } = useStoreAuth();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const handleUpgrade = async () => {
    if (!store || !user) return;
    setLoadingCheckout(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ storeId: store.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert(e instanceof Error ? e.message : "エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoadingCheckout(false);
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

  if (authLoading) return <LoadingSpinner className="min-h-screen" />;
  if (authError || !store) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="mb-3 text-[15px] font-bold text-red-400">店舗情報を取得できません</p>
        <p className="mb-4 text-[13px] text-zinc-500">{authError || "店舗が見つかりません"}</p>
        <button onClick={() => window.location.reload()} className="rounded-xl bg-zinc-800 px-6 py-2.5 text-[13px] text-zinc-300 hover:bg-zinc-700">再試行</button>
      </div>
    );
  }

  const isPremium = store.plan === "premium";
  const isPastDue = store.subscriptionStatus === "past_due";
  const isTrialing = store.subscriptionStatus === "trialing";

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

      {/* Current plan */}
      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="mb-1 text-xs text-zinc-500">現在のプラン</p>
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold text-zinc-100">
            {isPremium ? "プレミアム" : "フリー"}
          </p>
          {isPremium && (
            <Crown className="h-5 w-5 text-amber-500" />
          )}
        </div>
        {isTrialing && (
          <p className="mt-1 text-sm text-amber-400">
            無料トライアル中
          </p>
        )}
        {isPastDue && (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            お支払いに問題があります。7日以内に解決されない場合、フリープランに変更されます。
          </div>
        )}
      </div>

      {/* Plans comparison */}
      <div className="grid gap-4">
        {/* Free plan */}
        <div
          className={cn(
            "rounded-2xl border p-5",
            !isPremium
              ? "border-zinc-600 bg-zinc-900"
              : "border-zinc-800 bg-zinc-900/50"
          )}
        >
          <h3 className="mb-1 text-lg font-bold text-zinc-200">フリー</h3>
          <p className="mb-4 text-2xl font-bold text-zinc-100">
            ¥0<span className="text-sm font-normal text-zinc-500">/月</span>
          </p>
          <ul className="space-y-2">
            <PlanFeature text="基本情報の掲載" included />
            <PlanFeature text="リアルタイム空席更新" included />
            <PlanFeature text="写真1枚" included />
            <PlanFeature text="優先上位表示" included={false} />
            <PlanFeature text="写真の複数掲載" included={false} />
            <PlanFeature text="リアルタイムクーポン" included={false} />
          </ul>
          {!isPremium && (
            <div className="mt-4 rounded-xl bg-zinc-800 py-2 text-center text-sm text-zinc-400">
              現在のプラン
            </div>
          )}
        </div>

        {/* Premium plan */}
        <div
          className={cn(
            "rounded-2xl border p-5",
            isPremium
              ? "border-amber-500/50 bg-amber-500/5"
              : "border-amber-500/30 bg-zinc-900"
          )}
        >
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-lg font-bold text-zinc-100">プレミアム</h3>
            <Crown className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mb-1 text-2xl font-bold text-zinc-100">
            ¥{PLAN_PRICE.toLocaleString()}
            <span className="text-sm font-normal text-zinc-500">/月（税込）</span>
          </p>
          <p className="mb-4 text-xs text-amber-400">
            初回{PLAN_TRIAL_DAYS}日間無料
          </p>
          <ul className="space-y-2">
            <PlanFeature text="基本情報の掲載" included />
            <PlanFeature text="リアルタイム空席更新" included />
            <PlanFeature text="写真最大5枚" included />
            <PlanFeature text="一覧での優先上位表示" included />
            <PlanFeature text="スポンサーバッジ表示" included />
            <PlanFeature text="リアルタイムクーポン配信" included />
          </ul>

          {isPremium ? (
            <button
              onClick={handleManage}
              disabled={loadingPortal}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" />
              {loadingPortal ? "読み込み中..." : "お支払い情報を管理"}
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loadingCheckout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
            >
              <Crown className="h-4 w-4" />
              {loadingCheckout
                ? "読み込み中..."
                : `プレミアムにアップグレード（${PLAN_TRIAL_DAYS}日間無料）`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanFeature({
  text,
  included,
}: {
  text: string;
  included: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {included ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-400" />
      ) : (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-zinc-600">
          —
        </span>
      )}
      <span className={included ? "text-zinc-300" : "text-zinc-600"}>
        {text}
      </span>
    </li>
  );
}

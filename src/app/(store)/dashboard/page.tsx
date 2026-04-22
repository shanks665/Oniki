"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  Minus,
  Plus,
  Eye,
  Armchair,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useStoreAuth } from "@/hooks/useStoreAuth";
import { signOut } from "@/lib/firebase/auth";
import { STATUS_CONFIG } from "@/constants";
import { cn, getRelativeTime } from "@/lib/utils";
import type { StoreStatus, SeatDetail } from "@/types";

async function apiUpdateStatus(user: { getIdToken: () => Promise<string> }, storeId: string, status: StoreStatus, seatDetail: SeatDetail | null) {
  const token = await user.getIdToken();
  const res = await fetch("/api/store/status", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ storeId, status, seatDetail }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "ステータスの更新に失敗しました");
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, store, loading: authLoading, error: authError, refresh } = useStoreAuth();
  const [updating, setUpdating] = useState(false);
  const [seatDetail, setSeatDetail] = useState<SeatDetail>({
    counterAvailable: null,
    tableAvailable: null,
  });

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (store?.seatDetail && store?.seatCapacity) {
      setSeatDetail({
        counterAvailable: store.seatDetail.counterAvailable !== null
          ? Math.min(store.seatDetail.counterAvailable, store.seatCapacity.counterTotal)
          : null,
        tableAvailable: store.seatDetail.tableAvailable !== null
          ? Math.min(store.seatDetail.tableAvailable, store.seatCapacity.tableTotal)
          : null,
      });
    } else if (store?.seatDetail) {
      setSeatDetail(store.seatDetail);
    }
  }, [store?.seatDetail, store?.seatCapacity]);

  const handleStatusUpdate = useCallback(
    async (newStatus: StoreStatus) => {
      if (!store || !user || updating) return;
      setUpdating(true);
      try {
        const hasCap = store.seatCapacity && (store.seatCapacity.counterTotal > 0 || store.seatCapacity.tableTotal > 0);
        await apiUpdateStatus(user, store.id, newStatus, hasCap ? seatDetail : null);
        await refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "更新に失敗しました");
      } finally {
        setUpdating(false);
      }
    },
    [store, user, updating, seatDetail, refresh]
  );

  const handleSeatUpdate = useCallback(
    async (newDetail: SeatDetail) => {
      setSeatDetail(newDetail);
      if (!store || !user) return;
      try {
        await apiUpdateStatus(user, store.id, store.status, newDetail);
        await refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "更新に失敗しました");
      }
    },
    [store, user, refresh]
  );

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  if (authLoading) return <LoadingSpinner className="min-h-screen" />;
  if (authError || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-6">
          <p className="mb-2 text-[15px] font-bold text-red-400">店舗情報を取得できません</p>
          <p className="text-[13px] text-zinc-400">{authError || "このアカウントに紐づく店舗が見つかりません"}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-zinc-800 px-6 py-2.5 text-[13px] font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            再試行
          </button>
          <button
            onClick={handleSignOut}
            className="rounded-xl bg-zinc-800 px-6 py-2.5 text-[13px] font-medium text-red-400 transition-colors hover:bg-zinc-700"
          >
            ログアウト
          </button>
        </div>
      </div>
    );
  }

  const hasSeatCapacity = store.seatCapacity && (store.seatCapacity.counterTotal > 0 || store.seatCapacity.tableTotal > 0);

  const statusButtons: {
    status: StoreStatus;
    gradient: string;
    glow: string;
    activeRing: string;
  }[] = [
    {
      status: "available",
      gradient: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
      glow: "shadow-lg shadow-emerald-500/25",
      activeRing: "ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#06060a]",
    },
    {
      status: "slightly_crowded",
      gradient: "bg-gradient-to-br from-amber-500 to-amber-600 text-zinc-900",
      glow: "shadow-lg shadow-amber-500/25",
      activeRing: "ring-2 ring-amber-400 ring-offset-2 ring-offset-[#06060a]",
    },
    {
      status: "full",
      gradient: "bg-gradient-to-br from-red-500 to-red-600 text-white",
      glow: "shadow-lg shadow-red-500/25",
      activeRing: "ring-2 ring-red-400 ring-offset-2 ring-offset-[#06060a]",
    },
  ];

  const setupTasks: { label: string; href: string; done: boolean }[] = [
    { label: "パスワードを初期値から変更する", href: "/dashboard/settings", done: false },
    { label: "座席数を設定する", href: "/dashboard/edit", done: !!hasSeatCapacity },
    { label: "店舗の基本情報を入力する", href: "/dashboard/edit", done: !!(store.address && store.phone && store.description) },
  ];
  const pendingTasks = setupTasks.filter((t) => !t.done);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      {/* Setup banner */}
      {pendingTasks.length > 0 && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] to-transparent p-4">
          <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-amber-400">
            <AlertCircle className="h-4 w-4" />
            初期設定を完了してください
          </div>
          <div className="space-y-1.5">
            {setupTasks.map((task) => (
              <Link
                key={task.label}
                href={task.href}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] transition-colors",
                  task.done
                    ? "text-zinc-600 line-through"
                    : "bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    task.done
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/20 text-amber-400"
                  )}>
                    {task.done ? "✓" : "!"}
                  </span>
                  {task.label}
                </span>
                {!task.done && <ChevronRight className="h-4 w-4 text-zinc-600" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Preview card */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-4">
        <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">
          <Eye className="h-3 w-3" />
          お客様への表示プレビュー
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1.5 text-[15px] font-bold text-zinc-100">{store.name}</p>
            <StatusBadge status={store.status} size="md" />
          </div>
          <div className="text-right text-[11px] text-zinc-600">
            {getRelativeTime(store.statusUpdatedAt)}
          </div>
        </div>
      </div>

      {/* Status buttons */}
      <div className="mb-5">
        <p className="mb-3 text-center text-[13px] font-medium text-zinc-500">
          現在の状況をタップ
        </p>
        <div className="grid grid-cols-1 gap-3">
          {statusButtons.map(({ status, gradient, glow, activeRing }) => {
            const config = STATUS_CONFIG[status];
            const isActive = store.status === status;
            return (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={updating}
                className={cn(
                  "relative flex items-center justify-center gap-3 rounded-2xl py-7 text-xl font-extrabold transition-all duration-200 active:scale-[0.97] disabled:opacity-50",
                  gradient,
                  isActive ? cn(glow, activeRing) : "opacity-80 hover:opacity-100"
                )}
              >
                <span className="text-2xl">{config.emoji}</span>
                <span>{config.label}</span>
                {isActive && (
                  <span className="absolute top-3 right-4 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm">
                    現在
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seat controls */}
      {hasSeatCapacity ? (
        <div className="mb-6 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4">
          <div className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-zinc-300">
            <Armchair className="h-4 w-4 text-amber-500" />
            空席数を更新
          </div>
          <div className="space-y-5">
            {store.seatCapacity!.counterTotal > 0 && (
              <SeatCounter
                label="カウンター"
                available={seatDetail.counterAvailable ?? 0}
                total={store.seatCapacity!.counterTotal}
                onChange={(v) => handleSeatUpdate({ ...seatDetail, counterAvailable: v })}
              />
            )}
            {store.seatCapacity!.tableTotal > 0 && (
              <SeatCounter
                label="テーブル"
                available={seatDetail.tableAvailable ?? 0}
                total={store.seatCapacity!.tableTotal}
                onChange={(v) => handleSeatUpdate({ ...seatDetail, tableAvailable: v })}
              />
            )}
          </div>
          <p className="mt-3 text-[10px] text-zinc-600">
            席数の変更は即座にお客様に公開されます
          </p>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-dashed border-zinc-800 px-4 py-4 text-center">
          <Armchair className="mx-auto mb-2 h-5 w-5 text-zinc-700" />
          <p className="text-[12px] text-zinc-600">
            席数が未設定です。
            <button
              onClick={() => router.push("/dashboard/edit")}
              className="ml-1 text-amber-500 underline underline-offset-2 hover:text-amber-400"
            >
              店舗情報の編集
            </button>
            から総席数を設定してください。
          </p>
        </div>
      )}

      {/* Sign out */}
      <div className="mt-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.02] px-4 py-3 text-[13px] text-red-400/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-all hover:bg-white/[0.04] hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </button>
      </div>
    </div>
  );
}

function SeatCounter({
  label,
  available,
  total,
  onChange,
}: {
  label: string;
  available: number;
  total: number;
  onChange: (value: number) => void;
}) {
  const ratio = Math.min(available / total, 1);
  const barColor =
    ratio > 0.5
      ? "bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.3)]"
      : ratio > 0
        ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.3)]"
        : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.2)]";
  const numColor =
    ratio > 0.5 ? "text-emerald-400" : ratio > 0 ? "text-amber-400" : "text-red-400";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-medium text-zinc-500">{label}（全{total}席）</span>
        <span className={cn("text-[18px] font-extrabold tabular-nums", numColor)}>
          空き {available}<span className="text-[13px] text-zinc-600">席</span>
        </span>
      </div>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-all duration-300", barColor)}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, available - 1))}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-700 active:scale-95"
        >
          <Minus className="h-5 w-5" />
        </button>
        {[0, Math.round(total / 2), total].filter((v, i, a) => a.indexOf(v) === i).map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={cn(
              "rounded-lg px-3 py-2 text-[12px] font-bold tabular-nums transition-all",
              available === preset
                ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40"
                : "bg-white/[0.04] text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-300"
            )}
          >
            {preset}
          </button>
        ))}
        <button
          onClick={() => onChange(Math.min(total, available + 1))}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-700 active:scale-95"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

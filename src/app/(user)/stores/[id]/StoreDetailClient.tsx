"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Navigation,
  Clock,
  MapPin,
  Wallet,
  Info,
  Ticket,
  Heart,
  CalendarOff,
  Armchair,
} from "lucide-react";
import { ImageSlider } from "@/components/ui/ImageSlider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useStore } from "@/hooks/useStores";
import { useActiveCoupons } from "@/hooks/useCoupons";
import { useFavorites } from "@/hooks/useFavorites";
import { AREAS, GENRES } from "@/constants";
import {
  cn,
  getRelativeTime,
  isStale,
  getEffectiveStatus,
} from "@/lib/utils";
import type { Store, Coupon, AreaKey, GenreKey } from "@/types";

interface Props {
  initialStore: Store;
  initialCoupons: Coupon[];
  storeId: string;
}

export function StoreDetailClient({ initialStore, initialCoupons, storeId }: Props) {
  const router = useRouter();
  const { store: liveStore } = useStore(storeId);
  const { coupons: liveCoupons } = useActiveCoupons(storeId);
  const { isFavorite, toggleFavorite } = useFavorites();

  const store = liveStore ?? initialStore;
  const coupons = liveCoupons.length > 0 ? liveCoupons : initialCoupons;

  const effectiveStatus = getEffectiveStatus(store);
  const stale = isStale(store.statusUpdatedAt);
  const relativeTime = getRelativeTime(store.statusUpdatedAt);
  const displayImages =
    store.plan === "premium" ? store.images : store.images.slice(0, 1);

  return (
    <div className="pb-24">
      {/* Floating nav buttons */}
      <div className="absolute top-16 left-0 right-0 z-30 mx-auto flex max-w-2xl items-center justify-between px-4 py-2">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-black/40 p-2.5 backdrop-blur-md transition-all hover:bg-black/60"
        >
          <ArrowLeft className="h-4 w-4 text-white/80" />
        </button>
        <button
          onClick={() => toggleFavorite(store.id)}
          className="rounded-full bg-black/40 p-2.5 backdrop-blur-md transition-all hover:bg-black/60"
        >
          <Heart
            className={cn(
              "h-4 w-4",
              isFavorite(store.id)
                ? "fill-rose-400 text-rose-400"
                : "text-white/80"
            )}
          />
        </button>
      </div>

      <ImageSlider images={displayImages} storeName={store.name} />

      <div className="mx-auto max-w-2xl px-4">
        {/* Status card */}
        <div className="relative -mt-10 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 backdrop-blur-xl">
          {effectiveStatus === "available" && (
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          )}
          <div className="flex items-center justify-between">
            <StatusBadge status={effectiveStatus} size="lg" />
            <span
              className={cn(
                "flex items-center gap-1.5 text-[11px]",
                stale ? "text-zinc-700" : "text-zinc-500"
              )}
            >
              <Clock className="h-3 w-3" />
              {relativeTime}
              {stale && " (情報が古い可能性)"}
            </span>
          </div>

          {effectiveStatus !== "closed" && store.seatCapacity &&
            (store.seatCapacity.counterTotal > 0 || store.seatCapacity.tableTotal > 0) && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                <Armchair className="h-3.5 w-3.5" />
                現在の空席状況
              </div>
              <div className="grid grid-cols-2 gap-3">
                {store.seatCapacity.counterTotal > 0 && (
                  <SeatBlock
                    label="カウンター"
                    available={store.seatDetail?.counterAvailable ?? 0}
                    total={store.seatCapacity.counterTotal}
                  />
                )}
                {store.seatCapacity.tableTotal > 0 && (
                  <SeatBlock
                    label="テーブル"
                    available={store.seatDetail?.tableAvailable ?? 0}
                    total={store.seatCapacity.tableTotal}
                  />
                )}
              </div>
            </div>
          )}

          {effectiveStatus === "closed" && (
            <p className="mt-2 text-[13px] text-zinc-600">
              本日の営業は終了しました
            </p>
          )}
        </div>

        {/* Coupons */}
        {coupons.length > 0 && store.plan === "premium" && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.06] to-transparent p-4">
            <div className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-amber-400">
              <Ticket className="h-4 w-4" />
              今使えるクーポン
            </div>
            <div className="space-y-2">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="rounded-xl border border-amber-500/10 bg-black/20 p-3"
                >
                  <p className="font-bold text-amber-300">{coupon.title}</p>
                  {coupon.description && (
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {coupon.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Store name */}
        <div className="mt-6">
          <h1 className="text-[22px] font-extrabold leading-tight text-zinc-50">
            {store.name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2 text-[13px] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {AREAS[store.area as AreaKey] || store.area}
            </span>
            <span className="text-zinc-800">|</span>
            <span>{GENRES[store.genre as GenreKey] || store.genre}</span>
          </div>
          {store.description && (
            <p className="mt-3 text-[13px] leading-[1.8] text-zinc-500">
              {store.description}
            </p>
          )}
        </div>

        {/* Info section */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <InfoRow
            icon={<Clock className="h-4 w-4 text-amber-500/70" />}
            label="営業時間"
            value={`${store.businessHours.open} ~ ${store.businessHours.close}`}
          />
          <InfoRow
            icon={<CalendarOff className="h-4 w-4 text-amber-500/70" />}
            label="定休日"
            value={
              store.businessHours.holidays.length > 0
                ? store.businessHours.holidays.join("、")
                : "なし"
            }
          />
          <InfoRow
            icon={<Wallet className="h-4 w-4 text-amber-500/70" />}
            label="予算目安"
            value={store.budgetRange || "—"}
          />
          <InfoRow
            icon={<Info className="h-4 w-4 text-amber-500/70" />}
            label="システム"
            value={store.systemInfo || "—"}
          />
          <InfoRow
            icon={<MapPin className="h-4 w-4 text-amber-500/70" />}
            label="住所"
            value={store.address || "—"}
            isLast
          />
        </div>

        {/* Google Maps embed */}
        {store.googleMapsEmbedUrl && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.06]">
            <iframe
              src={store.googleMapsEmbedUrl}
              width="100%"
              height="220"
              style={{ border: 0, filter: "invert(0.92) hue-rotate(180deg)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps"
            />
          </div>
        )}
      </div>

      {/* Fixed action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#06060a]/80 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-2xl gap-3 px-4 py-3">
          {store.phone && (
            <a
              href={`tel:${store.phone}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/[0.06] py-3.5 text-[13px] font-bold text-zinc-200 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-all hover:bg-white/[0.1]"
            >
              <Phone className="h-4 w-4" />
              電話する
            </a>
          )}
          {store.googleMapsDirectionUrl && (
            <a
              href={store.googleMapsDirectionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-3.5 text-[13px] font-bold text-zinc-900 shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30"
            >
              <Navigation className="h-4 w-4" />
              経路を見る
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function SeatBlock({ label, available: rawAvailable, total }: { label: string; available: number; total: number }) {
  const available = Math.min(Math.max(0, rawAvailable), total);
  const ratio = total > 0 ? available / total : 0;
  const color =
    ratio > 0.5
      ? { text: "text-emerald-400", bar: "bg-emerald-500", glow: "shadow-[0_0_8px_rgba(52,211,153,0.3)]", bg: "bg-emerald-500/5" }
      : ratio > 0
        ? { text: "text-amber-400", bar: "bg-amber-500", glow: "shadow-[0_0_8px_rgba(245,158,11,0.3)]", bg: "bg-amber-500/5" }
        : { text: "text-red-400", bar: "bg-red-500", glow: "shadow-[0_0_6px_rgba(239,68,68,0.2)]", bg: "bg-red-500/5" };

  return (
    <div className={cn("rounded-xl border border-white/[0.06] p-3", color.bg)}>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[11px] font-medium text-zinc-500">{label}</p>
        <p className="text-[11px] text-zinc-600">全 {total} 席</p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("text-[28px] font-extrabold leading-none tabular-nums", color.text)}>
          {available}
        </span>
        <span className="text-[13px] font-medium text-zinc-500">席 空き</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color.bar, color.glow)}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3.5",
        !isLast && "border-b border-white/[0.04]"
      )}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium tracking-wider text-zinc-600 uppercase">
          {label}
        </p>
        <p className="mt-0.5 text-[13px] text-zinc-300">{value}</p>
      </div>
    </div>
  );
}

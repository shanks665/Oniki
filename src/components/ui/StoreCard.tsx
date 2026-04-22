"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Heart, Crown, Ticket, MapPin, ChevronRight, Armchair } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { AREAS, GENRES } from "@/constants";
import { cn, getRelativeTime, isStale, getEffectiveStatus } from "@/lib/utils";
import type { Store, Coupon } from "@/types";
import type { AreaKey, GenreKey } from "@/types";

interface StoreCardProps {
  store: Store;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  activeCoupons?: Coupon[];
}

export function StoreCard({
  store,
  isFavorite,
  onToggleFavorite,
  activeCoupons = [],
}: StoreCardProps) {
  const effectiveStatus = getEffectiveStatus(store);
  const stale = isStale(store.statusUpdatedAt);
  const relativeTime = getRelativeTime(store.statusUpdatedAt);

  return (
    <Link
      href={`/stores/${store.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-md transition-all duration-300 hover:border-white/[0.1] hover:from-white/[0.06] hover:to-white/[0.02] hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
    >
      {store.plan === "premium" && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      )}

      <div className="flex gap-0">
        {/* Image area */}
        <div className="relative h-auto w-28 shrink-0 sm:w-36">
          {store.images.length > 0 ? (
            <>
              <Image
                src={store.images[0]}
                alt={store.name}
                fill
                className="object-cover"
                sizes="144px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a0e]/60" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-white/[0.02]">
              <span className="text-3xl opacity-20">🍸</span>
            </div>
          )}

          {store.plan === "premium" && (
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-zinc-900 shadow-lg shadow-amber-500/20">
              <Crown className="h-2.5 w-2.5" />
              PR
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex min-w-0 flex-1 flex-col justify-between p-3.5 sm:p-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <StatusBadge status={effectiveStatus} size="sm" />
              <div
                className={cn(
                  "flex items-center gap-1 text-[10px]",
                  stale ? "text-zinc-600" : "text-zinc-500"
                )}
              >
                <Clock className="h-2.5 w-2.5" />
                {relativeTime}
              </div>
            </div>

            <h3 className="mb-1 truncate text-[15px] font-bold text-zinc-100 group-hover:text-white">
              {store.name}
            </h3>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">
                {AREAS[store.area as AreaKey] || store.area}
              </span>
              <span className="text-zinc-700">|</span>
              <span className="truncate">
                {GENRES[store.genre as GenreKey] || store.genre}
              </span>
            </div>
          </div>

          {effectiveStatus !== "closed" && store.seatCapacity &&
            (store.seatCapacity.counterTotal > 0 || store.seatCapacity.tableTotal > 0) && (
            <div className="mt-2 flex items-center gap-3">
              <Armchair className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
              <div className="flex items-center gap-3 text-[12px]">
                {store.seatCapacity.counterTotal > 0 && (
                  <SeatChip
                    label="カウンター"
                    available={store.seatDetail?.counterAvailable ?? 0}
                    total={store.seatCapacity.counterTotal}
                  />
                )}
                {store.seatCapacity.tableTotal > 0 && (
                  <SeatChip
                    label="テーブル"
                    available={store.seatDetail?.tableAvailable ?? 0}
                    total={store.seatCapacity.tableTotal}
                  />
                )}
              </div>
            </div>
          )}

          {activeCoupons.length > 0 && store.plan === "premium" && (
            <div className="mt-2">
              {activeCoupons.slice(0, 1).map((coupon) => (
                <span
                  key={coupon.id}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400"
                >
                  <Ticket className="h-2.5 w-2.5" />
                  {coupon.title}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions area */}
        <div className="flex flex-col items-center justify-between py-3 pr-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="rounded-full p-1.5 transition-colors hover:bg-white/10"
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                isFavorite
                  ? "fill-rose-400 text-rose-400"
                  : "text-zinc-600 group-hover:text-zinc-500"
              )}
            />
          </button>
          <ChevronRight className="h-4 w-4 text-zinc-700 transition-colors group-hover:text-zinc-500" />
        </div>
      </div>
    </Link>
  );
}

function SeatChip({ label, available: rawAvailable, total }: { label: string; available: number; total: number }) {
  const available = Math.min(Math.max(0, rawAvailable), total);
  const ratio = total > 0 ? available / total : 0;
  const color =
    ratio > 0.5
      ? "text-emerald-400 bg-emerald-500/10"
      : ratio > 0
        ? "text-amber-400 bg-amber-500/10"
        : "text-red-400 bg-red-500/10";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium tabular-nums", color)}>
      <span className="text-[10px] opacity-70">{label}</span>
      <span className="text-[10px] opacity-50">空き</span>
      <span className="text-[13px] font-bold">{available}</span>
      <span className="text-[10px] opacity-50">/ 全{total}席</span>
    </span>
  );
}

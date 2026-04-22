"use client";

import { cn } from "@/lib/utils";
import type { SeatCapacity, SeatDetail } from "@/types";

interface SeatBarProps {
  capacity: SeatCapacity | null;
  detail: SeatDetail | null;
  size?: "sm" | "md" | "lg";
}

function SingleBar({
  label,
  available,
  total,
  size,
}: {
  label: string;
  available: number | null;
  total: number;
  size: "sm" | "md" | "lg";
}) {
  if (total <= 0) return null;
  const avail = Math.min(Math.max(0, available ?? 0), total);
  const ratio = avail / total;
  const barColor =
    ratio > 0.5
      ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
      : ratio > 0
        ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
        : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]";

  const textColor =
    ratio > 0.5 ? "text-emerald-400" : ratio > 0 ? "text-amber-400" : "text-red-400";

  const sizes = {
    sm: { bar: "h-1", text: "text-[10px]", gap: "gap-1.5", num: "text-[11px]" },
    md: { bar: "h-1.5", text: "text-[11px]", gap: "gap-2", num: "text-[13px]" },
    lg: { bar: "h-2", text: "text-[12px]", gap: "gap-2.5", num: "text-[15px]" },
  };
  const s = sizes[size];

  return (
    <div className={cn("flex-1", s.gap)}>
      <div className="mb-1 flex items-baseline justify-between">
        <span className={cn("font-medium text-zinc-500", s.text)}>{label}（全{total}席）</span>
        <span className={cn("font-bold tabular-nums", textColor, s.num)}>
          空き {avail}<span className="text-zinc-600">席</span>
        </span>
      </div>
      <div className={cn("w-full overflow-hidden rounded-full bg-white/[0.06]", s.bar)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

export function SeatBar({ capacity, detail, size = "md" }: SeatBarProps) {
  if (!capacity) return null;
  if (capacity.counterTotal <= 0 && capacity.tableTotal <= 0) return null;

  return (
    <div className="flex gap-4">
      {capacity.counterTotal > 0 && (
        <SingleBar
          label="カウンター"
          available={detail?.counterAvailable ?? null}
          total={capacity.counterTotal}
          size={size}
        />
      )}
      {capacity.tableTotal > 0 && (
        <SingleBar
          label="テーブル"
          available={detail?.tableAvailable ?? null}
          total={capacity.tableTotal}
          size={size}
        />
      )}
    </div>
  );
}

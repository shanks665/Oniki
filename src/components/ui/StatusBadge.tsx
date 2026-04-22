"use client";

import type { StoreStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: StoreStatus;
  size?: "sm" | "md" | "lg";
}

const statusStyles: Record<
  StoreStatus,
  { label: string; dot: string; glow: string; text: string; bg: string }
> = {
  available: {
    label: "空席あり",
    dot: "bg-emerald-400",
    glow: "shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    text: "text-emerald-300",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  slightly_crowded: {
    label: "やや混雑",
    dot: "bg-amber-400",
    glow: "shadow-[0_0_8px_rgba(251,191,36,0.6)]",
    text: "text-amber-300",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  full: {
    label: "満席",
    dot: "bg-red-400",
    glow: "shadow-[0_0_8px_rgba(248,113,113,0.6)]",
    text: "text-red-300",
    bg: "bg-red-500/10 border-red-500/20",
  },
  closed: {
    label: "営業終了",
    dot: "bg-zinc-500",
    glow: "",
    text: "text-zinc-400",
    bg: "bg-zinc-500/10 border-zinc-500/20",
  },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const s = statusStyles[status];
  const sizeClasses = {
    sm: "text-[11px] px-2.5 py-1 gap-1.5",
    md: "text-xs px-3 py-1.5 gap-2",
    lg: "text-sm px-4 py-2 gap-2",
  };
  const dotSize = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        s.bg,
        s.text,
        sizeClasses[size]
      )}
    >
      <span className="relative flex items-center justify-center">
        {status !== "closed" && (
          <span
            className={cn(
              "absolute rounded-full opacity-60 animate-pulse-glow",
              s.dot,
              dotSize[size]
            )}
            style={{ filter: "blur(3px)" }}
          />
        )}
        <span className={cn("relative rounded-full", s.dot, s.glow, dotSize[size])} />
      </span>
      <span>{s.label}</span>
    </span>
  );
}

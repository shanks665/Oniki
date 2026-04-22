"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  text?: string;
}

export function LoadingSpinner({
  className,
  text = "読み込み中...",
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-24", className)}>
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-amber-500" />
        <div className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-b-amber-500/30" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
      </div>
      <p className="text-[13px] text-zinc-600">{text}</p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Wine } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#06060a]/70 backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-amber-500/30 to-amber-600/10 blur-sm transition-all group-hover:from-amber-500/40" />
            <Wine className="relative h-5 w-5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[17px] font-extrabold tracking-tight text-amber-400">
              BAR NAVI
            </span>
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-semibold tracking-widest text-zinc-500">
              KUMAMOTO
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}

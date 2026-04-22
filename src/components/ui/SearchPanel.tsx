"use client";

import { useState } from "react";
import { SlidersHorizontal, X, Heart, ChevronDown } from "lucide-react";
import { AREAS, GENRES } from "@/constants";
import { cn } from "@/lib/utils";
import type { AreaKey, GenreKey } from "@/types";

interface SearchPanelProps {
  selectedAreas: AreaKey[];
  selectedGenres: GenreKey[];
  hideFullStores: boolean;
  showFavoritesOnly: boolean;
  onAreasChange: (areas: AreaKey[]) => void;
  onGenresChange: (genres: GenreKey[]) => void;
  onHideFullChange: (hide: boolean) => void;
  onFavoritesChange: (show: boolean) => void;
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-200",
        active
          ? "bg-amber-500/15 text-amber-300 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.3)]"
          : "bg-white/[0.04] text-zinc-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.06] hover:text-zinc-400"
      )}
    >
      {label}
    </button>
  );
}

export function SearchPanel({
  selectedAreas,
  selectedGenres,
  hideFullStores,
  showFavoritesOnly,
  onAreasChange,
  onGenresChange,
  onHideFullChange,
  onFavoritesChange,
}: SearchPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleArea = (area: AreaKey) => {
    onAreasChange(
      selectedAreas.includes(area)
        ? selectedAreas.filter((a) => a !== area)
        : [...selectedAreas, area]
    );
  };

  const toggleGenre = (genre: GenreKey) => {
    onGenresChange(
      selectedGenres.includes(genre)
        ? selectedGenres.filter((g) => g !== genre)
        : [...selectedGenres, genre]
    );
  };

  const activeFilters = selectedAreas.length + selectedGenres.length + (hideFullStores ? 1 : 0);

  return (
    <div className="border-b border-white/[0.04] bg-[#06060a]/50 backdrop-blur-xl">
      <div className="mx-auto max-w-2xl px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all duration-200",
              expanded || activeFilters > 0
                ? "bg-amber-500/10 text-amber-400 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.25)]"
                : "bg-white/[0.04] text-zinc-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.06]"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>絞り込み</span>
            {activeFilters > 0 && (
              <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-zinc-900">
                {activeFilters}
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </button>

          <button
            onClick={() => onFavoritesChange(!showFavoritesOnly)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all duration-200",
              showFavoritesOnly
                ? "bg-rose-500/10 text-rose-400 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.25)]"
                : "bg-white/[0.04] text-zinc-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.06]"
            )}
          >
            <Heart
              className={cn("h-3.5 w-3.5", showFavoritesOnly && "fill-rose-400")}
            />
            <span>お気に入り</span>
          </button>

          {activeFilters > 0 && (
            <button
              onClick={() => {
                onAreasChange([]);
                onGenresChange([]);
                onHideFullChange(false);
              }}
              className="ml-auto flex items-center gap-1 text-[11px] text-zinc-600 transition-colors hover:text-zinc-400"
            >
              <X className="h-3 w-3" />
              クリア
            </button>
          )}
        </div>

        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            expanded
              ? "mt-4 grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-4 pb-1">
              <div>
                <p className="mb-2.5 text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                  エリア
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(AREAS).map(([key, label]) => (
                    <FilterChip
                      key={key}
                      label={label}
                      active={selectedAreas.includes(key as AreaKey)}
                      onClick={() => toggleArea(key as AreaKey)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                  ジャンル
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(GENRES).map(([key, label]) => (
                    <FilterChip
                      key={key}
                      label={label}
                      active={selectedGenres.includes(key as GenreKey)}
                      onClick={() => toggleGenre(key as GenreKey)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                <span className="text-[13px] text-zinc-400">
                  空席あり・やや混雑のみ表示
                </span>
                <button
                  onClick={() => onHideFullChange(!hideFullStores)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-all duration-300",
                    hideFullStores
                      ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                      : "bg-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300",
                      hideFullStores && "translate-x-5"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

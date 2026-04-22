"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageSliderProps {
  images: string[];
  storeName: string;
}

export function ImageSlider({ images, storeName }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative flex h-64 items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 sm:h-80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.04),transparent_70%)]" />
        <span className="text-6xl opacity-10">🍸</span>
      </div>
    );
  }

  const prev = () =>
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () =>
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="relative h-64 w-full overflow-hidden sm:h-80">
      {images.map((src, i) => (
        <div
          key={src}
          className={cn(
            "absolute inset-0 transition-all duration-700 ease-out",
            i === currentIndex
              ? "scale-100 opacity-100"
              : "scale-105 opacity-0 pointer-events-none"
          )}
        >
          <Image
            src={src}
            alt={`${storeName} - ${i + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 640px"
            priority={i === 0}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-[#06060a] via-[#06060a]/20 to-[#06060a]/40" />

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 backdrop-blur-md transition-all hover:bg-black/60"
          >
            <ChevronLeft className="h-5 w-5 text-white/80" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 backdrop-blur-md transition-all hover:bg-black/60"
          >
            <ChevronRight className="h-5 w-5 text-white/80" />
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === currentIndex
                    ? "w-6 bg-amber-400"
                    : "w-1.5 bg-white/30 hover:bg-white/50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

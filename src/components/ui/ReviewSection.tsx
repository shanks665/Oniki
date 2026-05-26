"use client";

import { useState, useEffect } from "react";
import { Star, Flag, MessageSquare, Send } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import { cn, getRelativeTime } from "@/lib/utils";
import type { Review } from "@/types";

const REPORT_KEY = "reported_reviews";

function getReportedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(REPORT_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function saveReportedId(id: string) {
  const ids = getReportedIds();
  ids.add(id);
  localStorage.setItem(REPORT_KEY, JSON.stringify([...ids]));
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn("transition-transform", !readonly && "hover:scale-110")}
          aria-label={`${n}点`}
        >
          <Star
            className={cn(
              dim,
              (hovered || value) >= n ? "fill-amber-400 text-amber-400" : "fill-zinc-700 text-zinc-700"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    setReported(getReportedIds().has(review.id));
  }, [review.id]);

  const handleReport = async () => {
    if (reported || reporting) return;
    if (!confirm("この口コミを通報しますか？")) return;
    setReporting(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/report`, { method: "POST" });
      if (res.ok) {
        saveReportedId(review.id);
        setReported(true);
      }
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-zinc-300">
            {review.authorName}
          </span>
          <StarRating value={review.rating} readonly size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <span suppressHydrationWarning className="text-[10px] text-zinc-600">
            {getRelativeTime(review.createdAt)}
          </span>
          <button
            onClick={handleReport}
            disabled={reported || reporting}
            title={reported ? "通報済み" : "通報する"}
            className={cn(
              "rounded p-1 transition-colors",
              reported
                ? "cursor-default text-zinc-700"
                : "text-zinc-700 hover:text-red-400"
            )}
          >
            <Flag className="h-3 w-3" />
          </button>
        </div>
      </div>
      <p className="text-[13px] leading-relaxed text-zinc-400">{review.body}</p>
    </div>
  );
}

interface ReviewSectionProps {
  storeId: string;
  initialReviews: Review[];
}

export function ReviewSection({ storeId, initialReviews }: ReviewSectionProps) {
  const { reviews } = useReviews(storeId, initialReviews);

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("星を選んでください"); return; }
    if (body.trim().length === 0) { setError("本文を入力してください"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, authorName: authorName.trim() || "匿名", rating, body: body.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "投稿に失敗しました");
        return;
      }
      setSubmitted(true);
      setShowForm(false);
      setRating(0);
      setAuthorName("");
      setBody("");
    } catch {
      setError("投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-zinc-500" />
          <h2 className="text-[15px] font-bold text-zinc-200">口コミ</h2>
          {avgRating && (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-[13px] font-bold text-amber-400">{avgRating}</span>
              <span className="text-[11px] text-zinc-600">({reviews.length}件)</span>
            </div>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-zinc-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors hover:bg-white/[0.1]"
          >
            <Star className="h-3.5 w-3.5" />
            口コミを書く
          </button>
        )}
      </div>

      {submitted && (
        <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-[13px] text-emerald-400">
          投稿しました。ありがとうございます！
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
        >
          <div className="mb-3">
            <p className="mb-1.5 text-[11px] font-medium text-zinc-500">評価 *</p>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="mb-3">
            <p className="mb-1.5 text-[11px] font-medium text-zinc-500">
              お名前（省略可・最大20文字）
            </p>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value.slice(0, 20))}
              placeholder="匿名"
              className="w-full rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-zinc-200 placeholder-zinc-600 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] outline-none focus:shadow-[inset_0_0_0_1px_rgba(245,158,11,0.4)]"
            />
          </div>
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] font-medium text-zinc-500">本文 *</p>
              <span className="text-[10px] text-zinc-600">{body.length}/300</span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 300))}
              rows={4}
              placeholder="お店の雰囲気や感想を書いてください"
              className="w-full resize-none rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-zinc-200 placeholder-zinc-600 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] outline-none focus:shadow-[inset_0_0_0_1px_rgba(245,158,11,0.4)]"
            />
          </div>
          {error && <p className="mb-2 text-[12px] text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-[13px] font-bold text-zinc-900 transition-colors hover:bg-amber-400 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? "投稿中..." : "投稿する"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); }}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-[13px] text-zinc-400 hover:bg-zinc-800"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-zinc-600">
          まだ口コミがありません。最初の口コミを書いてみましょう！
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

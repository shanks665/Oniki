"use client";

export default function UserError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="mb-2 text-lg font-bold text-red-400">
        ページの読み込みに失敗しました
      </h2>
      <p className="mb-6 text-sm text-zinc-500">
        {error.message || "しばらくしてからもう一度お試しください。"}
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-zinc-800 px-6 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700"
      >
        再試行
      </button>
    </div>
  );
}

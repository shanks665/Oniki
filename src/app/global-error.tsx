"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="max-w-md px-4 text-center">
          <h1 className="mb-2 text-xl font-bold text-red-400">
            エラーが発生しました
          </h1>
          <p className="mb-6 text-sm text-zinc-500">
            {error.message || "予期しないエラーが発生しました。"}
          </p>
          <button
            onClick={reset}
            className="rounded-xl bg-zinc-800 px-6 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700"
          >
            再試行
          </button>
        </div>
      </body>
    </html>
  );
}

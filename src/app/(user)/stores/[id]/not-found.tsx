import Link from "next/link";

export default function StoreNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04]">
        <span className="text-3xl">😢</span>
      </div>
      <p className="text-[15px] font-semibold text-zinc-400">
        店舗が見つかりませんでした
      </p>
      <Link
        href="/"
        className="rounded-lg bg-white/[0.06] px-5 py-2 text-[13px] font-medium text-zinc-400 transition-colors hover:bg-white/[0.1]"
      >
        トップに戻る
      </Link>
    </div>
  );
}

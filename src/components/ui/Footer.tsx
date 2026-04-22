import Link from "next/link";
import { Wine } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#06060a]/80">
      {/* Age notice */}
      <div className="border-b border-white/[0.04] bg-red-500/[0.04]">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <p className="text-center text-[11px] font-medium leading-relaxed text-red-400/80">
            20歳未満の者の飲酒は法律で禁止されています。お酒は20歳になってから。
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Brand */}
        <div className="mb-6 flex items-center gap-2">
          <Wine className="h-4 w-4 text-amber-500/50" />
          <span className="text-sm font-bold tracking-tight text-zinc-500">
            BAR NAVI KUMAMOTO
          </span>
        </div>

        {/* Links */}
        <nav className="mb-6 flex flex-wrap gap-x-5 gap-y-2">
          <FooterLink href="/legal/terms">利用規約</FooterLink>
          <FooterLink href="/legal/privacy">プライバシーポリシー</FooterLink>
          <FooterLink href="/legal/tokushoho">特定商取引法に基づく表記</FooterLink>
        </nav>

        <p className="text-[11px] text-zinc-700">
          &copy; {new Date().getFullYear()} BAR NAVI KUMAMOTO. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-[12px] text-zinc-600 transition-colors hover:text-zinc-400"
    >
      {children}
    </Link>
  );
}

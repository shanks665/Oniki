"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wine, BarChart3, Settings, Ticket, CreditCard, ExternalLink, UserCog } from "lucide-react";
import { StoreAuthProvider } from "@/contexts/StoreAuthContext";
import { cn } from "@/lib/utils";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  return (
    <StoreAuthProvider>
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#06060a]/80 backdrop-blur-2xl">
          <div className="mx-auto flex h-12 max-w-xl items-center justify-between px-4">
            <Link href={isLoginPage ? "/login" : "/dashboard"} className="flex items-center gap-2">
              <Wine className="h-4.5 w-4.5 text-amber-500/80" />
              <span className="text-[13px] font-bold tracking-tight">
                <span className="text-amber-400">BAR NAVI</span>
                <span className="ml-2 text-zinc-600">管理画面</span>
              </span>
            </Link>
            {!isLoginPage && (
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-1 text-[11px] text-zinc-600 transition-colors hover:text-zinc-400"
              >
                <ExternalLink className="h-3 w-3" />
                サイトを見る
              </Link>
            )}
          </div>
          {!isLoginPage && (
            <nav className="flex border-t border-white/[0.04]">
              <NavTab href="/dashboard" label="ステータス" icon={BarChart3} active={pathname === "/dashboard"} />
              <NavTab href="/dashboard/edit" label="店舗情報" icon={Settings} active={pathname === "/dashboard/edit"} />
              <NavTab href="/dashboard/coupons" label="クーポン" icon={Ticket} active={pathname === "/dashboard/coupons"} />
              <NavTab href="/dashboard/billing" label="プラン" icon={CreditCard} active={pathname === "/dashboard/billing"} />
              <NavTab href="/dashboard/settings" label="設定" icon={UserCog} active={pathname === "/dashboard/settings"} />
            </nav>
          )}
        </header>
        <main>{children}</main>
      </div>
    </StoreAuthProvider>
  );
}

function NavTab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
        active
          ? "bg-white/[0.04] text-amber-400"
          : "text-zinc-600 hover:text-zinc-400"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

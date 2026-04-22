"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wine, LayoutDashboard, UserPlus, LogOut, ExternalLink } from "lucide-react";
import { signOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/admin/login");
  };

  const isLoginPage = pathname === "/admin/login";

  const navItems = [
    { href: "/admin", label: "店舗一覧", icon: LayoutDashboard },
    { href: "/admin/stores/new", label: "店舗追加", icon: UserPlus },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#06060a]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href={isLoginPage ? "/admin/login" : "/admin"} className="flex items-center gap-2">
              <Wine className="h-5 w-5 text-amber-500" />
              <span className="text-[13px] font-bold tracking-tight">
                <span className="text-amber-400">BAR NAVI</span>
                <span className="ml-1.5 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-extrabold text-red-400">
                  ADMIN
                </span>
              </span>
            </Link>
            {!isLoginPage && (
              <nav className="hidden items-center gap-1 sm:flex">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
                        isActive
                          ? "bg-white/[0.08] text-zinc-100"
                          : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
          {!isLoginPage && (
            <div className="flex items-center gap-2">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-600 transition-colors hover:bg-white/[0.04] hover:text-zinc-400"
              >
                <ExternalLink className="h-3 w-3" />
                サイトを見る
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-600 transition-colors hover:bg-white/[0.04] hover:text-red-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </div>
          )}
        </div>
        {/* Mobile nav */}
        {!isLoginPage && (
          <div className="flex border-t border-white/[0.04] sm:hidden">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors",
                    isActive
                      ? "bg-white/[0.05] text-amber-400"
                      : "text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}

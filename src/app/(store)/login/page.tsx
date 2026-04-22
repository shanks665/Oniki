"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wine, LogIn, Eye, EyeOff } from "lucide-react";
import { signIn } from "@/lib/firebase/auth";
import { useStoreAuth } from "@/hooks/useStoreAuth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authChecking } = useStoreAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authChecking && user) router.replace("/dashboard");
  }, [authChecking, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch {
      setError("メールアドレスまたはパスワードが正しくありません");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-48px)] items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.06),transparent_60%)]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="relative mb-5 inline-flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.2)]">
              <Wine className="h-8 w-8 text-amber-400" />
            </div>
          </div>
          <h1 className="text-xl font-extrabold text-zinc-100">店舗ログイン</h1>
          <p className="mt-1.5 text-[13px] text-zinc-600">
            運営から受け取ったアカウントでログイン
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/15 bg-red-500/[0.06] p-3.5 text-center text-[13px] text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-zinc-500">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              placeholder="store@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-zinc-500">
              パスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors hover:text-zinc-400"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-3.5 text-[14px] font-bold text-zinc-900 shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                ログイン
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

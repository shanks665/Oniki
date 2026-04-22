"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, Check } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useStoreAuth } from "@/hooks/useStoreAuth";
import { changePassword } from "@/lib/firebase/auth";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const { user, store, loading: authLoading, error: authError } = useStoreAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const isValid = currentPassword.length >= 6 && newPassword.length >= 6 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSaving(true);
    setResult(null);

    try {
      await changePassword(currentPassword, newPassword);
      setResult({ success: true, message: "パスワードを変更しました" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg =
        (err as { code?: string }).code === "auth/wrong-password" || (err as { code?: string }).code === "auth/invalid-credential"
          ? "現在のパスワードが正しくありません"
          : (err as { code?: string }).code === "auth/weak-password"
            ? "新しいパスワードは6文字以上にしてください"
            : "パスワードの変更に失敗しました";
      setResult({ success: false, message: msg });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <LoadingSpinner className="min-h-screen" />;
  if (authError || !store) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="mb-3 text-[15px] font-bold text-red-400">店舗情報を取得できません</p>
        <p className="mb-4 text-[13px] text-zinc-500">{authError || "店舗が見つかりません"}</p>
        <button onClick={() => window.location.reload()} className="rounded-xl bg-zinc-800 px-6 py-2.5 text-[13px] text-zinc-300 hover:bg-zinc-700">再試行</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-zinc-100">アカウント設定</h1>

      {/* Account info */}
      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-bold text-zinc-300">アカウント情報</h2>
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-zinc-500">メールアドレス</span>
            <span className="text-zinc-300">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">店舗名</span>
            <span className="text-zinc-300">{store.name}</span>
          </div>
        </div>
      </div>

      {/* Password change form */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-bold text-zinc-300">パスワード変更</h2>
        </div>

        {result && (
          <div
            className={cn(
              "mb-4 rounded-xl border p-3.5 text-center text-[13px]",
              result.success
                ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400"
                : "border-red-500/20 bg-red-500/[0.06] text-red-400"
            )}
          >
            {result.success && <Check className="mx-auto mb-1 h-5 w-5" />}
            {result.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">現在のパスワード</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                minLength={6}
                className="input-field pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">新しいパスワード（6文字以上）</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="input-field pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">新しいパスワード（確認）</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="input-field"
              placeholder="••••••••"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-[11px] text-red-400">パスワードが一致しません</p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !isValid}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-[14px] font-bold text-zinc-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900" />
            ) : (
              "パスワードを変更"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

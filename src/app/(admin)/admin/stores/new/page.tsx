"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Copy, Check } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { doc, onSnapshot } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { AREAS, GENRES } from "@/constants";

export default function CreateStorePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [genre, setGenre] = useState("authentic");
  const [area, setArea] = useState("shimotori");
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    email?: string;
    password?: string;
    error?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/admin/login");
      return;
    }
    if (!user) return;

    const unsub = onSnapshot(doc(getClientDb(), "admins", user.uid), (snap) => {
      if (snap.exists()) {
        setIsAdmin(true);
      } else {
        router.replace("/admin/login");
      }
      setCheckingAdmin(false);
    });
    return unsub;
  }, [user, authLoading, router]);

  const generatePassword = () => {
    const chars = "abcdefghijkmnpqrstuvwxyz23456789";
    let pw = "";
    for (let i = 0; i < 10; i++) {
      pw += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(pw);
  };

  useEffect(() => {
    generatePassword();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !storeName) return;
    setCreating(true);
    setResult(null);

    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/admin/create-store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password,
          storeName,
          genre,
          area,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, email, password });
        setEmail("");
        setStoreName("");
        generatePassword();
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch {
      setResult({ success: false, error: "作成に失敗しました" });
    } finally {
      setCreating(false);
    }
  };

  const copyCredentials = () => {
    if (!result?.email || !result?.password) return;
    navigator.clipboard.writeText(
      `メール: ${result.email}\nパスワード: ${result.password}\nログインURL: ${window.location.origin}/login`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || checkingAdmin || !isAdmin)
    return <LoadingSpinner className="min-h-screen" />;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        管理画面に戻る
      </button>

      <h1 className="mb-6 text-xl font-bold text-zinc-100">
        新規店舗アカウント作成
      </h1>

      {/* Success result */}
      {result?.success && (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="mb-3 font-bold text-emerald-400">
            アカウントを作成しました
          </p>
          <div className="rounded-xl bg-zinc-900 p-4 font-mono text-sm">
            <p className="text-zinc-400">
              メール:{" "}
              <span className="text-zinc-100">{result.email}</span>
            </p>
            <p className="text-zinc-400">
              パスワード:{" "}
              <span className="text-zinc-100">{result.password}</span>
            </p>
          </div>
          <button
            onClick={copyCredentials}
            className="mt-3 flex items-center gap-1.5 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                コピーしました
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                ログイン情報をコピー
              </>
            )}
          </button>
        </div>
      )}

      {/* Error result */}
      {result && !result.success && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {result.error}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-4 text-sm font-bold text-zinc-300">
            ログイン情報
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">
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
              <label className="mb-1.5 block text-xs text-zinc-500">
                パスワード
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={generatePassword}
                  className="shrink-0 rounded-xl border border-zinc-700 px-3 text-xs text-zinc-400 hover:bg-zinc-800"
                >
                  再生成
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-4 text-sm font-bold text-zinc-300">
            店舗基本情報
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">
                店名
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                className="input-field"
                placeholder="BAR Example"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">
                ジャンル
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="input-field"
              >
                {Object.entries(GENRES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">
                エリア
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="input-field"
              >
                {Object.entries(AREAS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
        >
          {creating ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900" />
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              アカウントを作成
            </>
          )}
        </button>
      </form>
    </div>
  );
}

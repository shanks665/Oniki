"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  ImagePlus,
  AlertTriangle,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useStoreAuth } from "@/hooks/useStoreAuth";
import { uploadStoreImage, deleteStoreImage } from "@/lib/firebase/storage";
import { AREAS, GENRES, MAX_FREE_IMAGES, MAX_PREMIUM_IMAGES } from "@/constants";
import { cn } from "@/lib/utils";
import type { AreaKey, GenreKey } from "@/types";

export default function EditPage() {
  const router = useRouter();
  const { user, store, loading: authLoading, error: authError, refresh } = useStoreAuth();

  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [systemInfo, setSystemInfo] = useState("");
  const [openTime, setOpenTime] = useState("18:00");
  const [closeTime, setCloseTime] = useState("02:00");
  const [holidays, setHolidays] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [googleMapsEmbedUrl, setGoogleMapsEmbedUrl] = useState("");
  const [googleMapsDirectionUrl, setGoogleMapsDirectionUrl] = useState("");
  const [counterTotal, setCounterTotal] = useState(0);
  const [tableTotal, setTableTotal] = useState(0);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Avoid re-hydrating on every `store` reference change (e.g. StoreAuthContext polls every 15s). */
  const hydratedStoreIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!store) {
      hydratedStoreIdRef.current = null;
      return;
    }
    if (hydratedStoreIdRef.current === store.id) return;
    hydratedStoreIdRef.current = store.id;

    setName(store.name);
    setGenre(store.genre);
    setArea(store.area);
    setDescription(store.description || "");
    setAddress(store.address || "");
    setPhone(store.phone || "");
    setBudgetRange(store.budgetRange || "");
    setSystemInfo(store.systemInfo || "");
    setOpenTime(store.businessHours.open);
    setCloseTime(store.businessHours.close);
    setHolidays(store.businessHours.holidays);
    setImages(store.images || []);
    setGoogleMapsEmbedUrl(store.googleMapsEmbedUrl || "");
    setGoogleMapsDirectionUrl(store.googleMapsDirectionUrl || "");
    setCounterTotal(store.seatCapacity?.counterTotal ?? 0);
    setTableTotal(store.seatCapacity?.tableTotal ?? 0);
  }, [store]);

  const maxImages = store?.plan === "premium" ? MAX_PREMIUM_IMAGES : MAX_FREE_IMAGES;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!store || !e.target.files?.length) return;
    if (images.length >= maxImages) return;

    setUploading(true);
    try {
      const file = e.target.files[0];
      const url = await uploadStoreImage(store.id, file, images.length);
      setImages((prev) => [...prev, url]);
    } catch {
      alert("画像のアップロードに失敗しました");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async (index: number) => {
    const url = images[index];
    setImages((prev) => prev.filter((_, i) => i !== index));
    await deleteStoreImage(url);
  };

  const handleSave = async () => {
    if (!store || !user) return;
    setSaving(true);
    setSaveMessage("");

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/store/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          storeId: store.id,
          name,
          genre,
          area,
          description,
          address,
          phone,
          budgetRange,
          systemInfo,
          businessHours: { open: openTime, close: closeTime, holidays },
          images,
          googleMapsEmbedUrl,
          googleMapsDirectionUrl,
          seatCapacity: { counterTotal, tableTotal },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      await refresh();
      setSaveMessage("保存しました");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const dayOptions = ["月曜", "火曜", "水曜", "木曜", "金曜", "土曜", "日曜"];

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
    <div className="mx-auto max-w-xl px-4 py-6 pb-24">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        ダッシュボードに戻る
      </button>

      <h1 className="mb-6 text-xl font-bold text-zinc-100">店舗情報の編集</h1>

      <div className="space-y-6">
        {/* Images */}
        <Section title="写真">
          <div className="flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={url} className="group relative h-24 w-24 overflow-hidden rounded-xl">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => handleRemoveImage(i)}
                  className="absolute top-1 right-1 rounded-full bg-zinc-900/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3 text-red-400" />
                </button>
              </div>
            ))}
            {images.length < maxImages && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
              >
                {uploading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-amber-500" />
                ) : (
                  <ImagePlus className="h-6 w-6" />
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {store.plan === "free" && (
            <p className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
              <AlertTriangle className="h-3 w-3" />
              無料プランは1枚まで。プレミアムなら最大{MAX_PREMIUM_IMAGES}枚
            </p>
          )}
        </Section>

        {/* Basic info */}
        <Section title="基本情報">
          <Field label="店名">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </Field>
          <Field label="ジャンル">
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="input-field"
            >
              {Object.entries(GENRES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="エリア">
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="input-field"
            >
              {Object.entries(AREAS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="紹介文">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input-field resize-none"
            />
          </Field>
        </Section>

        {/* Contact & location */}
        <Section title="連絡先・所在地">
          <Field label="住所">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field"
              placeholder="熊本市中央区..."
            />
          </Field>
          <Field label="電話番号">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              placeholder="096-XXX-XXXX"
            />
          </Field>
          <Field label="Googleマップ埋め込みURL">
            <input
              type="url"
              value={googleMapsEmbedUrl}
              onChange={(e) => setGoogleMapsEmbedUrl(e.target.value)}
              className="input-field"
              placeholder="https://www.google.com/maps/embed?..."
            />
          </Field>
          <Field label="Googleマップ経路URL">
            <input
              type="url"
              value={googleMapsDirectionUrl}
              onChange={(e) => setGoogleMapsDirectionUrl(e.target.value)}
              className="input-field"
              placeholder="https://www.google.com/maps/dir/..."
            />
          </Field>
        </Section>

        {/* Seat capacity */}
        <Section title="席数の設定">
          <p className="mb-1 text-xs text-zinc-500">
            お店の総席数を設定してください。ダッシュボードで空席数を更新する際の上限になります。
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="カウンター総席数">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCounterTotal((v) => Math.max(0, v - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-lg font-bold text-zinc-300 transition-colors hover:bg-zinc-700"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  value={counterTotal}
                  onChange={(e) => setCounterTotal(Math.max(0, Number(e.target.value)))}
                  className="input-field flex-1 text-center tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => setCounterTotal((v) => v + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-lg font-bold text-zinc-300 transition-colors hover:bg-zinc-700"
                >
                  ＋
                </button>
              </div>
            </Field>
            <Field label="テーブル総席数">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTableTotal((v) => Math.max(0, v - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-lg font-bold text-zinc-300 transition-colors hover:bg-zinc-700"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  value={tableTotal}
                  onChange={(e) => setTableTotal(Math.max(0, Number(e.target.value)))}
                  className="input-field flex-1 text-center tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => setTableTotal((v) => v + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-lg font-bold text-zinc-300 transition-colors hover:bg-zinc-700"
                >
                  ＋
                </button>
              </div>
            </Field>
          </div>
        </Section>

        {/* Business info */}
        <Section title="営業情報">
          <div className="grid grid-cols-2 gap-3">
            <Field label="開店時間">
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="閉店時間">
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="input-field"
              />
            </Field>
          </div>
          <Field label="定休日">
            <div className="flex flex-wrap gap-2">
              {dayOptions.map((day) => (
                <button
                  key={day}
                  onClick={() =>
                    setHolidays((prev) =>
                      prev.includes(day)
                        ? prev.filter((d) => d !== day)
                        : [...prev, day]
                    )
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    holidays.includes(day)
                      ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </Field>
          <Field label="予算目安">
            <input
              type="text"
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              className="input-field"
              placeholder="2,000〜4,000円"
            />
          </Field>
          <Field label="システム（チャージ料等）">
            <input
              type="text"
              value={systemInfo}
              onChange={(e) => setSystemInfo(e.target.value)}
              className="input-field"
              placeholder="チャージ500円 / カラオケ無料"
            />
          </Field>
        </Section>
      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          {saveMessage && (
            <p className={cn(
              "text-sm",
              saveMessage.includes("失敗") ? "text-red-400" : "text-emerald-400"
            )}>
              {saveMessage}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="ml-auto flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="mb-4 text-sm font-bold text-zinc-300">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

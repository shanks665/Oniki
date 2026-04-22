import { AreaKey, GenreKey, StoreStatus } from "@/types";

export const AREAS: Record<AreaKey, string> = {
  shimotori: "下通",
  kamitori: "上通",
  ginnan: "銀杏北通り",
  shinshigai: "新市街",
  other: "その他",
};

export const GENRES: Record<GenreKey, string> = {
  authentic: "オーセンティック",
  darts: "ダーツバー",
  girls: "ガールズバー",
  muscle: "マッスルバー",
  apparel: "アパレル×バー",
  standing: "立ち飲み",
  other: "その他",
};

export const STATUS_CONFIG: Record<
  StoreStatus,
  { label: string; emoji: string; colorClass: string; bgClass: string }
> = {
  available: {
    label: "空席あり",
    emoji: "🟢",
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-500/20 border-emerald-500/30",
  },
  slightly_crowded: {
    label: "やや混雑",
    emoji: "🟡",
    colorClass: "text-amber-400",
    bgClass: "bg-amber-500/20 border-amber-500/30",
  },
  full: {
    label: "満席",
    emoji: "🔴",
    colorClass: "text-red-400",
    bgClass: "bg-red-500/20 border-red-500/30",
  },
  closed: {
    label: "営業終了",
    emoji: "⚫",
    colorClass: "text-zinc-400",
    bgClass: "bg-zinc-500/20 border-zinc-500/30",
  },
};

export const PLAN_PRICE = 3000;
export const PLAN_TRIAL_DAYS = 30;
export const PAYMENT_GRACE_DAYS = 7;
export const STALE_THRESHOLD_MINUTES = 60;
export const MAX_FREE_IMAGES = 1;
export const MAX_PREMIUM_IMAGES = 5;

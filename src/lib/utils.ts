import { Timestamp } from "firebase/firestore";
import { STALE_THRESHOLD_MINUTES } from "@/constants";
import type { BusinessHours, Store } from "@/types";

function toMillis(ts: unknown): number | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toMillis();
  if (typeof ts === "string") return new Date(ts).getTime();
  if (typeof ts === "object" && ts !== null && "seconds" in ts) {
    return (ts as { seconds: number }).seconds * 1000;
  }
  return null;
}

export function getRelativeTime(timestamp: unknown): string {
  const ms = toMillis(timestamp);
  if (ms === null) return "未更新";
  const diffMin = Math.floor((Date.now() - ms) / 60000);

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}時間前`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}日前`;
}

export function isStale(timestamp: unknown): boolean {
  const ms = toMillis(timestamp);
  if (ms === null) return true;
  return (Date.now() - ms) / 60000 >= STALE_THRESHOLD_MINUTES;
}

export function isWithinBusinessHours(bh: BusinessHours): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = bh.open.split(":").map(Number);
  const [closeH, closeM] = bh.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;

  // Handle overnight hours (e.g., 18:00 - 02:00)
  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60;
    const adjusted =
      currentMinutes < openMinutes
        ? currentMinutes + 24 * 60
        : currentMinutes;
    return adjusted >= openMinutes && adjusted < closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export function isTodayHoliday(bh: BusinessHours): boolean {
  const days = ["日曜", "月曜", "火曜", "水曜", "木曜", "金曜", "土曜"];
  const today = days[new Date().getDay()];
  return bh.holidays.includes(today);
}

export function getEffectiveStatus(store: Store): Store["status"] {
  if (
    isTodayHoliday(store.businessHours) ||
    !isWithinBusinessHours(store.businessHours)
  ) {
    return "closed";
  }
  return store.status;
}

export function sortStores(stores: Store[]): Store[] {
  return [...stores].sort((a, b) => {
    if (a.plan === "premium" && b.plan !== "premium") return -1;
    if (a.plan !== "premium" && b.plan === "premium") return 1;

    const statusOrder = { available: 0, slightly_crowded: 1, full: 2, closed: 3 };
    const aStatus = getEffectiveStatus(a);
    const bStatus = getEffectiveStatus(b);
    return statusOrder[aStatus] - statusOrder[bStatus];
  });
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

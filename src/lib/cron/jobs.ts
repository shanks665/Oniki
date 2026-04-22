import { getAdminDb } from "@/lib/firebase/admin";
import { getBilling, setBilling } from "@/lib/firebase/billing";
import { getStripeServer } from "@/lib/stripe/config";
import { FieldValue } from "firebase-admin/firestore";
import { PAYMENT_GRACE_DAYS } from "@/constants";

function toMillis(ts: unknown): number | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === "string") return new Date(ts).getTime();
  if (typeof ts === "object" && ts !== null && "seconds" in ts) {
    return (ts as { seconds: number }).seconds * 1000;
  }
  if (typeof ts === "object" && ts !== null && "toMillis" in ts) {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return null;
}

export async function runResetStatusJob(): Promise<{
  resetCount: number;
  downgradeCount: number;
  checkedAt: string;
}> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb
    .collection("stores")
    .where("isActive", "==", true)
    .get();

  const now = new Date();
  const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const currentMinutes = jst.getHours() * 60 + jst.getMinutes();
  let resetCount = 0;
  let downgradeCount = 0;

  const batch = adminDb.batch();

  for (const doc of snapshot.docs) {
    const store = doc.data();

    if (store.subscriptionStatus === "past_due") {
      const billing = await getBilling(doc.id);
      if (billing.paymentFailedAt) {
        const failedMs = toMillis(billing.paymentFailedAt);
        if (failedMs) {
          const graceLimitMs = PAYMENT_GRACE_DAYS * 24 * 60 * 60 * 1000;
          if (now.getTime() - failedMs >= graceLimitMs) {
            batch.update(doc.ref, {
              plan: "free",
              subscriptionStatus: "canceled",
            });
            await setBilling(doc.id, { paymentFailedAt: null });
            downgradeCount++;
            continue;
          }
        }
      }
    }

    if (store.status === "closed") continue;

    const bh = store.businessHours;
    if (!bh?.open || !bh?.close) continue;

    const [openH, openM] = bh.open.split(":").map(Number);
    const [closeH, closeM] = bh.close.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    let closeMinutes = closeH * 60 + closeM;

    let isOpen: boolean;

    if (closeMinutes <= openMinutes) {
      closeMinutes += 24 * 60;
      const adjusted =
        currentMinutes < openMinutes
          ? currentMinutes + 24 * 60
          : currentMinutes;
      isOpen = adjusted >= openMinutes && adjusted < closeMinutes;
    } else {
      isOpen =
        currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    }

    const days = ["日曜", "月曜", "火曜", "水曜", "木曜", "金曜", "土曜"];
    const today = days[jst.getDay()];
    const isHoliday =
      Array.isArray(bh.holidays) && bh.holidays.includes(today);

    if (!isOpen || isHoliday) {
      batch.update(doc.ref, {
        status: "closed",
        statusUpdatedAt: FieldValue.serverTimestamp(),
      });
      resetCount++;
    }
  }

  if (resetCount > 0 || downgradeCount > 0) {
    await batch.commit();
  }

  return {
    resetCount,
    downgradeCount,
    checkedAt: now.toISOString(),
  };
}

export async function runSyncSubscriptionsJob(): Promise<{
  checked: number;
  synced: number;
  errors?: string[];
}> {
  const adminDb = getAdminDb();
  const stripe = getStripeServer();

  const snapshot = await adminDb
    .collection("stores")
    .where("subscriptionStatus", "in", ["active", "trialing", "past_due"])
    .get();

  let syncCount = 0;
  const errors: string[] = [];

  for (const doc of snapshot.docs) {
    const store = doc.data();
    const billing = await getBilling(doc.id);

    if (!billing.stripeSubscriptionId) continue;

    try {
      const sub = await stripe.subscriptions.retrieve(
        billing.stripeSubscriptionId
      );

      const needsUpdate: Record<string, unknown> = {};

      if (sub.status === "canceled" || sub.status === "unpaid") {
        if (store.plan !== "free") needsUpdate.plan = "free";
        if (store.subscriptionStatus !== "canceled")
          needsUpdate.subscriptionStatus = "canceled";
      } else if (sub.status === "active") {
        if (store.plan !== "premium") needsUpdate.plan = "premium";
        if (store.subscriptionStatus !== "active")
          needsUpdate.subscriptionStatus = "active";
      } else if (sub.status === "past_due") {
        if (store.subscriptionStatus !== "past_due")
          needsUpdate.subscriptionStatus = "past_due";
      } else if (sub.status === "trialing") {
        if (store.plan !== "premium") needsUpdate.plan = "premium";
        if (store.subscriptionStatus !== "trialing")
          needsUpdate.subscriptionStatus = "trialing";
      }

      if (Object.keys(needsUpdate).length > 0) {
        await adminDb.collection("stores").doc(doc.id).update(needsUpdate);
        syncCount++;
      }
    } catch (e) {
      errors.push(`${doc.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return {
    checked: snapshot.size,
    synced: syncCount,
    ...(errors.length > 0 ? { errors } : {}),
  };
}

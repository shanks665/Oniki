import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getBilling, setBilling } from "@/lib/firebase/billing";
import { FieldValue } from "firebase-admin/firestore";
import { PAYMENT_GRACE_DAYS } from "@/constants";

export const dynamic = "force-dynamic";

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

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

      // --- Grace period: downgrade past_due stores after N days ---
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

      // --- Business hours reset ---
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

    return NextResponse.json({
      success: true,
      resetCount,
      downgradeCount,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron reset error:", error);
    return NextResponse.json(
      { error: "Reset failed" },
      { status: 500 }
    );
  }
}

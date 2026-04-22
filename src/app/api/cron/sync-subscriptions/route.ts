import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getStripeServer } from "@/lib/stripe/config";
import { getBilling } from "@/lib/firebase/billing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    return NextResponse.json({
      success: true,
      checked: snapshot.size,
      synced: syncCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Sync subscriptions error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

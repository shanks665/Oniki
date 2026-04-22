import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/api/auth";
import { getBilling } from "@/lib/firebase/billing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    const { decoded } = authResult;

    const snapshot = await getAdminDb()
      .collection("stores")
      .where("ownerId", "==", decoded.uid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ store: null });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const billing = await getBilling(doc.id);

    return NextResponse.json({
      store: {
        id: doc.id,
        ...data,
        stripeCustomerId: billing.stripeCustomerId ?? null,
        stripeSubscriptionId: billing.stripeSubscriptionId ?? null,
        trialEndDate: billing.trialEndDate
          ? (billing.trialEndDate instanceof Date
              ? billing.trialEndDate.toISOString()
              : (billing.trialEndDate as { toDate?: () => Date }).toDate?.()?.toISOString() ?? null)
          : null,
        statusUpdatedAt: data.statusUpdatedAt?.toDate?.()?.toISOString() ?? null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("[/api/store/me] ERROR:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

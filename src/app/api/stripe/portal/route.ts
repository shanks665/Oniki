import { NextRequest, NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/config";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/api/auth";
import { getBilling } from "@/lib/firebase/billing";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    const { storeId } = await req.json();

    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const storeDoc = await adminDb.collection("stores").doc(storeId).get();
    if (!storeDoc.exists) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const store = storeDoc.data()!;

    if (store.ownerId !== authResult.decoded.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const billing = await getBilling(storeId);
    const stripe = getStripeServer();

    if (!billing.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}

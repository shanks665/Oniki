import { NextRequest, NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/config";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/api/auth";
import { getBilling, setBilling } from "@/lib/firebase/billing";
import { PLAN_TRIAL_DAYS } from "@/constants";

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

    if (store.plan === "premium" && store.subscriptionStatus !== "canceled") {
      return NextResponse.json(
        { error: "既にプレミアムプランに加入中です" },
        { status: 400 }
      );
    }

    const billing = await getBilling(storeId);

    const hasUsedTrial = !!(
      billing.stripeSubscriptionId ||
      store.subscriptionStatus === "canceled" ||
      billing.trialEndDate
    );

    const stripe = getStripeServer();
    let customerId = billing.stripeCustomerId;

    if (!customerId) {
      const ownerEmail = authResult.decoded.email;
      const customer = await stripe.customers.create({
        email: ownerEmail || undefined,
        metadata: { storeId, storeName: store.name },
      });
      customerId = customer.id;
      await setBilling(storeId, { stripeCustomerId: customerId });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price not configured" },
        { status: 500 }
      );
    }

    const trialDays = hasUsedTrial ? undefined : PLAN_TRIAL_DAYS;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      automatic_tax: { enabled: true },
      customer_update: { address: "auto" },
      subscription_data: {
        ...(trialDays ? { trial_period_days: trialDays } : {}),
        metadata: { storeId },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      metadata: { storeId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

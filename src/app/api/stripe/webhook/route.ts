import { NextRequest, NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/config";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

function extractSubscriptionId(obj: unknown): string | null {
  const record = obj as { subscription?: string | { id: string } | null };
  if (!record.subscription) return null;
  if (typeof record.subscription === "string") return record.subscription;
  return record.subscription.id;
}

function storeRef(storeId: string) {
  return getAdminDb().collection("stores").doc(storeId);
}

function billingRef(storeId: string) {
  return storeRef(storeId).collection("private").doc("billing");
}

function historyRef(storeId: string) {
  return storeRef(storeId).collection("billingHistory").doc();
}

function eventRef(eventId: string) {
  return getAdminDb().collection("stripeEvents").doc(eventId);
}

async function isEventProcessed(eventId: string): Promise<boolean> {
  return (await eventRef(eventId).get()).exists;
}

function addHistory(
  batch: FirebaseFirestore.WriteBatch,
  storeId: string,
  action: string,
  detail: Record<string, unknown>
) {
  batch.set(historyRef(storeId), {
    action,
    ...detail,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const stripe = getStripeServer();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (await isEventProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const adminDb = getAdminDb();

  try {
    const batch = adminDb.batch();
    let handled = false;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const storeId = session.metadata?.storeId;
        if (storeId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          batch.update(storeRef(storeId), {
            plan: "premium",
            subscriptionStatus: subscription.status,
          });
          batch.set(billingRef(storeId), {
            stripeSubscriptionId: subscription.id,
            trialEndDate: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
            paymentFailedAt: null,
          }, { merge: true });
          addHistory(batch, storeId, "checkout_completed", {
            subscriptionId: subscription.id,
            status: subscription.status,
            trialEnd: subscription.trial_end,
          });
          handled = true;
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const storeId = subscription.metadata?.storeId;
        if (storeId) {
          const storeUpdates: Record<string, unknown> = {
            subscriptionStatus: subscription.status,
          };
          if (subscription.status === "active" || subscription.status === "past_due") {
            storeUpdates.plan = "premium";
          }
          batch.update(storeRef(storeId), storeUpdates);
          if (subscription.status === "active") {
            batch.set(billingRef(storeId), { paymentFailedAt: null }, { merge: true });
          }
          addHistory(batch, storeId, "subscription_updated", {
            subscriptionId: subscription.id,
            status: subscription.status,
          });
          handled = true;
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const storeId = subscription.metadata?.storeId;
        if (storeId) {
          batch.update(storeRef(storeId), {
            plan: "free",
            subscriptionStatus: "canceled",
          });
          batch.set(billingRef(storeId), {
            stripeSubscriptionId: null,
            paymentFailedAt: null,
          }, { merge: true });
          addHistory(batch, storeId, "subscription_deleted", {
            subscriptionId: subscription.id,
          });
          handled = true;
        }
        break;
      }

      case "invoice.payment_failed": {
        const failedSubId = extractSubscriptionId(event.data.object);
        if (failedSubId) {
          const subscription = await stripe.subscriptions.retrieve(failedSubId);
          const storeId = subscription.metadata?.storeId;
          if (storeId) {
            batch.update(storeRef(storeId), { subscriptionStatus: "past_due" });
            const billingSnap = await billingRef(storeId).get();
            if (!billingSnap.data()?.paymentFailedAt) {
              batch.set(billingRef(storeId), {
                paymentFailedAt: FieldValue.serverTimestamp(),
              }, { merge: true });
            }
            addHistory(batch, storeId, "payment_failed", {
              subscriptionId: failedSubId,
            });
            handled = true;
          }
        }
        break;
      }

      case "invoice.paid": {
        const paidSubId = extractSubscriptionId(event.data.object);
        if (paidSubId) {
          const subscription = await stripe.subscriptions.retrieve(paidSubId);
          const storeId = subscription.metadata?.storeId;
          if (storeId) {
            batch.update(storeRef(storeId), {
              plan: "premium",
              subscriptionStatus: "active",
            });
            batch.set(billingRef(storeId), { paymentFailedAt: null }, { merge: true });
            addHistory(batch, storeId, "payment_succeeded", {
              subscriptionId: paidSubId,
            });
            handled = true;
          }
        }
        break;
      }
    }

    batch.set(eventRef(event.id), {
      type: event.type,
      processedAt: FieldValue.serverTimestamp(),
    });

    if (handled) {
      await batch.commit();
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

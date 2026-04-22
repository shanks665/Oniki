import { getAdminDb } from "./admin";

const BILLING_DOC = "billing";
const PRIVATE_COLLECTION = "private";

export interface BillingData {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndDate: Date | null;
  paymentFailedAt: FirebaseFirestore.Timestamp | Date | null;
}

function billingRef(storeId: string) {
  return getAdminDb()
    .collection("stores")
    .doc(storeId)
    .collection(PRIVATE_COLLECTION)
    .doc(BILLING_DOC);
}

export async function getBilling(
  storeId: string
): Promise<Partial<BillingData>> {
  const snap = await billingRef(storeId).get();
  return snap.exists ? (snap.data() as Partial<BillingData>) : {};
}

export async function setBilling(
  storeId: string,
  data: Partial<BillingData>
): Promise<void> {
  await billingRef(storeId).set(data, { merge: true });
}

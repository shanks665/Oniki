import { getAdminDb } from "./admin";
import type { Store, Coupon } from "@/types";

function serializeTimestamp(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null && "toDate" in val) {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === "object" && val !== null && "seconds" in val) {
    return new Date((val as { seconds: number }).seconds * 1000).toISOString();
  }
  return null;
}

function docToStore(doc: FirebaseFirestore.DocumentSnapshot): Store {
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    statusUpdatedAt: serializeTimestamp(data.statusUpdatedAt),
    createdAt: serializeTimestamp(data.createdAt) ?? new Date().toISOString(),
    updatedAt: serializeTimestamp(data.updatedAt) ?? new Date().toISOString(),
    trialEndDate: serializeTimestamp(data.trialEndDate),
  } as Store;
}

export async function getActiveStores(): Promise<Store[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection("stores")
    .where("isActive", "==", true)
    .get();
  return snapshot.docs.map(docToStore);
}

export async function getStoreById(storeId: string): Promise<Store | null> {
  const db = getAdminDb();
  const doc = await db.collection("stores").doc(storeId).get();
  if (!doc.exists) return null;
  return docToStore(doc);
}

export async function getActiveCouponsForStore(storeId: string): Promise<Coupon[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection("coupons")
    .where("storeId", "==", storeId)
    .where("isActive", "==", true)
    .get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: serializeTimestamp(data.createdAt) ?? new Date().toISOString(),
      updatedAt: serializeTimestamp(data.updatedAt) ?? new Date().toISOString(),
    } as Coupon;
  });
}

export async function getAllActiveCoupons(): Promise<Record<string, Coupon[]>> {
  const db = getAdminDb();
  const snapshot = await db
    .collection("coupons")
    .where("isActive", "==", true)
    .get();
  const map: Record<string, Coupon[]> = {};
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const coupon = {
      id: doc.id,
      ...data,
      createdAt: serializeTimestamp(data.createdAt) ?? new Date().toISOString(),
      updatedAt: serializeTimestamp(data.updatedAt) ?? new Date().toISOString(),
    } as Coupon;
    if (!map[coupon.storeId]) map[coupon.storeId] = [];
    map[coupon.storeId].push(coupon);
  }
  return map;
}

export async function getAllActiveStoreIds(): Promise<string[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection("stores")
    .where("isActive", "==", true)
    .select()
    .get();
  return snapshot.docs.map((doc) => doc.id);
}

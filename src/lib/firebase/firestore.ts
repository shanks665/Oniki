import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getClientDb } from "./config";
import type { Store, Coupon, StoreStatus, SeatDetail } from "@/types";

const STORES_COLLECTION = "stores";
const COUPONS_COLLECTION = "coupons";

export function subscribeToStores(
  callback: (stores: Store[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(getClientDb(), STORES_COLLECTION),
    where("isActive", "==", true)
  );
  return onSnapshot(q, (snapshot) => {
    const stores = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Store
    );
    callback(stores);
  }, (err) => {
    console.error("subscribeToStores error:", err);
    onError?.(err);
  });
}

export function subscribeToStore(
  storeId: string,
  callback: (store: Store | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(doc(getClientDb(), STORES_COLLECTION, storeId), (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as Store);
    } else {
      callback(null);
    }
  }, (err) => {
    console.error("subscribeToStore error:", err);
    onError?.(err);
  });
}

export async function getStore(storeId: string): Promise<Store | null> {
  const snapshot = await getDoc(doc(getClientDb(), STORES_COLLECTION, storeId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Store;
}

export async function getStoreByOwnerId(
  ownerId: string
): Promise<Store | null> {
  const q = query(
    collection(getClientDb(), STORES_COLLECTION),
    where("ownerId", "==", ownerId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as Store;
}

export async function updateStoreStatus(
  storeId: string,
  status: StoreStatus,
  seatDetail?: SeatDetail | null
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    statusUpdatedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  if (seatDetail !== undefined) {
    updates.seatDetail = seatDetail;
  }
  await updateDoc(doc(getClientDb(), STORES_COLLECTION, storeId), updates);
}

export async function updateStoreInfo(
  storeId: string,
  data: Partial<Omit<Store, "id" | "createdAt" | "ownerId">>
): Promise<void> {
  await updateDoc(doc(getClientDb(), STORES_COLLECTION, storeId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export function subscribeToCoupons(
  storeId: string,
  callback: (coupons: Coupon[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(getClientDb(), COUPONS_COLLECTION),
    where("storeId", "==", storeId)
  );
  return onSnapshot(q, (snapshot) => {
    const coupons = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Coupon
    );
    callback(coupons);
  }, (err) => {
    console.error("subscribeToCoupons error:", err);
    onError?.(err);
  });
}

export function subscribeToActiveCoupons(
  storeId: string,
  callback: (coupons: Coupon[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(getClientDb(), COUPONS_COLLECTION),
    where("storeId", "==", storeId),
    where("isActive", "==", true)
  );
  return onSnapshot(q, (snapshot) => {
    const coupons = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Coupon
    );
    callback(coupons);
  }, (err) => {
    console.error("subscribeToActiveCoupons error:", err);
    onError?.(err);
  });
}

export async function createCoupon(
  storeId: string,
  title: string,
  description: string
): Promise<string> {
  const ref = doc(collection(getClientDb(), COUPONS_COLLECTION));
  const coupon: Omit<Coupon, "id"> = {
    storeId,
    title,
    description,
    isActive: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await setDoc(ref, coupon);
  return ref.id;
}

export async function toggleCoupon(
  couponId: string,
  isActive: boolean
): Promise<void> {
  await updateDoc(doc(getClientDb(), COUPONS_COLLECTION, couponId), {
    isActive,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteCoupon(couponId: string): Promise<void> {
  await deleteDoc(doc(getClientDb(), COUPONS_COLLECTION, couponId));
}

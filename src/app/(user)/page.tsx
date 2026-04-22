import { Suspense } from "react";
import { getActiveStores, getAllActiveCoupons } from "@/lib/firebase/server-firestore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TopPageClient } from "./TopPageClient";
import { sortStores } from "@/lib/utils";

export const revalidate = 30;

export default async function TopPage() {
  const [stores, couponMap] = await Promise.all([
    getActiveStores(),
    getAllActiveCoupons(),
  ]);

  const sorted = sortStores(stores);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TopPageClient
        initialStores={sorted}
        initialCouponMap={couponMap}
      />
    </Suspense>
  );
}

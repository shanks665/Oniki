import { Suspense } from "react";
import { getActiveStores, getAllActiveCoupons } from "@/lib/firebase/server-firestore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TopPageClient } from "./TopPageClient";

// Runtime render only — Admin SDK needs server secrets that may be
// unavailable during `next build` on Vercel (runtime-only env vars).
export const dynamic = "force-dynamic";

export default async function TopPage() {
  const [stores, couponMap] = await Promise.all([
    getActiveStores(),
    getAllActiveCoupons(),
  ]);

  // Sort by plan only on the server. Status-based sort is time-dependent and
  // applied client-side after hydration to avoid SSR/client mismatches.
  const planOrder: Record<string, number> = { priority: 0, premium: 1 };
  const sorted = [...stores].sort(
    (a, b) => (planOrder[a.plan] ?? 2) - (planOrder[b.plan] ?? 2)
  );

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TopPageClient
        initialStores={sorted}
        initialCouponMap={couponMap}
      />
    </Suspense>
  );
}

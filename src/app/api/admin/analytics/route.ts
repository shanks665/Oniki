import { NextRequest, NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { verifyAuth } from "@/lib/api/auth";
import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

function getAnalyticsClient() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  return new BetaAnalyticsDataClient({ credentials: JSON.parse(json) });
}

const PROPERTY_ID = process.env.GA4_PROPERTY_ID ?? "";

/** Extract storeId from a GA4 pagePath value like "/stores/abc123" or "/stores/abc123?..." */
function extractStoreId(pagePath: string): string | null {
  const match = pagePath.match(/^\/stores\/([^/?#]+)/);
  return match ? match[1] : null;
}

export async function GET(req: NextRequest) {
  try {
    if (!PROPERTY_ID) {
      return NextResponse.json({ error: "Analytics not configured" }, { status: 503 });
    }

    // Admin-only endpoint
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    const db = getAdminDb();
    const adminDoc = await db.collection("admins").doc(authResult.decoded.uid).get();
    if (!adminDoc.exists) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = getAnalyticsClient();

    // Fetch today's and this month's new users per store page in two parallel reports.
    // Using pagePath dimension lets us cover all stores in a single API call.
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const firstOfMonth = todayStr.slice(0, 7) + "-01";

    const [todayRes, monthRes] = await Promise.all([
      client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: todayStr, endDate: todayStr }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "newUsers" }],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "BEGINS_WITH", value: "/stores/" },
          },
        },
      }),
      client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: firstOfMonth, endDate: todayStr }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "newUsers" }],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "BEGINS_WITH", value: "/stores/" },
          },
        },
      }),
    ]);

    // Aggregate by storeId (multiple pagePaths like /stores/x and /stores/x?foo may exist)
    const todayMap: Record<string, number> = {};
    for (const row of todayRes[0].rows ?? []) {
      const storeId = extractStoreId(row.dimensionValues?.[0].value ?? "");
      if (storeId) todayMap[storeId] = (todayMap[storeId] ?? 0) + Number(row.metricValues?.[0].value ?? 0);
    }

    const monthMap: Record<string, number> = {};
    for (const row of monthRes[0].rows ?? []) {
      const storeId = extractStoreId(row.dimensionValues?.[0].value ?? "");
      if (storeId) monthMap[storeId] = (monthMap[storeId] ?? 0) + Number(row.metricValues?.[0].value ?? 0);
    }

    return NextResponse.json({ today: todayMap, thisMonth: monthMap });
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

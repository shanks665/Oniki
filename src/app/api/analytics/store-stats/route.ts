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

export async function GET(req: NextRequest) {
  try {
    if (!PROPERTY_ID) {
      return NextResponse.json({ error: "Analytics not configured" }, { status: 503 });
    }

    // Verify the store owner is authenticated
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    const storeId = req.nextUrl.searchParams.get("storeId");
    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    // Confirm the authenticated user owns this store
    const db = getAdminDb();
    const storeDoc = await db.collection("stores").doc(storeId).get();
    if (!storeDoc.exists || storeDoc.data()?.ownerId !== authResult.decoded.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = getAnalyticsClient();
    const pagePath = `/stores/${storeId}`;

    // Run both reports in parallel
    const [dailyResponse, monthlyResponse] = await Promise.all([
      // Daily new users for the last 30 days
      client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "newUsers" }],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "BEGINS_WITH", value: pagePath },
          },
        },
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
      }),
      // Monthly new users for the last 12 months
      client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: "365daysAgo", endDate: "today" }],
        dimensions: [{ name: "yearMonth" }],
        metrics: [{ name: "newUsers" }],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "BEGINS_WITH", value: pagePath },
          },
        },
        orderBys: [{ dimension: { dimensionName: "yearMonth" }, desc: false }],
      }),
    ]);

    const daily = (dailyResponse[0].rows ?? []).map((row) => ({
      date: row.dimensionValues?.[0].value ?? "",
      newUsers: Number(row.metricValues?.[0].value ?? 0),
    }));

    const monthly = (monthlyResponse[0].rows ?? []).map((row) => ({
      month: row.dimensionValues?.[0].value ?? "", // "YYYYMM"
      newUsers: Number(row.metricValues?.[0].value ?? 0),
    }));

    // Convenience totals
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const thisMonthStr = new Date().toISOString().slice(0, 7).replace(/-/g, "");

    const todayNewUsers = daily.find((d) => d.date === todayStr)?.newUsers ?? 0;
    const thisMonthNewUsers = monthly.find((m) => m.month === thisMonthStr)?.newUsers ?? 0;

    return NextResponse.json({ daily, monthly, todayNewUsers, thisMonthNewUsers });
  } catch (error) {
    console.error("GET /api/analytics/store-stats error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

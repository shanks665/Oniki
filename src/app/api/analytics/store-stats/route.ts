import { NextRequest, NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { verifyAuth } from "@/lib/api/auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { getTokyoCalendarDate } from "@/lib/analytics/dates";

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

    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    const storeId = req.nextUrl.searchParams.get("storeId");
    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    const db = getAdminDb();
    const storeDoc = await db.collection("stores").doc(storeId).get();
    if (!storeDoc.exists || storeDoc.data()?.ownerId !== authResult.decoded.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = getAnalyticsClient();
    const pagePath = `/stores/${storeId}`;
    // totalUsers = unique visitors who viewed this page (not property-wide "new users")
    const metric = "totalUsers" as const;
    const { ymdCompact, ymCompact } = getTokyoCalendarDate();

    const [dailyResponse, monthlyResponse] = await Promise.all([
      client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: metric }],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "BEGINS_WITH", value: pagePath },
          },
        },
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
      }),
      client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: "365daysAgo", endDate: "today" }],
        dimensions: [{ name: "yearMonth" }],
        metrics: [{ name: metric }],
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
      visitors: Number(row.metricValues?.[0].value ?? 0),
    }));

    const monthly = (monthlyResponse[0].rows ?? []).map((row) => ({
      month: row.dimensionValues?.[0].value ?? "",
      visitors: Number(row.metricValues?.[0].value ?? 0),
    }));

    const todayVisitors = daily.find((d) => d.date === ymdCompact)?.visitors ?? 0;
    const thisMonthVisitors = monthly.find((m) => m.month === ymCompact)?.visitors ?? 0;

    return NextResponse.json({
      daily,
      monthly,
      todayVisitors,
      thisMonthVisitors,
      // Back-compat aliases used by older clients
      todayNewUsers: todayVisitors,
      thisMonthNewUsers: thisMonthVisitors,
    });
  } catch (error) {
    console.error("GET /api/analytics/store-stats error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { runSyncSubscriptionsJob } from "@/lib/cron/jobs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSyncSubscriptionsJob();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Sync subscriptions error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

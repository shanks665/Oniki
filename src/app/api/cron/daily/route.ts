import { NextRequest, NextResponse } from "next/server";
import { runResetStatusJob, runSyncSubscriptionsJob } from "@/lib/cron/jobs";

export const dynamic = "force-dynamic";

/**
 * Single daily cron for Vercel Hobby (max once per day per job).
 * Runs: business-hours status reset + Stripe subscription reconciliation.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reset = await runResetStatusJob();
    const sync = await runSyncSubscriptionsJob();

    return NextResponse.json({
      success: true,
      reset,
      sync,
    });
  } catch (error) {
    console.error("Cron daily error:", error);
    return NextResponse.json(
      { error: "Daily cron failed" },
      { status: 500 }
    );
  }
}

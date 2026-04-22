import { NextRequest, NextResponse } from "next/server";
import { runResetStatusJob } from "@/lib/cron/jobs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runResetStatusJob();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Cron reset error:", error);
    return NextResponse.json(
      { error: "Reset failed" },
      { status: 500 }
    );
  }
}

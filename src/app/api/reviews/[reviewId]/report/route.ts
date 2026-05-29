import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { deduplicateReport, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;

    if (!reviewId || typeof reviewId !== "string") {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection("reviews").doc(reviewId);
    const doc = await ref.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (doc.data()?.status !== "published") {
      return NextResponse.json({ error: "Review not available" }, { status: 400 });
    }

    // Persistent dedup: one report per IP per review.
    // This also atomically increments reportCount if allowed.
    const ip = getClientIp(req);
    const { allowed } = await deduplicateReport(ip, reviewId);

    if (!allowed) {
      // Return success so the UI doesn't show an error to the user,
      // but don't double-count the report.
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/reviews/[reviewId]/report error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

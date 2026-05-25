import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;

    if (!reviewId) {
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

    await ref.update({
      reportCount: FieldValue.increment(1),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/reviews/[reviewId]/report error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

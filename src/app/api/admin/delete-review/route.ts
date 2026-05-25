import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const adminResult = await verifyAdmin(req);
    if ("error" in adminResult) return adminResult.error;

    const { reviewId } = await req.json();

    if (!reviewId || typeof reviewId !== "string") {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection("reviews").doc(reviewId);
    const doc = await ref.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await ref.update({ status: "removed" });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/delete-review error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

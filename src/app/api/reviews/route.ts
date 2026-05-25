import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const MAX_AUTHOR_LEN = 20;
const MAX_BODY_LEN = 300;

export async function POST(req: NextRequest) {
  try {
    const { storeId, authorName, rating, body } = await req.json();

    if (!storeId || typeof storeId !== "string") {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
    }

    const trimmedBody = String(body ?? "").trim();
    if (trimmedBody.length === 0) {
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }
    if (trimmedBody.length > MAX_BODY_LEN) {
      return NextResponse.json({ error: `body must be ≤${MAX_BODY_LEN} chars` }, { status: 400 });
    }

    const trimmedAuthor = String(authorName ?? "").trim().slice(0, MAX_AUTHOR_LEN) || "匿名";

    const db = getAdminDb();

    const storeDoc = await db.collection("stores").doc(storeId).get();
    if (!storeDoc.exists || storeDoc.data()?.isActive === false) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const ref = db.collection("reviews").doc();
    await ref.set({
      storeId,
      authorName: trimmedAuthor,
      rating: parsedRating,
      body: trimmedBody,
      status: "published",
      reportCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, reviewId: ref.id });
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

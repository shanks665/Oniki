import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/api/auth";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = new Set(["plan", "isActive"]);

export async function POST(req: NextRequest) {
  try {
    const adminResult = await verifyAdmin(req);
    if ("error" in adminResult) return adminResult.error;

    const { storeId, ...rawUpdates } = await req.json();

    if (!storeId) {
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawUpdates)) {
      if (ALLOWED_FIELDS.has(key)) {
        sanitized[key] = value;
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    if (sanitized.plan !== undefined && sanitized.plan !== "free" && sanitized.plan !== "premium") {
      return NextResponse.json({ error: "Invalid plan value" }, { status: 400 });
    }

    if (sanitized.isActive !== undefined && typeof sanitized.isActive !== "boolean") {
      return NextResponse.json({ error: "Invalid isActive value" }, { status: 400 });
    }

    const db = getAdminDb();
    const storeRef = db.collection("stores").doc(storeId);
    const storeDoc = await storeRef.get();

    if (!storeDoc.exists) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    await storeRef.update({
      ...sanitized,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/update-store error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

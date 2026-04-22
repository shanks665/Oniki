import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/api/auth";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = new Set([
  "name",
  "genre",
  "area",
  "description",
  "address",
  "phone",
  "budgetRange",
  "systemInfo",
  "businessHours",
  "images",
  "googleMapsEmbedUrl",
  "googleMapsDirectionUrl",
  "seatCapacity",
]);

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    const body = await req.json();
    const { storeId, ...rawUpdates } = body;

    if (!storeId) {
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    }

    const db = getAdminDb();
    const storeRef = db.collection("stores").doc(storeId);
    const storeDoc = await storeRef.get();

    if (!storeDoc.exists || storeDoc.data()?.ownerId !== authResult.decoded.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawUpdates)) {
      if (ALLOWED_FIELDS.has(key)) {
        sanitized[key] = value;
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // When seatCapacity changes, cap seatDetail to new maximums
    if (sanitized.seatCapacity) {
      const newCap = sanitized.seatCapacity as { counterTotal: number; tableTotal: number };
      const currentData = storeDoc.data()!;
      const currentDetail = currentData.seatDetail as { counterAvailable: number | null; tableAvailable: number | null } | null;

      if (currentDetail) {
        sanitized.seatDetail = {
          counterAvailable: currentDetail.counterAvailable !== null
            ? Math.min(currentDetail.counterAvailable, newCap.counterTotal)
            : null,
          tableAvailable: currentDetail.tableAvailable !== null
            ? Math.min(currentDetail.tableAvailable, newCap.tableTotal)
            : null,
        };
      }
    }

    await storeRef.update({
      ...sanitized,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/store/update error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

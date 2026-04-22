import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/api/auth";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(["available", "slightly_crowded", "full", "closed"]);

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    const { storeId, status, seatDetail } = await req.json();

    if (!storeId || !status || !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid storeId or status" }, { status: 400 });
    }

    const db = getAdminDb();
    const storeRef = db.collection("stores").doc(storeId);
    const storeDoc = await storeRef.get();

    if (!storeDoc.exists || storeDoc.data()?.ownerId !== authResult.decoded.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {
      status,
      statusUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (seatDetail !== undefined) {
      const storeData = storeDoc.data()!;
      const cap = storeData.seatCapacity as { counterTotal: number; tableTotal: number } | null;

      const counterVal = typeof seatDetail?.counterAvailable === "number" ? seatDetail.counterAvailable : null;
      const tableVal = typeof seatDetail?.tableAvailable === "number" ? seatDetail.tableAvailable : null;

      updateData.seatDetail = {
        counterAvailable: counterVal !== null && cap
          ? Math.max(0, Math.min(counterVal, cap.counterTotal))
          : counterVal,
        tableAvailable: tableVal !== null && cap
          ? Math.max(0, Math.min(tableVal, cap.tableTotal))
          : tableVal,
      };
    }

    await storeRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/store/status error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

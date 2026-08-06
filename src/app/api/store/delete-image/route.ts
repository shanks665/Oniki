import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

function extractStoragePath(downloadUrl: string): string | null {
  try {
    const url = new URL(downloadUrl);
    const encoded = url.pathname.split("/o/")[1];
    if (!encoded) return null;
    return decodeURIComponent(encoded.split("?")[0]);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    const { storeId, imageUrl } = await req.json();
    if (!storeId || !imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "storeId and imageUrl required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const storeDoc = await db.collection("stores").doc(storeId).get();
    if (!storeDoc.exists || storeDoc.data()?.ownerId !== authResult.decoded.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const path = extractStoragePath(imageUrl);
    if (!path || !path.startsWith(`stores/${storeId}/`)) {
      return NextResponse.json({ error: "Invalid image url" }, { status: 400 });
    }

    try {
      await getAdminStorage().bucket().file(path).delete({ ignoreNotFound: true });
    } catch (err) {
      console.error("Storage delete failed (ignored):", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/store/delete-image error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

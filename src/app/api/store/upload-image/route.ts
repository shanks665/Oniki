import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024; // stay under typical Vercel body limits

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    const form = await req.formData();
    const storeId = String(form.get("storeId") ?? "");
    const file = form.get("file");

    if (!storeId) {
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    const db = getAdminDb();
    const storeDoc = await db.collection("stores").doc(storeId).get();
    if (!storeDoc.exists || storeDoc.data()?.ownerId !== authResult.decoded.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "画像は 4MB 以下にしてください" },
        { status: 400 }
      );
    }

    const contentType =
      file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";

    const extFromName = file.name.split(".").pop()?.toLowerCase();
    const ext =
      extFromName && /^[a-z0-9]{1,5}$/.test(extFromName)
        ? extFromName
        : contentType === "image/png"
          ? "png"
          : contentType === "image/webp"
            ? "webp"
            : "jpg";

    const path = `stores/${storeId}/${Date.now()}_${randomUUID().slice(0, 8)}.${ext}`;
    const token = randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());

    const bucket = getAdminStorage().bucket();
    const object = bucket.file(path);
    await object.save(buffer, {
      resumable: false,
      contentType,
      metadata: {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    const downloadUrl =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
      `${encodeURIComponent(path)}?alt=media&token=${token}`;

    return NextResponse.json({ url: downloadUrl, path });
  } catch (error) {
    console.error("POST /api/store/upload-image error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

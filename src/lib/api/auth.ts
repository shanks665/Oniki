import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import type { DecodedIdToken } from "firebase-admin/auth";

export async function verifyAuth(
  req: NextRequest
): Promise<{ decoded: DecodedIdToken } | { error: NextResponse }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  try {
    const idToken = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    return { decoded };
  } catch {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
  }
}

export async function verifyAdmin(
  req: NextRequest
): Promise<{ decoded: DecodedIdToken } | { error: NextResponse }> {
  const result = await verifyAuth(req);
  if ("error" in result) return result;

  const adminDoc = await getAdminDb()
    .collection("admins")
    .doc(result.decoded.uid)
    .get();

  if (!adminDoc.exists) {
    return { error: NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 }) };
  }

  return result;
}

export async function verifyStoreOwner(
  req: NextRequest,
  storeId: string
): Promise<{ decoded: DecodedIdToken } | { error: NextResponse }> {
  const result = await verifyAuth(req);
  if ("error" in result) return result;

  const storeDoc = await getAdminDb()
    .collection("stores")
    .doc(storeId)
    .get();

  if (!storeDoc.exists || storeDoc.data()?.ownerId !== result.decoded.uid) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return result;
}

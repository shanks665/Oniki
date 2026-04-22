import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/api/auth";
import { setBilling } from "@/lib/firebase/billing";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const adminResult = await verifyAdmin(req);
    if ("error" in adminResult) return adminResult.error;

    const { email, password, storeName, genre, area } = await req.json();

    if (!email || !password || !storeName) {
      return NextResponse.json(
        { error: "email, password, storeName are required" },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: storeName,
    });

    const storeRef = adminDb.collection("stores").doc();
    await storeRef.set({
      name: storeName,
      genre: genre || "other",
      area: area || "other",
      description: "",
      address: "",
      phone: "",
      budgetRange: "",
      systemInfo: "",
      businessHours: {
        open: "18:00",
        close: "02:00",
        holidays: [],
      },
      images: [],
      googleMapsEmbedUrl: "",
      googleMapsDirectionUrl: "",
      status: "closed",
      seatCapacity: null,
      seatDetail: null,
      statusUpdatedAt: null,
      plan: "free",
      subscriptionStatus: null,
      ownerId: userRecord.uid,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await setBilling(storeRef.id, {
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      trialEndDate: null,
      paymentFailedAt: null,
    });

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      storeId: storeRef.id,
    });
  } catch (error: unknown) {
    console.error("Create store error:", error);

    const fbError = error as { code?: string; message?: string };
    if (fbError.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "このメールアドレスは既に使用されています" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: fbError.message || "Failed to create store" },
      { status: 500 }
    );
  }
}

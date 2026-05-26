import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { setBilling } from "@/lib/firebase/billing";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const DUMMY_STORES = [
  {
    name: "BAR OATH",
    genre: "authentic",
    area: "shimotori",
    description: "静かな大人の空間で、こだわりのウイスキーとカクテルを。バーテンダー歴20年のマスターが一杯ずつ丁寧にお作りします。",
    address: "熊本市中央区下通1-5-15 ビル3F",
    phone: "096-312-0001",
    budgetRange: "3,000〜5,000円",
    systemInfo: "チャージ500円 / カード可",
    businessHours: { open: "19:00", close: "03:00", holidays: ["日曜"] },
    images: [],
    googleMapsEmbedUrl: "",
    googleMapsDirectionUrl: "https://www.google.com/maps/dir/?api=1&destination=32.8005,130.7080",
    status: "available",
    seatCapacity: { counterTotal: 8, tableTotal: 4 },
    seatDetail: { counterAvailable: 4, tableAvailable: 2 },
    plan: "premium",
  },
  {
    name: "Sports Bar BULL",
    genre: "sports",
    area: "shinshigai",
    description: "大型スクリーンでスポーツ観戦しながら飲めるバー。各種スポーツの試合を毎日放映中。仲間とワイワイ楽しめます。",
    address: "熊本市中央区新市街6-20 1F",
    phone: "096-312-0002",
    budgetRange: "2,000〜4,000円",
    systemInfo: "チャージなし / カード可",
    businessHours: { open: "18:00", close: "02:00", holidays: ["月曜"] },
    images: [],
    googleMapsEmbedUrl: "",
    googleMapsDirectionUrl: "https://www.google.com/maps/dir/?api=1&destination=32.7995,130.7075",
    status: "slightly_crowded",
    seatCapacity: { counterTotal: 6, tableTotal: 8 },
    seatDetail: { counterAvailable: 2, tableAvailable: 3 },
    plan: "premium",
  },
  {
    name: "Casual Bar LUNA",
    genre: "casual",
    area: "shimotori",
    description: "気軽に立ち寄れるカジュアルバー。リーズナブルな料金設定でお一人様も大歓迎です。",
    address: "熊本市中央区下通1-8-22 2F",
    phone: "096-312-0003",
    budgetRange: "2,000〜4,000円",
    systemInfo: "チャージなし / カード可",
    businessHours: { open: "20:00", close: "04:00", holidays: [] },
    images: [],
    googleMapsEmbedUrl: "",
    googleMapsDirectionUrl: "https://www.google.com/maps/dir/?api=1&destination=32.8002,130.7085",
    status: "full",
    seatCapacity: { counterTotal: 10, tableTotal: 0 },
    seatDetail: { counterAvailable: 0, tableAvailable: null },
    plan: "premium",
  },
  {
    name: "After Bar NIGHT OWL",
    genre: "after",
    area: "ginzadori",
    description: "深夜営業のアフターバー。2次会・3次会に最適。軽めのフードメニューも充実しています。",
    address: "熊本市中央区銀座通り3-12 B1F",
    phone: "096-312-0004",
    budgetRange: "2,000〜3,500円",
    systemInfo: "チャージなし / カード可",
    businessHours: { open: "23:00", close: "05:00", holidays: ["火曜"] },
    images: [],
    googleMapsEmbedUrl: "",
    googleMapsDirectionUrl: "https://www.google.com/maps/dir/?api=1&destination=32.8020,130.7090",
    status: "available",
    seatCapacity: { counterTotal: 10, tableTotal: 0 },
    seatDetail: { counterAvailable: 6, tableAvailable: null },
    plan: "premium",
  },
  {
    name: "Shisha Bar KUMA",
    genre: "shisha",
    area: "ginnan",
    description: "厳選したシーシャフレーバーを豊富に取り揃え。ゆったりとした空間でお楽しみいただけます。",
    address: "熊本市中央区銀杏通り2-8",
    phone: "096-312-0005",
    budgetRange: "2,000〜3,500円",
    systemInfo: "チャージなし / カード可",
    businessHours: { open: "17:00", close: "02:00", holidays: ["水曜"] },
    images: [],
    googleMapsEmbedUrl: "",
    googleMapsDirectionUrl: "https://www.google.com/maps/dir/?api=1&destination=32.8010,130.7070",
    status: "available",
    seatCapacity: { counterTotal: 0, tableTotal: 8 },
    seatDetail: { counterAvailable: null, tableAvailable: 5 },
    plan: "premium",
  },
  {
    name: "Music Bar THREAD",
    genre: "music",
    area: "kagamachi",
    description: "生演奏とこだわりのカクテルを楽しめるミュージックバー。毎週末はライブイベント開催。",
    address: "熊本市中央区駕町通り5-3 2F",
    phone: "096-312-0006",
    budgetRange: "2,500〜4,000円",
    systemInfo: "チャージ500円 / カード可",
    businessHours: { open: "19:00", close: "01:00", holidays: ["月曜"] },
    images: [],
    googleMapsEmbedUrl: "",
    googleMapsDirectionUrl: "https://www.google.com/maps/dir/?api=1&destination=32.8025,130.7088",
    status: "slightly_crowded",
    seatCapacity: { counterTotal: 6, tableTotal: 5 },
    seatDetail: { counterAvailable: 2, tableAvailable: 1 },
    plan: "premium",
  },
];

const DUMMY_COUPONS = [
  { title: "今だけチャージ無料！", description: "22時までにご来店の方限定" },
  { title: "最初の1杯半額", description: "全カクテル対象" },
  { title: "雨の日サービス：おつまみ1品無料", description: "" },
];

async function deleteCollection(
  db: Firestore,
  collectionPath: string,
) {
  const snap = await db.collection(collectionPath).get();
  const batchSize = 400;
  for (let i = 0; i < snap.docs.length; i += batchSize) {
    const batch = db.batch();
    snap.docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // ── 既存データを全消去 ──────────────────────────────
    // Firestore コレクション
    await deleteCollection(adminDb, "stores");
    await deleteCollection(adminDb, "coupons");
    await deleteCollection(adminDb, "reviews");
    await deleteCollection(adminDb, "billing");

    // demo.bar ドメインの Auth ユーザを削除
    const listResult = await adminAuth.listUsers();
    const demoUids = listResult.users
      .filter((u) => u.email?.endsWith("@demo.bar"))
      .map((u) => u.uid);
    if (demoUids.length > 0) {
      await adminAuth.deleteUsers(demoUids);
    }
    // ────────────────────────────────────────────────────

    const storeIds: string[] = [];

    for (const store of DUMMY_STORES) {
      const email = `${store.name.replace(/[^a-zA-Z]/g, "").toLowerCase() || "store"}@demo.bar`;
      let uid: string;

      try {
        const user = await adminAuth.createUser({
          email,
          password: "demo1234",
          displayName: store.name,
        });
        uid = user.uid;
      } catch (e: unknown) {
        const fbErr = e as { code?: string };
        if (fbErr.code === "auth/email-already-exists") {
          const existing = await adminAuth.getUserByEmail(email);
          uid = existing.uid;
        } else {
          throw e;
        }
      }

      const existingStores = await adminDb
        .collection("stores")
        .where("ownerId", "==", uid)
        .get();

      let storeId: string;

      if (!existingStores.empty) {
        storeId = existingStores.docs[0].id;
        await adminDb.collection("stores").doc(storeId).update({
          ...store,
          statusUpdatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        const ref = adminDb.collection("stores").doc();
        storeId = ref.id;
        await ref.set({
          ...store,
          ownerId: uid,
          isActive: true,
          subscriptionStatus: "active",
          statusUpdatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        await setBilling(storeId, {
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          trialEndDate: null,
          paymentFailedAt: null,
        });
      }

      storeIds.push(storeId);
    }

    // Add coupons for all stores
    for (let i = 0; i < DUMMY_COUPONS.length; i++) {
      const storeId = storeIds[i % storeIds.length];
      const coupon = DUMMY_COUPONS[i];

      const existing = await adminDb
        .collection("coupons")
        .where("storeId", "==", storeId)
        .where("title", "==", coupon.title)
        .get();

      if (existing.empty) {
        await adminDb.collection("coupons").doc().set({
          storeId,
          title: coupon.title,
          description: coupon.description,
          isActive: true,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // Create admin account
    let adminUid: string;
    const adminEmail = "admin@barnavi.kumamoto";
    try {
      const admin = await adminAuth.createUser({
        email: adminEmail,
        password: "admin1234",
        displayName: "BAR NAVI Admin",
      });
      adminUid = admin.uid;
    } catch (e: unknown) {
      const fbErr = e as { code?: string };
      if (fbErr.code === "auth/email-already-exists") {
        const existing = await adminAuth.getUserByEmail(adminEmail);
        adminUid = existing.uid;
      } else {
        throw e;
      }
    }

    const adminDoc = await adminDb.collection("admins").doc(adminUid).get();
    if (!adminDoc.exists) {
      await adminDb.collection("admins").doc(adminUid).set({
        email: adminEmail,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      stores: storeIds.length,
      message: "Dummy data seeded successfully",
      accounts: {
        admin: { email: adminEmail, password: "admin1234" },
        store_example: { email: "baroath@demo.bar", password: "demo1234" },
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

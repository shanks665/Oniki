import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { setBilling } from "@/lib/firebase/billing";
import { FieldValue } from "firebase-admin/firestore";

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
    name: "Darts & Bar BULL",
    genre: "darts",
    area: "shinshigai",
    description: "最新のダーツマシン6台完備！初心者も大歓迎。ドリンク飲み放題プランあり。仲間とワイワイ楽しめるスポーツバー。",
    address: "熊本市中央区新市街6-20 1F",
    phone: "096-312-0002",
    budgetRange: "2,000〜4,000円",
    systemInfo: "チャージなし / ダーツ投げ放題1,000円",
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
    name: "Girl's Bar LUNA",
    genre: "girls",
    area: "shimotori",
    description: "明るく元気なキャストがお出迎え。リーズナブルな料金設定で気軽に立ち寄れます。",
    address: "熊本市中央区下通1-8-22 2F",
    phone: "096-312-0003",
    budgetRange: "3,000〜6,000円",
    systemInfo: "セット料金 3,000円/60分（2ドリンク付）",
    businessHours: { open: "20:00", close: "04:00", holidays: [] },
    images: [],
    googleMapsEmbedUrl: "",
    googleMapsDirectionUrl: "https://www.google.com/maps/dir/?api=1&destination=32.8002,130.7085",
    status: "full",
    seatCapacity: { counterTotal: 10, tableTotal: 0 },
    seatDetail: { counterAvailable: 0, tableAvailable: null },
    plan: "free",
  },
  {
    name: "マッスルバー POWER",
    genre: "muscle",
    area: "kamitori",
    description: "ボディビルダーのバーテンダーがシェイカーを振る！プロテインカクテルから本格的なお酒まで。トレーニング後の一杯に。",
    address: "熊本市中央区上通町3-12 B1F",
    phone: "096-312-0004",
    budgetRange: "2,000〜3,500円",
    systemInfo: "チャージなし / プロテインドリンク各種",
    businessHours: { open: "18:00", close: "01:00", holidays: ["火曜"] },
    images: [],
    googleMapsEmbedUrl: "",
    googleMapsDirectionUrl: "https://www.google.com/maps/dir/?api=1&destination=32.8020,130.7090",
    status: "available",
    seatCapacity: { counterTotal: 10, tableTotal: 0 },
    seatDetail: { counterAvailable: 6, tableAvailable: null },
    plan: "free",
  },
  {
    name: "立ち飲み 酒場 KUMA",
    genre: "standing",
    area: "ginnan",
    description: "ワンコイン500円から楽しめる立ち飲みスタイル。地元の日本酒・焼酎を中心に、気軽にサクッと飲める。",
    address: "熊本市中央区銀杏北通り2-8",
    phone: "096-312-0005",
    budgetRange: "1,000〜2,500円",
    systemInfo: "チャージなし / 現金のみ",
    businessHours: { open: "17:00", close: "23:00", holidays: ["水曜", "日曜"] },
    images: [],
    googleMapsEmbedUrl: "",
    googleMapsDirectionUrl: "https://www.google.com/maps/dir/?api=1&destination=32.8010,130.7070",
    status: "available",
    seatCapacity: { counterTotal: 0, tableTotal: 6 },
    seatDetail: { counterAvailable: null, tableAvailable: 4 },
    plan: "free",
  },
  {
    name: "WEAR × BAR THREAD",
    genre: "apparel",
    area: "kamitori",
    description: "アパレルショップとバーが融合した新感覚空間。お酒を片手にファッションを楽しむ。オリジナルグッズも販売中。",
    address: "熊本市中央区上通町5-3 2F",
    phone: "096-312-0006",
    budgetRange: "2,500〜4,000円",
    systemInfo: "チャージ300円 / カード可",
    businessHours: { open: "15:00", close: "00:00", holidays: ["月曜"] },
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

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

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
          subscriptionStatus: store.plan === "premium" ? "active" : null,
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

    // Add coupons for premium stores
    const premiumStoreIds = storeIds.filter(
      (_, i) => DUMMY_STORES[i].plan === "premium"
    );

    for (let i = 0; i < DUMMY_COUPONS.length; i++) {
      const storeId = premiumStoreIds[i % premiumStoreIds.length];
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

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreById, getActiveCouponsForStore } from "@/lib/firebase/server-firestore";
import { AREAS, GENRES } from "@/constants";
import type { AreaKey, GenreKey } from "@/types";
import { StoreDetailClient } from "./StoreDetailClient";

export const revalidate = 30;

/** Safe for `<script type="application/ld+json">` — HTML must not see a literal `</script>` inside the string. */
function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const store = await getStoreById(id);

  if (!store) {
    return { title: "店舗が見つかりません | BAR NAVI KUMAMOTO" };
  }

  const areaLabel = AREAS[store.area as AreaKey] || store.area;
  const genreLabel = GENRES[store.genre as GenreKey] || store.genre;
  const title = `${store.name} | ${areaLabel}の${genreLabel} | BAR NAVI KUMAMOTO`;
  const description =
    store.description ||
    `${store.name}は熊本・${areaLabel}にある${genreLabel}です。リアルタイムの空席状況をチェックして、今夜のお店を見つけよう。`;

  const ogImage = store.images?.[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "BAR NAVI KUMAMOTO",
      locale: "ja_JP",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function StoreDetailPage({ params }: Props) {
  const { id } = await params;
  const [store, coupons] = await Promise.all([
    getStoreById(id),
    getActiveCouponsForStore(id),
  ]);

  if (!store) notFound();

  const areaLabel = AREAS[store.area as AreaKey] || store.area;
  const genreLabel = GENRES[store.genre as GenreKey] || store.genre;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: store.name,
    description: store.description || `${store.name} - ${areaLabel}の${genreLabel}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "熊本市",
      addressRegion: "熊本県",
      addressCountry: "JP",
      streetAddress: store.address || "",
    },
    telephone: store.phone || undefined,
    openingHours: `${store.businessHours.open}-${store.businessHours.close}`,
    priceRange: store.budgetRange || undefined,
    ...(store.images?.[0] ? { image: store.images[0] } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <StoreDetailClient
        initialStore={store}
        initialCoupons={coupons}
        storeId={id}
      />
    </>
  );
}

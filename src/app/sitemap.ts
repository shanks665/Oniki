import type { MetadataRoute } from "next";
import { getAllActiveStoreIds } from "@/lib/firebase/server-firestore";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://barnavi-kumamoto.vercel.app";

  let storeIds: string[] = [];
  try {
    storeIds = await getAllActiveStoreIds();
  } catch (err) {
    console.error("sitemap: failed to load store ids", err);
  }

  const storePages: MetadataRoute.Sitemap = storeIds.map((id) => ({
    url: `${baseUrl}/stores/${id}`,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  const legalPages: MetadataRoute.Sitemap = [
    "/legal/terms",
    "/legal/privacy",
    "/legal/tokushoho",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.3,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1,
    },
    ...storePages,
    ...legalPages,
  ];
}

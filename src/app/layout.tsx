import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BAR GUIDE - 熊本のバー空席情報",
    template: "%s | BAR GUIDE",
  },
  description:
    "今から入れる熊本のバーをリアルタイムで探せるサイト。空席状況をチェックして、今夜のお店を見つけよう。",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  // Google Search Console ownership (HTML meta tag method).
  // Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the content= value only.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
  openGraph: {
    title: "BAR GUIDE - 熊本のバー空席情報",
    description: "今から入れる熊本のバーをリアルタイムで探せる。空席状況がリアルタイムに更新。",
    type: "website",
    siteName: "BAR GUIDE",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary",
    title: "BAR GUIDE",
    description: "今から入れる熊本のバーをリアルタイムで探せるサイト。",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-zinc-950 antialiased">{children}</body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}

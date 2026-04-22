import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BAR NAVI KUMAMOTO - 熊本のバー空席情報",
    template: "%s | BAR NAVI KUMAMOTO",
  },
  description:
    "今から入れる熊本のバーをリアルタイムで探せるサイト。空席状況をチェックして、今夜のお店を見つけよう。",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "BAR NAVI KUMAMOTO - 熊本のバー空席情報",
    description: "今から入れる熊本のバーをリアルタイムで探せる。空席状況がリアルタイムに更新。",
    type: "website",
    siteName: "BAR NAVI KUMAMOTO",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary",
    title: "BAR NAVI KUMAMOTO",
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
    </html>
  );
}

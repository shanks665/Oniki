import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
};

export default function TokushohoPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="h-4 w-4" />
        トップに戻る
      </Link>

      <h1 className="mb-8 text-xl font-bold text-zinc-100">
        特定商取引法に基づく表記
      </h1>

      <div className="space-y-6">
        <Row label="販売業者" value="【事業者名を記載】" />
        <Row label="運営統括責任者" value="【代表者名を記載】" />
        <Row label="所在地" value="【住所を記載】" />
        <Row label="電話番号" value="【電話番号を記載】" />
        <Row label="メールアドレス" value="【メールアドレスを記載】" />
        <Row
          label="販売URL"
          value={process.env.NEXT_PUBLIC_APP_URL || "https://barnavi-kumamoto.vercel.app"}
        />
        <Row label="販売価格" value="月額3,000円（税込）" />
        <Row
          label="商品代金以外の必要料金"
          value="なし（インターネット接続料金はお客様のご負担となります）"
        />
        <Row label="お支払い方法" value="クレジットカード（Stripe経由）" />
        <Row label="お支払い時期" value="サブスクリプション契約時に即時決済。以降毎月自動更新。" />
        <Row
          label="サービス提供時期"
          value="お支払い手続き完了後、即時ご利用いただけます。"
        />
        <Row
          label="無料トライアル"
          value="初回申込み時に限り、30日間の無料トライアルをご利用いただけます。トライアル期間終了後に自動的に有料プランへ移行します。"
        />
        <Row
          label="解約・返金について"
          value="Stripe カスタマーポータルよりいつでも解約可能です。日割り返金は行っておりません。解約後は契約期間の末日までサービスをご利用いただけます。"
        />
        <Row
          label="動作環境"
          value="最新版のChrome、Safari、Firefox、Edgeに対応しています。"
        />
      </div>

      <p className="mt-10 text-xs text-zinc-600">
        ※ 【】内は実際の情報に置き換えてください。
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-zinc-800/60 pb-4">
      <dt className="mb-1 text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="text-sm leading-relaxed text-zinc-300">{value}</dd>
    </div>
  );
}

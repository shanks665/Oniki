import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "利用規約",
};

export default function TermsPage() {
  const serviceName = "BAR NAVI KUMAMOTO";
  const operatorName = "【事業者名】";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="h-4 w-4" />
        トップに戻る
      </Link>

      <h1 className="mb-8 text-xl font-bold text-zinc-100">利用規約</h1>

      <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
        <Section title="第1条（適用）">
          <p>
            本規約は、{operatorName}（以下「当社」）が提供するサービス「{serviceName}」
            （以下「本サービス」）の利用に関する条件を定めるものです。
            本サービスを利用するすべてのユーザー（閲覧者および店舗オーナーを含む）は、
            本規約に同意したものとみなします。
          </p>
        </Section>

        <Section title="第2条（サービスの概要）">
          <p>
            本サービスは、熊本市内の飲食店（バー）の空席情報をリアルタイムに掲載・閲覧できる
            Webサービスです。店舗オーナーが自ら情報を更新し、ユーザーがそれを閲覧します。
          </p>
        </Section>

        <Section title="第3条（アカウント）">
          <ol className="list-decimal space-y-2 pl-5">
            <li>店舗オーナーとして本サービスを利用するには、当社が発行するアカウントが必要です。</li>
            <li>アカウントの認証情報は第三者に開示してはならず、管理責任はアカウント所有者にあります。</li>
            <li>閲覧ユーザーはアカウント登録不要でご利用いただけます。</li>
          </ol>
        </Section>

        <Section title="第4条（有料プラン）">
          <ol className="list-decimal space-y-2 pl-5">
            <li>本サービスには無料プランと有料プラン（プレミアムプラン）があります。</li>
            <li>プレミアムプランの料金は月額3,000円（税込）です。</li>
            <li>初回申込み時に限り、30日間の無料トライアルをご利用いただけます。</li>
            <li>決済はStripeを通じてクレジットカードで行われます。</li>
            <li>
              お支払いに問題が生じた場合、7日間の猶予期間を設けます。
              猶予期間内に問題が解決しない場合、無料プランに自動ダウングレードされます。
            </li>
          </ol>
        </Section>

        <Section title="第5条（解約）">
          <ol className="list-decimal space-y-2 pl-5">
            <li>プレミアムプランはStripeカスタマーポータルよりいつでも解約できます。</li>
            <li>解約後も契約期間の末日までプレミアム機能をご利用いただけます。</li>
            <li>日割りでの返金は行いません。</li>
          </ol>
        </Section>

        <Section title="第6条（禁止事項）">
          <p>以下の行為を禁止します。</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>虚偽の情報を掲載する行為</li>
            <li>本サービスの運営を妨害する行為</li>
            <li>他のユーザーまたは第三者の権利を侵害する行為</li>
            <li>不正アクセスまたはそれを試みる行為</li>
            <li>本サービスのデータを無断で収集・転載する行為</li>
            <li>法令または公序良俗に反する行為</li>
          </ol>
        </Section>

        <Section title="第7条（免責事項）">
          <ol className="list-decimal space-y-2 pl-5">
            <li>本サービスに掲載される空席情報は店舗オーナーが更新するものであり、当社はその正確性を保証しません。</li>
            <li>本サービスの利用に起因する損害について、当社は故意または重過失がある場合を除き責任を負いません。</li>
            <li>当社はシステム障害やメンテナンス等によるサービスの一時的な中断について、事前通知に努めますが、責任を負いません。</li>
          </ol>
        </Section>

        <Section title="第8条（サービスの変更・終了）">
          <p>
            当社は、事前の通知なくサービス内容の変更、追加、廃止を行うことがあります。
            重要な変更については合理的な期間を置いて通知するよう努めます。
          </p>
        </Section>

        <Section title="第9条（規約の変更）">
          <p>
            当社は本規約を変更できるものとします。変更後の規約は本サービス上に掲載した時点で
            効力を生じ、利用を継続した場合は変更に同意したものとみなします。
          </p>
        </Section>

        <Section title="第10条（準拠法・管轄）">
          <p>
            本規約は日本法に準拠します。本サービスに関する紛争については、
            熊本地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </Section>

        <p className="pt-4 text-xs text-zinc-600">
          制定日: 【日付を記載】
          <br />
          ※ 【】内は実際の情報に置き換えてください。
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-[15px] font-bold text-zinc-200">{title}</h2>
      {children}
    </section>
  );
}

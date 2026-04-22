import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
};

export default function PrivacyPage() {
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

      <h1 className="mb-8 text-xl font-bold text-zinc-100">
        プライバシーポリシー
      </h1>

      <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
        <Section title="1. はじめに">
          <p>
            {operatorName}（以下「当社」）は、「{serviceName}」（以下「本サービス」）における
            個人情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。
          </p>
        </Section>

        <Section title="2. 収集する情報">
          <p>当社は以下の情報を収集します。</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-zinc-300">店舗オーナー：</strong>
              メールアドレス、パスワード（Firebase Authで暗号化管理）、店舗情報（店名、住所、電話番号、写真等）
            </li>
            <li>
              <strong className="text-zinc-300">決済情報：</strong>
              クレジットカード情報はStripe, Inc.が直接処理し、当社のサーバーには保存されません
            </li>
            <li>
              <strong className="text-zinc-300">閲覧ユーザー：</strong>
              お気に入り情報（端末のローカルストレージにのみ保存。サーバーには送信されません）
            </li>
          </ul>
        </Section>

        <Section title="3. 利用目的">
          <p>収集した情報は以下の目的で利用します。</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>本サービスの提供・運営</li>
            <li>店舗オーナーのアカウント管理・認証</li>
            <li>サブスクリプションの決済処理</li>
            <li>サービスに関するお知らせの送信</li>
            <li>サービスの改善・新機能の開発</li>
            <li>不正利用の防止</li>
          </ol>
        </Section>

        <Section title="4. 第三者への提供">
          <p>
            当社は、以下の場合を除き、個人情報を第三者に提供しません。
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>ご本人の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要な場合</li>
          </ol>
        </Section>

        <Section title="5. 外部サービスの利用">
          <p>本サービスでは以下の外部サービスを利用しています。</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-zinc-300">Firebase（Google LLC）</strong>
              ：認証、データベース、ファイルストレージ。
              <br />
              <a
                href="https://firebase.google.com/support/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500/70 hover:text-amber-400"
              >
                Firebaseのプライバシーポリシー
              </a>
            </li>
            <li>
              <strong className="text-zinc-300">Stripe, Inc.</strong>
              ：決済処理。カード情報はStripeが直接管理します。
              <br />
              <a
                href="https://stripe.com/jp/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500/70 hover:text-amber-400"
              >
                Stripeのプライバシーポリシー
              </a>
            </li>
            <li>
              <strong className="text-zinc-300">Vercel Inc.</strong>
              ：Webサイトのホスティング。
              <br />
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500/70 hover:text-amber-400"
              >
                Vercelのプライバシーポリシー
              </a>
            </li>
          </ul>
        </Section>

        <Section title="6. 情報の安全管理">
          <p>
            当社は個人情報の漏洩、紛失、改ざん等を防止するため、適切なセキュリティ対策を講じます。
            通信はSSL/TLSにより暗号化されています。
          </p>
        </Section>

        <Section title="7. 個人情報の開示・訂正・削除">
          <p>
            店舗オーナーは、ダッシュボードよりご自身の店舗情報を確認・修正できます。
            アカウントの削除をご希望の場合は、お問い合わせ先までご連絡ください。
          </p>
        </Section>

        <Section title="8. お問い合わせ先">
          <p>
            個人情報の取扱いに関するお問い合わせは以下までご連絡ください。
          </p>
          <p className="mt-2 text-zinc-300">
            {operatorName}
            <br />
            メール: 【メールアドレスを記載】
          </p>
        </Section>

        <Section title="9. ポリシーの変更">
          <p>
            当社は、本ポリシーを変更する場合があります。
            重要な変更がある場合は、本サービス上でお知らせします。
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

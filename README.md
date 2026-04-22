# BAR NAVI KUMAMOTO

熊本特化型バーのリアルタイム空席情報サイト。

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **データベース**: Firebase Firestore (リアルタイムリスナー)
- **認証**: Firebase Authentication
- **画像**: Firebase Storage
- **決済**: Stripe (月額サブスクリプション)
- **ホスティング**: Vercel
- **自動リセット**: Vercel Cron Jobs (5分間隔)

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成し、各値を設定してください。

```bash
cp .env.example .env.local
```

必要な外部サービスの設定:
- **Firebase**: プロジェクト作成 → Webアプリ追加 → 設定値をコピー
- **Firebase Admin**: サービスアカウントキーを生成
- **Stripe**: アカウント作成 → APIキー取得 → 月額商品/価格を作成

### 3. Firebase の準備

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Authentication で「メール/パスワード」を有効化
3. Firestore Database を作成
4. Storage を有効化
5. `firebase/firestore.rules` と `firebase/storage.rules` をデプロイ

### 4. Stripe の準備

1. [Stripe Dashboard](https://dashboard.stripe.com/) でアカウント作成
2. 商品を作成（月額 ¥3,000）
3. 価格IDを `STRIPE_PRICE_ID` に設定
4. Webhook エンドポイント (`/api/stripe/webhook`) を登録
5. Webhook Secret を `STRIPE_WEBHOOK_SECRET` に設定

### 5. 管理者アカウントの作成

Firestore に `admins` コレクションを作成し、管理者の Firebase Auth UID をドキュメントIDとしてドキュメントを追加:

```
admins/{uid}
  - email: "admin@example.com"
  - createdAt: Timestamp
```

### 6. 開発サーバー起動

```bash
npm run dev
```

## URL 構成

| パス | 用途 |
|---|---|
| `/` | ユーザー向けトップページ（検索 + 一覧） |
| `/stores/[id]` | 店舗詳細ページ |
| `/login` | 店舗ログイン |
| `/dashboard` | 店舗ダッシュボード |
| `/dashboard/edit` | 店舗情報編集 |
| `/dashboard/coupons` | クーポン管理（プレミアム限定） |
| `/dashboard/billing` | プラン・お支払い管理 |
| `/admin` | 管理者ダッシュボード |
| `/admin/stores/new` | 新規店舗アカウント作成 |

# 21_Setup_Guide (環境構築とデプロイ手順)

本プロジェクトのフロントエンド・バックエンドを稼働させるための最短セットアップガイドです。

## 1. ローカル開発環境 (VS Code / Hono)
* **Runtime**: `Node.js` (最新のLTS推奨) または `Bun` をインストール。
* **Initialization**: `npm create hono@latest` でプロジェクトを開始し、Cloudflare Workersを選択。
* **Extension**: VS Codeに `ESLint`, `Prettier`, `Tailwind CSS IntelliSense` を導入。
* **Dev Server**: `npm run dev` (wrangler dev) でローカル環境を起動。

## 2. クラウド基盤 (Cloudflare / D1)
* **Authentication**: `npx wrangler login` でCloudflareアカウントと連携。
* **Database**: `npx wrangler d1 create aletheia-db` でデータベースを作成し、`wrangler.jsonc` にBinding設定を記述。
* **Environment**: `wrangler.jsonc` 内の `compatibility_date` を最新に設定。

## 3. CI/CD連携 (GitHub / Cloudflare Pages)
* **Repository**: GitHubにプライベートリポジトリを作成し、ソースをプッシュ。
* **Integration**: Cloudflareダッシュボードから「Pages」を選択し、GitHubリポジトリと接続。
* **Build Setting**: フレームワークプリセットで `Hono` (または `None`) を選択し、ビルドコマンドに `npm run deploy` を指定。
* **Auto Deploy**: `main` ブランチへのプッシュで本番環境へ自動デプロイされる状態を維持。

## 4. 運用保守の要点
* **Logs**: `npx wrangler tail` で本番環境のリアルタイムログを確認可能。
* **Secret**: APIキー等の機密情報は `wrangler secret put` で管理し、コード内への直書きを厳禁とする。
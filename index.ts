/**
 * ==========================================================
 * 【Aletheia 管理用URL・コマンドメモ】
 * ==========================================================
 * * ■ 本番環境 (Cloudflare Workers)
 * ----------------------------------------------------------
 * - TOP（開発用メニュー）: https://aletheia-proto.tshizen2506.workers.dev/sandbox/
 * - Google認証テスト:    https://aletheia-proto.tshizen2506.workers.dev/sandbox/test01/login
 * - DB接続・一覧表示:    https://aletheia-proto.tshizen2506.workers.dev/sandbox/test02
 * * ■ ローカル開発環境 (http://localhost:8787)
 * ----------------------------------------------------------
 * - Google認証テスト:    http://localhost:8787/sandbox/test01/login
 * - DB接続・一覧表示:    http://localhost:8787/sandbox/test02
 * * ■ データベース更新コマンド (ターミナル実行用)
 * ----------------------------------------------------------
 * [ローカル反映] npx wrangler d1 execute aletheia-db --local --file=./seed.sql
 * [本番環境反映] npx wrangler d1 execute aletheia-db --remote --file=./seed.sql
 * * ==========================================================
 */

import { Hono } from 'hono'
import { trimTrailingSlash } from 'hono/trailing-slash'

// ==========================================
// 1. 各テスト用部品（機能）の読み込み
// ==========================================
import { test01 } from './test01_google-auth'  // Googleログイン検証用
import { test02 } from './test02_db-access'    // D1データベース読み書き検証用

// ==========================================
// 2. 共通の道具箱（環境変数）の定義
// ==========================================
// プロジェクト全体で使う「データベース名」や「環境名」をここで宣言します。
type Bindings = {
  aletheia_db: D1Database  // Cloudflare D1（本番・ローカル共通）
  ENVIRONMENT?: string     // 実行環境（development / production）
}

// sandboxApp という「テスト用サブアプリ」を作成し、道具箱を持たせます。
export const sandboxApp = new Hono<{ Bindings: Bindings }>()

// ==========================================
// 3. 共通設定（ガードマン）の配置
// ==========================================
// URLの末尾に「/」があってもなくても同じように動くよう、自動調整します。
// 例： /test02/ でも /test02 でも正しくアクセス可能になります。
sandboxApp.use('*', trimTrailingSlash())

// ==========================================
// 4. 各テスト機能の「住所（ルート）」登録
// ==========================================

// 【テスト01】 Googleアカウントでログインできるか確認するページ
// アクセス先： http://localhost:8787/sandbox/test01
sandboxApp.route('/test01', test01)

// 【テスト02】 保存したデータ（D1）が正しく表示されるか確認するページ
// アクセス先： http://localhost:8787/sandbox/test02
sandboxApp.route('/test02', test02)


/* ---------------------------------------------------------
   【新しいテスト（test03）を追加する際の手順】
   ---------------------------------------------------------
   1. 冒頭の「1. 部品のインポート」に以下を書き足す
      import { test03 } from './test03_filename'

   2. 上記の「4. 各テスト機能の登録」に以下を書き足す
      sandboxApp.route('/test03', test03)

   これで http://localhost:8787/sandbox/test03 が有効になります。
   --------------------------------------------------------- */
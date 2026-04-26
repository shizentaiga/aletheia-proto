/**
 * =============================================================================
 * 【 ALETHEIA - システム・エントリーポイント / index.tsx 】
 * =============================================================================
 * 役割：
 * 1. アプリケーションのルーティング（パスと機能の紐付け）定義
 * 2. ミドルウェア（共通レンダラー、認証など）の統合
 * 3. 各機能モジュール（APIハンドラ、開発用サンドボックス）の集約
 * * 📁 File Path: src/index.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { renderer } from './renderer'
import { sandboxApp } from './_sandbox/_router'

// 認証ライブラリ、データベースクエリ、および共通ハンドラのインポート
import { authApp } from './lib/auth'
import { fetchCafesByContext } from './db/cafe_queries' 
import { 
  handleAreaStats, 
  getSearchParams,
  renderCafeSearchResults,
  handleTopPage
} from './api_handlers'

/**
 * 共通バインディング定義
 * Cloudflare Workers の環境変数や D1 データベースへの接続情報を定義
 */
type Bindings = {
  ALETHEIA_PROTO_DB: D1Database
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  NODE_ENV: string
}

const app = new Hono<{ Bindings: Bindings }>()

/**
 * =============================================================================
 * ミドルウェア / サブルーティングの登録
 * =============================================================================
 */

// 全リクエストに対して共通のHTMLレイアウト（renderer.tsx）を適用
app.use('*', renderer)

// Google OAuth 認証関連のルーティングを統合
app.route('/', authApp)

// 開発用サンドボックス環境（テスト機能用）のルーティングを統合
app.route('/_sandbox', sandboxApp)

/**
 * =============================================================================
 * メインルーティング（エンドポイント定義）
 * =============================================================================
 */

/**
 * [GET] /
 * トップページの初期表示
 * - 位置情報の判定、ユーザー情報の取得、初期リストのフェッチを
 * すべて handleTopPage 内で実行し、フルレンダリングされたHTMLを返却します。
 */
app.get('/', handleTopPage)

/**
 * [GET] /search
 * 検索の実行と部分更新（HTMX連携）
 * - クエリパラメータの抽出、DBフェッチを行い、
 * HTMXリクエストかどうかに応じて適切なHTML断片またはフルページを返却します。
 */
app.get('/search', async (c) => {
  // 1. URLクエリから検索パラメータを抽出
  const params = getSearchParams(c)

  // 2. 抽出された条件をもとにDBから店舗情報を取得
  const results = await fetchCafesByContext(c.env.ALETHEIA_PROTO_DB, params)

  // 3. 表示形式の判定およびレンダリングを委譲
  return renderCafeSearchResults(c, params, results)
})

/**
 * [GET] /api/area-stats
 * エリア別統計情報の配信（JSON）
 * - 市区町村別の店舗数データなどをフロントエンドのコンポーネント向けに提供します。
 */
app.get('/api/area-stats', handleAreaStats)

export default app
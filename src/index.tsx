/**
 * =============================================================================
 * 【 ALETHEIA - システム・エントリーポイント / index.tsx 】
 * =============================================================================
 * 役割：ルーティングの定義、ミドルウェアの適用、各機能モジュールの接合。
 * 📁 File Path: src/index.tsx
 * * ■ フォルダ構造 (Directory Structure)
 * src/
 * ├── index.tsx         # 全体のルーティング・接合点（本ファイル）
 * ├── renderer.tsx      # 共通レイアウト・JSXレンダリング設定
 * ├── pages/            # 画面テンプレート (Top.tsx 等)
 * ├── lib/              # 共通ロジック・認証基盤 (auth.ts 等)
 * ├── db/               # D1関連 (schema, seed等)
 * └── _sandbox/         # 技術検証用プロトタイプ
 * * ■ 設計思想 (Design Philosophy)
 * 1. 俯瞰性の維持: プロトタイプ期は本ファイルで全体を管理し、開発速度を優先。
 * 2. 段階的移譲: 規模拡大に応じ、ロジックを pages/ や lib/ へ適切に配置。
 * 3. 資産化の構造: 整理されたフォルダ構成により、コードの資産価値を維持。
 * =============================================================================
 */

/**
 * =============================================================================
 * 【 ALETHEIA - システム・エントリーポイント / index.tsx 】
 * =============================================================================
 * 役割：ルーティングの定義、ミドルウェアの適用、各機能モジュールの接合。
 * 📁 File Path: src/index.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { renderer } from './renderer'
import { Top } from './pages/Top'
import { sandboxApp } from './_sandbox/_router'

/**
 * 内部ライブラリ・DB層のインポート
 */
import { authApp, AUTH_CONFIG, getCurrentUser } from './lib/auth'
import { fetchCafesByContext } from './db/queries' // 👈 追加：DBクエリ関数の導入

// -----------------------------------------------------------------------------
// 1. 環境変数定義 (Bindings)
// -----------------------------------------------------------------------------

type Bindings = {
  ALETHEIA_PROTO_DB: D1Database
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  NODE_ENV: string
}

const app = new Hono<{ Bindings: Bindings }>()

// -----------------------------------------------------------------------------
// 2. ミドルウェア設定 (Middleware)
// -----------------------------------------------------------------------------

app.use('*', renderer)

// -----------------------------------------------------------------------------
// 3. ルーティング (Routes & Sub-Apps)
// -----------------------------------------------------------------------------

app.route('/', authApp)
app.route('/_sandbox', sandboxApp)

// -----------------------------------------------------------------------------
// 4. ページレンダリング (Page Rendering)
// -----------------------------------------------------------------------------

/**
 * トップページ
 * 認証情報とDB実データを並列で取得し、統合されたビューを提供します。
 */
app.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)

  // 1. ユーザー情報とカフェデータを並列で取得（パフォーマンス最適化）
  const [user, cafeResult] = await Promise.all([
    getCurrentUser(db, sessionUserId),
    fetchCafesByContext(db) // デフォルト条件（全エリア・全キーワード）で取得
  ])

  // 2. レンダリング
  // Top.tsx に対して、実データ(cafes)と総件数(totalCount)を渡します
  return c.render(
    <Top 
      user={user} 
      env={c.env} 
      cafes={cafeResult.cafes} 
      totalCount={cafeResult.totalCount} 
    />, 
    { title: 'メインポータル' }
  )
})

export default app
/**
 * =============================================================================
 * 【 ALETHEIA - システム・エントリーポイント / index.tsx 】
 * =============================================================================
 * 役割：
 * 1. アプリケーションのルーティング（経路案内）定義
 * 2. ミドルウェア（レンダラー等）の適用
 * 3. 各機能モジュール（認証、API、管理画面等）の統合
 * * 📁 File Path: src/index.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { renderer } from './renderer'
import { Top } from './pages/Top' 
import { sandboxApp } from './_sandbox/_router'

// 認証、データアクセス、および共通ハンドラのインポート
import { authApp, AUTH_CONFIG, getCurrentUser } from './lib/auth'
import { fetchCafesByContext } from './db/cafe_queries' 
import { 
  handleAreaStats, 
  getCloudflareLocation, 
  getSearchParams,
  renderCafeSearchResults
} from './api_handlers'

/**
 * 共通バインディング定義（環境変数・D1 DB接続等）
 */
type Bindings = {
  ALETHEIA_PROTO_DB: D1Database
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  NODE_ENV: string
}

const app = new Hono<{ Bindings: Bindings }>()

/**
 * ミドルウェア / サブルーティングの登録
 */
app.use('*', renderer)             // 全リクエストに共通のHTMLレンダラーを適用
app.route('/', authApp)            // Google OAuth 認証関連のルーティングを統合
app.route('/_sandbox', sandboxApp) // 開発用サンドボックス（テスト機能）を統合

/**
 * [GET] /
 * 役割：初期表示（フルレンダリング）
 * - 初回アクセスやロゴクリック時に、位置情報に基づいた初期検索結果を表示
 */
app.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)

  // 1. 位置情報および検索パラメータの取得（外部ロジックに委譲）
  const locationInfo = getCloudflareLocation(c)
  const { keyword, category, offset, region: queryRegion } = getSearchParams(c)

  // 2. エリア判定（ユーザー指定を優先し、未指定なら位置情報を利用）
  const effectiveRegion = queryRegion || (locationInfo.region !== 'unknown' ? locationInfo.region : '')

  // 3. データの並列取得（高速化のため、ユーザー情報とカフェデータを同時にフェッチ）
  const [user, cafeResult] = await Promise.all([
    getCurrentUser(db, sessionUserId),
    fetchCafesByContext(db, { 
      keyword, 
      region: effectiveRegion, 
      offset, 
      detectedRegion: locationInfo.region 
    }) 
  ])

  // Topページ全体をサーバーサイドレンダリングして返却
  return c.render(
    <Top 
      user={user} 
      env={c.env} 
      cafes={cafeResult.cafes} 
      totalCount={cafeResult.totalCount}
      location={locationInfo}
      keyword={keyword}
      region={effectiveRegion} 
      category={category}
    />, 
    { title: 'メインポータル' }
  )
})

/**
 * [GET] /search
 * 役割：検索の実行と部分更新（HTMX連携）
 * - フォーム送信時や追加読み込み時に呼ばれ、HTMX経由ならHTML断片のみを返却
 */
app.get('/search', async (c) => {
  // 1. 検索パラメータの取得
  const params = getSearchParams(c)

  // 2. 指定された条件でDBから店舗情報をフェッチ
  const results = await fetchCafesByContext(c.env.ALETHEIA_PROTO_DB, params)

  // 3. レンダリング処理（HTMX判定含む）をハンドラ側へ委譲
  return renderCafeSearchResults(c, params, results)
})

/**
 * [GET] /api/area-stats
 * 役割：エリア別統計情報の配信（JSON）
 */
app.get('/api/area-stats', handleAreaStats)

export default app
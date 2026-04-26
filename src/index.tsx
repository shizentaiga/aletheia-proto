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
import { Top, CafeList } from './pages/Top' 
import { sandboxApp } from './_sandbox/_router'

// コンポーネントおよび認証ライブラリのインポート
import { SearchHeader } from './components/SearchHeader'
import { authApp, AUTH_CONFIG, getCurrentUser } from './lib/auth'
import { fetchCafesByContext } from './db/cafe_queries' 
import { handleAreaStats, getCloudflareLocation } from './api_handlers'

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
app.use('*', renderer)       // 全リクエストに共通のHTMLレンダラーを適用
app.route('/', authApp)      // Google OAuth 認証関連のルーティングを統合
app.route('/_sandbox', sandboxApp) // 開発用サンドボックス（テスト機能）を統合

/**
 * [GET] /
 * 役割：初期表示（フルレンダリング）
 * - 初回アクセス時やロゴクリックによるトップ帰還時に実行
 * - 位置情報の判定と、初期表示データの取得を行う
 */
app.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)

  /**
   * 1. インフラ層（Cloudflare）からの位置情報取得
   * ハンドラ側に切り出した関数を呼び出し
   */
  const locationInfo = getCloudflareLocation(c)

  // 検索パラメータのパース
  const keyword = c.req.query('keyword') || ''
  const category = c.req.query('category') || ''
  const offset = parseInt(c.req.query('offset') || '0', 10)

  /**
   * 2. エリア判定ロジック（肝）
   * URLパラメータ（ユーザー指定）を最優先し、なければCFの位置情報を使用する
   */
  const queryRegion = c.req.query('region')
  const effectiveRegion = queryRegion || (locationInfo.region !== 'unknown' ? locationInfo.region : '')

  /**
   * 3. データの並列取得
   * ユーザー情報と初期表示用のカフェリストを同時にフェッチして高速化を図る
   */
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
 * - フォーム送信時や「さらに読み込む」クリック時に呼ばれる
 * - HTMX経由ならHTMLの断片のみを返し、直接アクセスならフルページを返す（リロード対応）
 */
app.get('/search', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  
  // HTMXリクエストかどうかをヘッダーで判定
  const isHtmx = c.req.header('HX-Request') === 'true'

  const keyword = c.req.query('keyword') || ''
  const region = c.req.query('region') || ''
  const category = c.req.query('category') || ''
  const offset = parseInt(c.req.query('offset') || '0', 10)
  const detectedRegion = c.req.query('detectedRegion') || ''

  // 指定された条件でDBからカフェ情報をフェッチ
  const { cafes, totalCount } = await fetchCafesByContext(db, { 
    keyword, 
    offset,
    region,
    detectedRegion 
  })

  /**
   * 1. 非HTMXリクエスト（直URL叩き等）の場合
   * 検索条件を保持した状態で Top ページをフルレンダリングする
   */
  if (!isHtmx) {
    const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)
    const user = await getCurrentUser(db, sessionUserId)
    return c.render(
      <Top 
        user={user} env={c.env} cafes={cafes} totalCount={totalCount}
        keyword={keyword} region={region} category={category}
      />,
      { title: '検索結果' }
    )
  }

  /**
   * 2. HTMXリクエスト（最初の検索実行）の場合
   * 検索ヒット件数（Header）と、最初のカードリスト（CafeList）を返す
   */
  if (offset === 0) {
    return c.html(
      <>
        <SearchHeader totalCount={totalCount} />
        <div id="cafe-cards-root">
          <CafeList 
            cafes={cafes} 
            totalCount={totalCount} 
            offset={offset} 
            keyword={keyword} 
            region={region}
            category={category}
            detectedRegion={detectedRegion}
          />
        </div>
      </>
    )
  }

  /**
   * 3. HTMXリクエスト（無限スクロール / 追加読み込み）の場合
   * 新しいカードの塊（CafeList）のみを返し、既存のリスト末尾へ追記される
   */
  return c.html(
    <CafeList 
      cafes={cafes} 
      totalCount={totalCount} 
      offset={offset} 
      keyword={keyword} 
      region={region}
      category={category}
      detectedRegion={detectedRegion}
    />
  )
})

/**
 * [GET] /api/area-stats
 * 役割：エリア別統計情報の配信
 * - クライアント側のドリルダウンメニューで使用する市区町村別の件数データをJSONで提供
 */
app.get('/api/area-stats', handleAreaStats)

export default app
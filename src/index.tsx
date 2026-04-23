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

/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { renderer } from './renderer'
import { Top, CafeList } from './pages/Top' // 👈 CafeList を追加インポート
import { sandboxApp } from './_sandbox/_router'

/**
 * 内部ライブラリ・DB層のインポート
 */
import { authApp, AUTH_CONFIG, getCurrentUser } from './lib/auth'
import { fetchCafesByContext } from './db/queries'

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
 * [GET] /
 * トップページ（フルリロード時）
 */
app.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)

  // クエリパラメータから初期検索条件を取得（URL直接入力対応）
  const keyword = c.req.query('keyword')

  const [user, cafeResult] = await Promise.all([
    getCurrentUser(db, sessionUserId),
    fetchCafesByContext(db, { keyword }) // keyword があれば絞り込み
  ])

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

/**
 * [GET] /search
 * HTMX専用：検索・もっと見る（部分更新）
 * ページ全体ではなく、CafeList コンポーネントのみをHTMLとして返却します
 */
app.get('/search', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  
  // クエリパラメータの取得
  const keyword = c.req.query('keyword')
  const offset = parseInt(c.req.query('offset') || '0', 10)

  // DBから該当データを取得
  const { cafes, totalCount } = await fetchCafesByContext(db, { 
    keyword, 
    offset 
  })

  // ページ全体(c.render)ではなく、コンポーネント単体をHTMLとして返す
  // これにより HTMX が指定した target(#cafe-list-container 等)を瞬時に書き換える
  return c.html(
    <CafeList 
      cafes={cafes} 
      totalCount={totalCount} 
      offset={offset} 
      keyword={keyword} 
    />
  )
})

export default app
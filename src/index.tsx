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
import { Top, CafeList } from './pages/Top' 
import { sandboxApp } from './_sandbox/_router'

// 【ポイント1】UIパーツの部品化
// index.tsxの中に直接HTMLを書き込まず、外部コンポーネントを呼び出す形にします。
import { SearchHeader } from './components/SearchHeader'

import { authApp, AUTH_CONFIG, getCurrentUser } from './lib/auth'
import { fetchCafesByContext } from './db/queries'

type Bindings = {
  ALETHEIA_PROTO_DB: D1Database
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  NODE_ENV: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', renderer)
app.route('/', authApp)
app.route('/_sandbox', sandboxApp)

/**
 * [GET] / : 初期表示（フルレンダリング）
 */
app.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)

  // Cloudflareから位置情報を取得
  const cf = c.req.raw.cf as any 
  const locationInfo = {
    region: cf?.region || 'unknown',
    city: cf?.city || 'unknown',
    colo: cf?.colo || 'unknown'
  }

  // クエリパラメータの取得（検索条件）
  const keyword = c.req.query('keyword') || ''
  const region = c.req.query('region') || '' 
  const category = c.req.query('category') || ''
  const offset = parseInt(c.req.query('offset') || '0', 10)

  // ユーザー情報とカフェ一覧を並列で取得
  const [user, cafeResult] = await Promise.all([
    getCurrentUser(db, sessionUserId),
    // 💡 ビルドエラー回避のため、引数は既存の型(categoryなし)に合わせています
    fetchCafesByContext(db, { keyword, region, offset }) 
  ])

  // ページ全体を表示
  return c.render(
    <Top 
      user={user} 
      env={c.env} 
      cafes={cafeResult.cafes} 
      totalCount={cafeResult.totalCount}
      location={locationInfo}
      keyword={keyword}
      region={region}
      category={category}
    />, 
    { title: 'メインポータル' }
  )
})

/**
 * [GET] /search : HTMXからのリクエスト（部分更新用）
 */
app.get('/search', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  
  const keyword = c.req.query('keyword') || ''
  const region = c.req.query('region') || ''
  const category = c.req.query('category') || ''
  const offset = parseInt(c.req.query('offset') || '0', 10)

  // 指定された条件でDBからカフェを検索
  const { cafes, totalCount } = await fetchCafesByContext(db, { 
    keyword, 
    offset,
    region
  })

  // 【ポイント2】HTMXレスポンスの整理
  // 最初の検索時(offset=0)は、件数表示(SearchHeader)とリストの両方を返します。
  if (offset === 0) {
    return c.html(
      <>
        {/* インラインHTMLを排除し、SearchHeader部品を呼び出し */}
        <SearchHeader totalCount={totalCount} />
        
        {/* 検索結果のリスト表示 */}
        <div id="cafe-cards-root">
          <CafeList 
            cafes={cafes} 
            totalCount={totalCount} 
            offset={offset} 
            keyword={keyword} 
            region={region}
            category={category}
          />
        </div>
      </>
    )
  }

  // 「さらに読み込む」ボタン押下時は、追加分のリスト(CafeList)のみを返します。
  return c.html(
    <CafeList 
      cafes={cafes} 
      totalCount={totalCount} 
      offset={offset} 
      keyword={keyword} 
      region={region}
      category={category}
    />
  )
})

export default app
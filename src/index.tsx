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

// UIパーツの部品化
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
 * ロゴクリック時や初回アクセス時に呼ばれる
 */
app.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)

  // Cloudflareから位置情報を取得（型安全のため安全にキャスト）
  const cf = (c.req.raw as any).cf
  const locationInfo = {
    region: cf?.region || 'unknown',
    city: cf?.city || 'unknown',
    colo: cf?.colo || 'unknown'
  }

  // クエリパラメータの取得（検索条件）
  const keyword = c.req.query('keyword') || ''
  const category = c.req.query('category') || ''
  const offset = parseInt(c.req.query('offset') || '0', 10)

  // 【ロジックの肝】
  // 1. URLパラメータに region があればそれを使用
  // 2. なければ Cloudflare の位置情報を使用
  const queryRegion = c.req.query('region')
  const effectiveRegion = queryRegion || (locationInfo.region !== 'unknown' ? locationInfo.region : '')

  // ユーザー情報とカフェ一覧を並列で取得
  // effectiveRegion を渡すことで、初回から絞り込まれた結果を返す
  const [user, cafeResult] = await Promise.all([
    getCurrentUser(db, sessionUserId),
    fetchCafesByContext(db, { 
      keyword, 
      region: effectiveRegion, 
      offset, 
      detectedRegion: locationInfo.region 
    }) 
  ])

  // ページ全体を表示
  // region={effectiveRegion} を渡すことで、Top.tsx 内の JS 初期化関数にこの値が引き継がれる
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
 * [GET] /search : HTMXからのリクエスト（部分更新用）＋ リロード対策
 */
app.get('/search', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  
  // HTMXリクエストか判定
  const isHtmx = c.req.header('HX-Request') === 'true'

  const keyword = c.req.query('keyword') || ''
  const region = c.req.query('region') || ''
  const category = c.req.query('category') || ''
  const offset = parseInt(c.req.query('offset') || '0', 10)
  
  const detectedRegion = c.req.query('detectedRegion') || ''

  // 指定された条件でDBからカフェを検索
  const { cafes, totalCount } = await fetchCafesByContext(db, { 
    keyword, 
    offset,
    region,
    detectedRegion 
  })

  // HTMX以外での直接アクセスの場合は Top をフルレンダリング（リロード対策）
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

  // HTMXレスポンス（検索結果エリアのみ更新）
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

  // 「さらに読み込む」用
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

export default app
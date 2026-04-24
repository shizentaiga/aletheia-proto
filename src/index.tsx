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
import { Top, CafeList, PAGE_DESIGN } from './pages/Top' 
import { SPACE } from './styles/theme'
import { sandboxApp } from './_sandbox/_router'

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
 * [GET] /
 */
app.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)

  const cf = c.req.raw.cf as any 
  const locationInfo = {
    region: cf?.region || 'unknown',
    city: cf?.city || 'unknown',
    colo: cf?.colo || 'unknown'
  }

  const keyword = c.req.query('keyword') || ''
  const region = c.req.query('region') || '' 
  const category = c.req.query('category') || '' // 👈 追加
  const offset = parseInt(c.req.query('offset') || '0', 10)

  const [user, cafeResult] = await Promise.all([
    getCurrentUser(db, sessionUserId),
    // 💡 category をクエリに含める（DB側の対応に合わせて拡張可能）
    fetchCafesByContext(db, { keyword, region, offset }) 
  ])

  return c.render(
    <Top 
      user={user} 
      env={c.env} 
      cafes={cafeResult.cafes} 
      totalCount={cafeResult.totalCount}
      location={locationInfo}
      keyword={keyword}
      region={region}
    />, 
    { title: 'メインポータル' }
  )
})

/**
 * [GET] /search
 * HTMX専用：部分更新
 */
app.get('/search', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  
  const keyword = c.req.query('keyword') || ''
  const region = c.req.query('region') || ''
  const category = c.req.query('category') || '' // 👈 追加
  const offset = parseInt(c.req.query('offset') || '0', 10)

  const { cafes, totalCount } = await fetchCafesByContext(db, { 
    keyword, 
    offset,
    region 
  })

  // 💡 offset=0（新規検索）の時
  if (offset === 0) {
    return c.html(
      <>
        <div id="list-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: SPACE.SM 
        }}>
          <h2 style={{ 
            fontSize: PAGE_DESIGN.SECTION_TITLE.FONT_SIZE, 
            color: PAGE_DESIGN.SECTION_TITLE.COLOR, 
            fontWeight: PAGE_DESIGN.SECTION_TITLE.WEIGHT 
          }}>
            検索結果 
            <span style={{ 
              color: PAGE_DESIGN.COUNTER.COLOR, 
              fontWeight: PAGE_DESIGN.COUNTER.WEIGHT, 
              marginLeft: SPACE.XS 
            }}>
              全 {totalCount} 件
            </span>
          </h2>
        </div>

        <div id="cafe-cards-root">
          <CafeList 
            cafes={cafes} 
            totalCount={totalCount} 
            offset={offset} 
            keyword={keyword} 
            region={region}
          />
        </div>
      </>
    )
  }

  // 💡 offset > 0（さらに読み込む）
  return c.html(
    <CafeList 
      cafes={cafes} 
      totalCount={totalCount} 
      offset={offset} 
      keyword={keyword} 
      region={region}
    />
  )
})

export default app
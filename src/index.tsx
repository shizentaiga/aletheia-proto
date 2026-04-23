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

import { authApp, AUTH_CONFIG, getCurrentUser } from './lib/auth'
import { fetchCafesByContext } from './db/queries'

type Bindings = {
  ALETHEIA_PROTO_DB: D1Database
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  NODE_ENV: string
}

const app = new Hono<{ Bindings: Bindings }>()

// 1. renderer はフルリロード時のみ適用されるよう、通常は app.use で良いですが
//    HTMX リクエスト時は c.render を使わないことで回避します。
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

  const keyword = c.req.query('keyword')
  const queryRegion = c.req.query('region') 
  const offset = parseInt(c.req.query('offset') || '0', 10)

  const [user, cafeResult] = await Promise.all([
    getCurrentUser(db, sessionUserId),
    fetchCafesByContext(db, { 
      keyword, 
      region: queryRegion,
      offset
    })
  ])

  // フルレンダリング
  return c.render(
    <Top 
      user={user} 
      env={c.env} 
      cafes={cafeResult.cafes} 
      totalCount={cafeResult.totalCount}
      location={locationInfo}
      keyword={keyword}
      region={queryRegion}
    />, 
    { title: 'メインポータル' }
  )
})

/**
 * [GET] /search
 * HTMX専用：検索・もっと見る（部分更新）
 */
app.get('/search', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  
  const keyword = c.req.query('keyword')
  const queryRegion = c.req.query('region') 
  const offset = parseInt(c.req.query('offset') || '0', 10)

  const { cafes, totalCount } = await fetchCafesByContext(db, { 
    keyword, 
    offset,
    region: queryRegion 
  })

  /**
   * 💡 重要：
   * 検索フォーム（SearchSection）から offset=0 でリクエストが来た場合は、
   * リスト全体をリセットするために「ヘッダー」や「ボタン」も含む初期状態を返す必要があります。
   * 「もっと見る」の時（offset > 0）は OOB Swap が発動して既存のボタンを置換します。
   */
  return c.html(
    <CafeList 
      cafes={cafes} 
      totalCount={totalCount} 
      offset={offset} 
      keyword={keyword} 
      region={queryRegion}
    />
  )
})

export default app
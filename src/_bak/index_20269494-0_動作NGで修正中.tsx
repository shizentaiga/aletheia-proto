/**
 * =============================================================================
 * 【  (アレテイア) - システム司令塔 / index.tsx】
 * =============================================================================
 * ■ 運用コマンド・プロトコル
 * -----------------------------------------------------------------------------
 * [反映] npx wrangler deploy
 * [監視] npx wrangler tail
 * [DB操作: ローカル] npx wrangler d1 execute  -db --local --file=./schema.sql
 * -----------------------------------------------------------------------------
 */

/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { HomeContainer } from './components/containers/HomeContainer'
import { sandboxApp } from './_sandbox'
import { CafeService } from './services/cafe' // Service層を統合

/**
 * [環境変数 (Bindings) の定義]
 * -----------------------------------------------------------------------------
 * Cloudflare Workers (サーバー側) でのみ利用可能なリソース。
 * ブラウザからは直接参照できないため、APIを経由して間接的に利用します。
 * -----------------------------------------------------------------------------
 */
type Bindings = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  SESSION_EXPIRY: string
  
  // 【重要】データベースバインディング
   _db: D1Database 
}

const app = new Hono<{ Bindings: Bindings }>()

// --- 【1. 外部ルートの結合】 -------------------------------------------------
app.route('/sandbox', sandboxApp)

// --- 【2. データAPI窓口 (重要: 疎通の要)】 -------------------------------------
/**
 * [GET /api/cafes]
 * ブラウザ(useCafe)からのリクエストを受け取り、サーバー側でDB操作を代行します。
 * これにより「ブラウザからD1が見えない」という致命的不具合を解消します。
 */
app.get('/api/cafes', async (c) => {
  const prefix = c.req.query('prefix') || 'xn76';
  
  try {
    // 監査指摘に基づき、Service層を通じて安全にデータを取得
    // ※ 内部で status='published' のフィルタが効いていることに注意
    const cafes = await CafeService.getByGeohash(c.env. _db, prefix);
    
    // 取得結果を JSON としてブラウザに返却
    return c.json(cafes);
  } catch (e) {
    console.error(`[API ERROR]: ${e}`);
    return c.json({ error: 'Failed to fetch cafes' }, 500);
  }
});

// --- 【3. メインルーティング】 -----------------------------------------------
/**
 * [トップページ]
 * 役割：初期HTMLの送出。
 * * 修正点：HomeContainer に直接 db を渡す設計は維持しつつ、
 * 実際の「動的な検索」は上記 /api/cafes を使うようにフロントエンドを誘導します。
 */
app.get('/', (c) => {
  // DBバインドの生存確認（ターミナルに表示）
  if (!c.env. _db) {
    console.error("❌ CRITICAL: D1 binding ' _db' is missing.");
  }

  return c.html(
    <HomeContainer 
      title="  - つながりは偶然から" 
      db={c.env. _db} 
    />
  )
})

// --- 【4. システム・セーフティ】 ---------------------------------------------
app.onError((err, c) => {
  console.error(`[SYSTEM CRITICAL ERROR]: ${err.message}`)
  return c.text('Internal Server Error', 500)
})

export default app
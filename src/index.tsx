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
import { Top } from './pages/Top'
import { sandboxApp } from './_sandbox/_router'

/**
 * 内部ライブラリのインポート
 * 認証基盤 (authApp) と、セッション解析 (getCurrentUser) を利用します。
 */
import { authApp, AUTH_CONFIG, getCurrentUser } from './lib/auth'

// -----------------------------------------------------------------------------
// 1. 環境変数定義 (Bindings)
// -----------------------------------------------------------------------------

/**
 * Cloudflare Workers / D1 のバインディング定義
 */
type Bindings = {
  ALETHEIA_PROTO_DB: D1Database
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// -----------------------------------------------------------------------------
// 2. ミドルウェア設定 (Middleware)
// -----------------------------------------------------------------------------

/**
 * 全てのルート ('*') に対して共通レイアウト (renderer) を適用
 * 各ハンドラーで c.render() を呼び出すことで統一された HTML 構造を出力します
 */
app.use('*', renderer)

// -----------------------------------------------------------------------------
// 3. ルーティング (Routes & Sub-Apps)
// -----------------------------------------------------------------------------

/**
 * [認証系] 
 * Google OAuth2 / ログアウト / 退会 処理をマウント
 */
app.route('/', authApp)

/**
 * [開発用]
 * サンドボックス環境 (/_sandbox/*)
 */
app.route('/_sandbox', sandboxApp)

/**
 * 💡 今後の拡張ポイント：
 * 特定のパスにログイン必須の制限をかける場合、
 * ここに認証 Middleware を記述します。
 */

// -----------------------------------------------------------------------------
// 4. ページレンダリング (Page Rendering)
// -----------------------------------------------------------------------------

/**
 * トップページ
 * Cookie からセッションを取得し、DB 照合を経てユーザー情報を Top ページに渡します
 */
app.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)
  
  // セッション有効性を確認し、ユーザー情報を取得（未ログイン時は null）
  const user = await getCurrentUser(db, sessionUserId)

  // Top.tsx へユーザー情報を Props として注入し、レンダリングを実行
  return c.render(<Top user={user} />, { title: 'メインポータル' })
})

export default app
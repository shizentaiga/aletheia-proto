/**
 * =============================================================================
 * 【 ALETHEIA - システム・エントリーポイント / index.tsx 】
 * =============================================================================
 * 役割：ルーティングの定義と、各機能モジュールの接合。
 * * ■ フォルダ構造 (Directory Structure)
 * src/
 * ├── index.tsx           # 全体のルーティング・ミドルウェア定義（本ファイル）
 * ├── renderer.tsx        # 共通レイアウト・JSXレンダリング設定
 * ├── routes/             # APIエンドポイント (店舗検索、認証、ビジネスロジック)
 * ├── pages/              # 各画面のテンプレート (Top, MyPage等)
 * ├── components/         # 再利用可能なUI部品
 * ├── client/             # クライアントサイドJavaScript
 * ├── db/                 # D1データベース関連 (schema.sql, seedデータ等)
 * ├── lib/                # サーバー側共通ロジック (ユーティリティ、計算、変換)
 * └── _sandbox/           # スクラップ＆ビルド、技術検証用プロトタイプ
 * * ■ 設計思想 (Design Philosophy)
 * 1. 動作の確実性：
 * プロトタイプ期は本ファイルで全体を俯瞰し、結合密度の高い開発を行う。
 * 2. 段階的疎結合：
 * 規模拡大に伴い、本ファイルから routes/ や types/ へロジックを段階的に移譲し、
 * index.tsx は純粋な「交通整理（ルーティング）」に特化させる。
 * 3. 高密度な資産：
 * 情報の「種」を「資産」へ成長させる構造を反映し、コードもまた成長を許容する。
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { renderer } from './renderer'
import { Top } from './pages/Top'
import { sandboxApp } from './_sandbox/_router'
// 【ポイント1】認証アプリとユーザー取得関数をインポート
import { authApp, AUTH_CONFIG, getCurrentUser } from './lib/auth'

/**
 * =============================================================================
 * 【 ALETHEIA - システム・エントリーポイント / index.tsx 】
 * =============================================================================
 */

// Bindingsの型定義（環境変数の型をここに集約）
type Bindings = {
  ALETHEIA_PROTO_DB: D1Database
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// --- [Middleware] -----------------------------------------------------------

// 全てのルートにレイアウト（renderer.tsx）を適用
app.use('*', renderer)

// --- [Routes & Sub-Apps] ----------------------------------------------------

/**
 * 認証エンドポイントのマウント
 * /auth/google, /logout, /delete-account 等を有効化します
 */
app.route('/', authApp)

/**
 * 開発用サンドボックス
 */
app.route('/_sandbox', sandboxApp)

/**
 * 💡 今後の拡張ポイント：
 * 特定のディレクトリ配下に認証必須バリデーション（Middleware）をかける場合は
 * ここに app.use('/api/*', ...) などを記述します。
 */

// --- [Page Rendering] --------------------------------------------------------

/**
 * トップページ
 * セッションを確認し、ユーザー情報を保持していれば Top コンポーネントへ渡します
 */
app.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB
  const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)
  
  // 【ポイント2】auth.ts の共通関数を使用してDBからユーザーを特定
  const user = await getCurrentUser(db, sessionUserId)

  // ユーザー情報を Props として Top.tsx に注入
  return c.render(<Top user={user} />, { title: 'メインポータル' })
})

export default app
/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { Layout } from './components/Layout'
import { DevCore } from './components/DevCore'
import { Hero } from './components/Hero'

// --- 【外部機能のインポート】 ---
// 認証テスト用のルートを読み込みます（src/test/test20260402.tsx）
import { testRoute } from './test/test20260402'

// 環境変数の型定義（Cloudflare Workersの .dev.vars を安全に扱うため）
type Bindings = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

/* 【アプリの初期化】 Honoを起動し、環境変数の型を適用します */
const app = new Hono<{ Bindings: Bindings }>()

// --- 【ルーティング設定：機能の割り当て】 ---

/**
 * [テスト用エンドポイント]
 * http://localhost:8787/test/google にアクセスすると、Google認証が始まります。
 * testRoute側で定義された '/google' が、ここの '/test' と結合されます。
 */
app.route('/test', testRoute)

/**
 * [トップページ]
 */
app.get('/', (c) => {
  return c.html(
    <Layout>
      <Hero />
      <DevCore />
    </Layout>
  )
})

/* 【書き出し】 Cloudflare Workersへ設定を渡します */
export default app
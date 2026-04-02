/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { Layout } from './components/Layout'
import { DevCore } from './components/DevCore'
import { Hero } from './components/Hero'

// --- 【外部機能のインポート】 ---
// sandbox/index.ts を通じて、すべてのテストルートを一括で読み込みます
import { sandboxApp } from './sandbox'

// 環境変数の型定義（Cloudflare Workersの .dev.vars を安全に扱うため）
type Bindings = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

/* 【アプリの初期化】 Honoを起動し、環境変数の型を適用します */
const app = new Hono<{ Bindings: Bindings }>()

// --- 【ルーティング設定：機能の割り当て】 ---

/**
 * [サンドボックス（実験場）]
 * 今後は sandbox/ 内にファイルを追加するだけで、
 * 自動的に http://localhost:8787/sandbox/test01... のようにアクセス可能になります。
 */
app.route('/sandbox', sandboxApp)

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
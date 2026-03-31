/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
/* 【部品の読み込み】 全体の枠組み（Layout）と、中身の機能（DevCore）を呼び出します */
import { Layout } from './components/Layout'
import { DevCore } from './components/DevCore'
import { Hero } from './components/Hero'

/* 【アプリの初期化】 HonoというWebサーバーの機能を起動します */
const app = new Hono()

/**
 * 【静的ファイルの扱いについて】
 * CloudflareのAssets機能により、/public 内のファイル（style.css, reserve.json等）は
 * プログラムを介さず直接ブラウザへ配信されます。
 * そのため、ここで特別な配信設定を書く必要はありません。
 */

/* 【ルート設定】 サイトのトップページ（ / ）にアクセスした時の動きを定義します */
app.get('/', (c) => {
  return c.html(
    /* 【画面の組み立て】 
      1. <Layout> で共通のヘッダーやCSS読み込みを準備し、
      2. その中に <DevCore />（カレンダーや検索窓）をはめ込んで表示します。
    */
    <Layout>
      <Hero />    {/* ← ここに追加！検索窓を表示させます */}
      <DevCore /> {/* ← その下にメイン機能を表示させます */}
    </Layout>
  )
})

/* 【書き出し】 この設定をCloudflare Workersへ渡して実行させます */
export default app
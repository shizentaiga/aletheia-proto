// リクルートのAPIキーの変数名(.dev.varsに記載)：RECRUIT_API_KEY
// 表示したい項目：店舗名、住所、緯度と経度、その他(基本は不要だがおすすめ情報があれば)
// 表示件数：100件(最大値)
// 仕様1：「エリア」「キーワード」などを指定して、100件の結果が表示できること
// 仕様2：重複を防ぐため、「次の100件」(ページ1、ページ2)などで、続きを取得する仕組みがあること
// ※CSSは不具合を防ぐため最低限で、見た目がまあまあなら大丈夫な想定。(あまりにも見にくいのはNG)


import { Hono } from 'hono'
import { html } from 'hono/html'

type Bindings = {
  RECRUIT_API_KEY: string
}

export const test07 = new Hono<{ Bindings: Bindings }>()

test07.get('/', async (c) => {
  // 1. クエリパラメータの取得（未入力時はデフォルト値を設定）
  const keyword = c.req.query('keyword') || ''
  const address = c.req.query('address') || ''
  const page = parseInt(c.req.query('page') || '1')
  
  const COUNT = 100 
  const start = (page - 1) * COUNT + 1

  let shops: any[] = []
  let totalCount = 0

  // 2. 検索条件がある場合のみAPIを実行
  if (keyword || address) {
    const apiKey = c.env.RECRUIT_API_KEY
    // URLの組み立て（安全なURLオブジェクトを使用）
    const url = new URL('https://webservice.recruit.co.jp/hotpepper/gourmet/v1/')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('keyword', keyword)
    url.searchParams.set('address', address)
    url.searchParams.set('count', COUNT.toString())
    url.searchParams.set('start', start.toString())
    url.searchParams.set('format', 'json')

    try {
      const res = await fetch(url.toString())
      const data = await res.json() as any
      shops = data.results?.shop || []
      totalCount = data.results?.results_available || 0
    } catch (e) {
      console.error('API Fetch Error:', e)
    }
  }

  // 3. 相対パスの解決
  // Honoの c.req.path を使うことで、/_sandbox/test07 等の階層を自動で維持します
  const baseUrl = c.req.path 

  return c.html(html`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>店舗検索 - Step 2</title>
      <style>
        body { font-family: sans-serif; margin: 0 auto; max-width: 800px; padding: 20px; color: #333; line-height: 1.6; }
        .search-form { background: #eee; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .input-group { margin-bottom: 10px; }
        input { padding: 8px; width: calc(50% - 20px); border: 1px solid #ccc; border-radius: 4px; }
        button { padding: 8px 20px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 4px; }
        .card { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; background: white; }
        .shop-name { font-weight: bold; font-size: 1.1rem; color: #000; }
        .pagination { margin-top: 20px; text-align: center; }
        .btn-page { display: inline-block; padding: 10px 20px; background: #f8f9fa; border: 1px solid #ccc; text-decoration: none; color: #333; border-radius: 4px; }
      </style>
    </head>
    <body>
      <h2>🍴 グルメ検索 (Step 2)</h2>
      
      <form class="search-form" method="get" action="">
        <div class="input-group">
          <input type="text" name="address" placeholder="エリア（例：銀座）" value="${address}">
          <input type="text" name="keyword" placeholder="キーワード（例：肉）" value="${keyword}">
          <button type="submit">検索</button>
        </div>
      </form>

      <div>
        <p>結果: ${totalCount}件中 ${shops.length}件表示</p>
        
        ${shops.map((shop) => html`
          <div class="card">
            <div class="shop-name">${shop.name}</div>
            <div style="font-size:0.85rem; color:#666;">📍 ${shop.address}</div>
            <div style="font-size:0.8rem; margin-top:5px;">✨ ${shop.catch || ''}</div>
          </div>
        `)}
      </div>

      <div class="pagination">
        ${shops.length === COUNT ? html`
          <a class="btn-page" href="${baseUrl}?address=${address}&keyword=${keyword}&page=${page + 1}">
            次の100件を表示
          </a>
        ` : ''}
      </div>
    </body>
    </html>
  `)
})
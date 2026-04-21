import { Hono } from 'hono'
import { html } from 'hono/html'
import { normalize } from '@geolonia/normalize-japanese-addresses'

export const test04 = new Hono()

test04.get('/', async (c) => {
  // 検証したい住所のリスト
  const sampleAddresses = [
    "東京都千代田区丸の内1-1",
    "東京都千代田区丸の内1（東京駅構内 1F）",
    "東京都北区田端1-1",
    "岩手県遠野市新町1-10", // 地方都市
    "和歌山県東牟婁郡串本町串本123", // 4文字の県名 + 郡
    "群馬県高崎市貝沢町1327-3"
  ];

  // 全ての住所を解析
  const results = await Promise.all(
    sampleAddresses.map(async (addr) => {
      const normalized = await normalize(addr);
      return { original: addr, normalized };
    })
  );

  return c.html(html`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>住所解析テスト</title>
      <style>
        body { font-family: sans-serif; font-size: 0.8rem; padding: 20px; background: #f4f7f6; }
        .card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        pre { background: #2d2d2d; color: #ccc; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .label { font-weight: bold; color: #007aff; }
      </style>
    </head>
    <body>
      <h3>📍 住所解析アルゴリズム検証 (Geolonia)</h3>
      <p>ライブラリが住所文字列をどのように構造化するかをテストします。</p>

      ${results.map(res => html`
        <div class="card">
          <div class="label">元の住所:</div>
          <p>${res.original}</p>
          <div class="label">解析結果 (JSON):</div>
          <pre>${JSON.stringify(res.normalized, null, 2)}</pre>
        </div>
      `)}

      <hr>
      <p style="color: #666;">
        ※「岩手県」や「和歌山県」のような県名の長さの違いや、<br>
        「市区町村」の切り出しが正確に行われているか確認してください。
      </p>
    </body>
    </html>
  `);
})
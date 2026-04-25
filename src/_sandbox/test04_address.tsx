import { Hono } from 'hono'
import { html } from 'hono/html'
import { normalize } from '@geolonia/normalize-japanese-addresses'

export const test04 = new Hono()

test04.get('/', async (c) => {
  const sampleAddresses = [
    "東京都中央区銀座3-7-14ＥＳＫビル1F", // ターゲット事例
    "東京都千代田区丸の内1-1",            // 数字を含む町名
    "東京都千代田区丸の内1（東京駅構内 1F）", // 補足情報あり
    "東京都北区田端1-1",                  // 短い区名
    "岩手県遠野市新町1-10",               // 地方都市
    "和歌山県東牟婁郡串本町串本123",        // 郡部
    "群馬県高崎市貝沢町1327-3",            // 4文字の町名
    "京都府京都市中京区一之船入町537-4"      // 政令指定都市の区
  ];

  const results = await Promise.all(
    sampleAddresses.map(async (addr) => {
      const normalized = await normalize(addr);
      // City と Town を結合（今回のアルゴリズムの本質）
      const simplified = (normalized.city || '') + (normalized.town || '');
      return { original: addr, normalized, simplified };
    })
  );

  return c.html(html`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>住所簡略化テスト</title>
      <style>
        body { font-family: -apple-system, sans-serif; line-height: 1.6; padding: 20px; background: #f0f2f5; color: #333; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 20px; border: 1px solid #e1e4e8; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .badge { background: #e7f3ff; color: #007aff; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }
        .original { font-size: 0.85rem; color: #666; margin-bottom: 8px; }
        .result-box { background: #f8f9fa; border: 2px dashed #007aff; padding: 15px; border-radius: 8px; text-align: center; margin: 10px 0; }
        .simplified { font-size: 1.5rem; font-weight: bold; color: #1d1d1f; letter-spacing: 0.05em; }
        .details { font-size: 0.75rem; color: #888; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; }
        .detail-item b { color: #333; display: block; }
        h2 { color: #1d1d1f; border-left: 5px solid #007aff; padding-left: 15px; margin-bottom: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>📍 住所表示の簡略化検証</h2>
        <p style="margin-bottom: 20px; font-size: 0.9rem;">
          都道府県と番地を除去し、<b>「市区町村＋町域名」</b>のみを抽出するテストです。
        </p>

        ${results.map(res => html`
          <div class="card">
            <div class="header">
              <div class="original">入力: ${res.original}</div>
              <span class="badge">Success</span>
            </div>
            
            <div class="result-box">
              <div style="font-size: 0.7rem; color: #007aff; margin-bottom: 5px;">抽出結果</div>
              <div class="simplified">${res.simplified}</div>
            </div>

            <div class="details">
              <div class="detail-item"><b>都道府県</b> ${res.normalized.pref}</div>
              <div class="detail-item"><b>市区町村</b> ${res.normalized.city}</div>
              <div class="detail-item"><b>町域名</b> ${res.normalized.town}</div>
            </div>
          </div>
        `)}

        <div style="text-align: center; color: #888; font-size: 0.8rem; margin-top: 40px;">
          @geolonia/normalize-japanese-addresses engine
        </div>
      </div>
    </body>
    </html>
  `);
})
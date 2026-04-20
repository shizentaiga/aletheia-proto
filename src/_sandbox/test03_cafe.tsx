import { Hono } from 'hono'
import { html } from 'hono/html'

/**
 * 【 ALETHEIA - Drill-down Discovery Prototype 】
 * 役割: 階層型チップス選択による地点到達の効率化検証。
 * 検証: 日本 ＞ 関東 ＞ 東京 ＞ 総武線 ＞ 小岩駅 への動線。
 */

type Bindings = { ALETHEIA_PROTO_DB: D1Database }
export const test03 = new Hono<{ Bindings: Bindings }>()

test03.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB;

  // クエリパラメータから現在の階層を取得（シミュレーション用）
  const step = c.req.query('step') || '0'; // 0:広域, 1:路線, 2:駅詳細

  try {
    // ステップに応じて取得データを変える（今はスタバで代用）
    const { results } = await db.prepare(`SELECT title, address FROM services LIMIT 50`).all();

    return c.html(html`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>ALETHEIA - Discovery</title>
        <style>
          body { font-family: -apple-system, sans-serif; margin: 0; background: #fff; color: #333; font-size: 14px; }
          
          /* ヘッダー：パンくずリスト的に現在の位置を表示 */
          header { position: sticky; top: 0; background: #fff; z-index: 100; border-bottom: 1px solid #eee; }
          .breadcrumb { padding: 8px 12px; font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.05em; }
          
          /* チップス・コンテナ：横スクロール可能 */
          .nav-scroll { 
            display: flex; overflow-x: auto; padding: 0 12px 12px; gap: 8px; 
            -webkit-overflow-scrolling: touch;
          }
          .nav-scroll::-webkit-scrollbar { display: none; }

          .chip { 
            white-space: nowrap; padding: 6px 14px; border-radius: 20px; 
            background: #f0f0f0; border: 1px solid #e0e0e0; color: #666;
            font-size: 13px; cursor: pointer; text-decoration: none;
          }
          .chip.active { background: #007bff; color: #fff; border-color: #0056b3; }
          .chip.next { background: #fff; border: 1.5px dashed #007bff; color: #007bff; font-weight: bold; }

          /* リスト部：高密度設定 */
          .row { 
            display: flex; align-items: center; padding: 6px 12px; 
            border-bottom: 0.5px solid #eee; gap: 10px;
          }
          .info { flex: 1; min-width: 0; }
          .name { display: block; font-weight: bold; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .addr { display: block; font-size: 11px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .fav { border: none; background: none; font-size: 18px; color: #ddd; padding: 0 4px; }
        </style>
      </head>
      <body>
        <header>
          <div class="breadcrumb">Japan > Kanto > Tokyo</div>
          <div class="nav-scroll">
            ${step === '0' ? html`
              <a href="?step=1" class="chip active">総武線</a>
              <a href="#" class="chip">山手線</a>
              <a href="#" class="chip">京葉線</a>
              <a href="#" class="chip">東西線</a>
            ` : step === '1' ? html`
              <a href="?step=0" class="chip">← 路線選択</a>
              <a href="?step=2" class="chip active">小岩駅</a>
              <a href="#" class="chip">新小岩駅</a>
              <a href="#" class="chip">市川駅</a>
              <a href="#" class="chip">錦糸町駅</a>
            ` : html`
              <a href="?step=1" class="chip">← 駅選択</a>
              <span class="chip active">小岩駅周辺</span>
              <span class="chip next">+ 北口</span>
              <span class="chip next">+ 南口</span>
              <span class="chip next">+ Wi-Fi</span>
            `}
          </div>
        </header>

        <main>
          <div style="padding: 8px 12px; font-size: 11px; color: #999; background: #fafafa;">
            ${step === '2' ? '小岩駅周辺の50件を表示中' : '候補地点を表示中'}
          </div>
          ${results.map(row => html`
            <div class="row">
              <div style="font-size: 10px; color: #007bff; width: 15px;">↗</div>
              <div class="info">
                <span class="name">${row.title}</span>
                <span class="addr">${row.address}</span>
              </div>
              <button class="fav">☆</button>
            </div>
          `)}
        </main>
      </body>
      </html>
    `);
  } catch (e) {
    return c.text(`Error: ${e}`);
  }
});
import { Hono } from 'hono'
import { html } from 'hono/html'

/**
 * 【 ALETHEIA - D1 Database Inspector (Debug Tool) 】
 * 表示制限: パフォーマンス保護のため、各テーブル最大1000件まで表示。
 * 役割: Cloudflare D1上の各テーブルの最新データをWebブラウザから一覧確認するためのデバッグ用エンドポイント。
 * 特徴: スキーマ変更に依存しない動的レンダリング（Object.keys/values）を採用。
 * 改善: 大量データ閲覧用にスクロール領域とヘッダー固定を実装。
 */

type Bindings = { ALETHEIA_PROTO_DB: D1Database }
export const test02 = new Hono<{ Bindings: Bindings }>()

// --- 1. インスペクター・メイン画面 ---
test02.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB;
  const tables = ['access_plans', 'users', 'brands', 'categories', 'services'];

  try {
    const data = await Promise.all(
      tables.map(async (t) => {
        const { results } = await db.prepare(`SELECT * FROM ${t} LIMIT 1000`).all();
        return { table: t, rows: results };
      })
    );

    return c.html(html`
      <style>
        body { font-family: sans-serif; font-size: 0.8rem; background: #f4f4f4; padding: 15px; color: #333; margin: 0; }
        h3 { margin-top: 0; }
        
        /* テーブルを囲むセクションの装飾 */
        section { background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 25px; padding: 15px; }
        h4 { margin: 0 0 12px; color: #007bff; border-left: 4px solid #007bff; padding-left: 10px; font-size: 1rem; }

        /* スクロールコンテナの改善：高さを固定し、縦横にスクロール可能にする */
        .table-container { 
          max-height: 400px; /* ボックスの高さを制限 */
          overflow: auto;    /* 縦横両方のスクロールを許可 */
          border: 1px solid #eee;
          position: relative;
        }

        table { width: 100%; border-collapse: separate; border-spacing: 0; }
        
        /* ヘッダーの固定設定 */
        th { 
          position: sticky; 
          top: 0; 
          background: #f8f9fa; 
          z-index: 10; 
          border-bottom: 2px solid #dee2e6;
          box-shadow: 0 1px 0 rgba(0,0,0,0.05); /* 境界線を強調 */
        }

        th, td { border: 1px solid #eee; padding: 10px; text-align: left; white-space: nowrap; }
        tr:nth-child(even) { background: #fafafa; }
        tr:hover { background: #f1f7ff; } /* ホバーで行を強調 */
        
        .empty { color: #999; font-style: italic; padding: 20px; text-align: center; }
        .row-count { font-size: 0.7rem; color: #666; font-weight: normal; margin-left: 10px; }
      </style>

      <body>
        <h3>🧪 ALETHEIA: DB Inspector</h3>
        
        ${data.map(res => html`
          <section>
            <h4>
              ${res.table} 
              <span class="row-count">(${res.rows.length} rows visible)</span>
            </h4>
            
            ${res.rows.length === 0 ? html`<p class="empty">No data available.</p>` : html`
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      ${Object.keys(res.rows[0]).map(k => html`<th>${k}</th>`)}
                    </tr>
                  </thead>
                  <tbody>
                    ${res.rows.map(row => html`
                      <tr>${Object.values(row).map(v => html`<td>${v === null ? html`<span style="color:#ccc;">null</span>` : v}</td>`)}</tr>
                    `)}
                  </tbody>
                </table>
              </div>
            `}
          </section>
        `)}
        
        <p style="margin-bottom: 30px;">
          <a href="/_sandbox/test02/raw" style="text-decoration:none; color:#007bff;">&rarr; User Raw Data (JSON)</a>
        </p>
      </body>
    `);
  } catch (e) {
    return c.text(`DB Error: ${String(e)}`, 500);
  }
});

// --- 2. 生データ確認用 API ---
test02.get('/raw', async (c) => {
  const { results } = await c.env.ALETHEIA_PROTO_DB.prepare('SELECT * FROM users').all();
  return c.json(results);
});
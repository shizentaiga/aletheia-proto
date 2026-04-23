import { Hono } from 'hono'
import { html } from 'hono/html'

type Bindings = { ALETHEIA_PROTO_DB: D1Database }
export const test06 = new Hono<{ Bindings: Bindings }>()

const LIMIT = 100;

test06.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB;
  
  // 1. パラメータ取得
  const q = c.req.query('q') || '';
  const offset = parseInt(c.req.query('offset') || '0', 10);

  // 2. クエリビルド
  let whereClause = "WHERE deleted_at IS NULL";
  let params: any[] = [];
  
  if (q) {
    whereClause += " AND (title LIKE ? OR address LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }

  try {
    // 3. データ取得 (LIMIT & OFFSET)
    const { results } = await db.prepare(`
      SELECT title, address 
      FROM services 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(...params, LIMIT, offset).all();

    // 4. 総件数取得 (次があるかどうかの判定用)
    const { total } = await db.prepare(`
      SELECT COUNT(*) as total FROM services ${whereClause}
    `).bind(...params).first<{ total: number }>() || { total: 0 };

    const hasNext = offset + LIMIT < total;

    return c.html(html`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <title>Test06: 100件検証</title>
        <style>
          body { font-family: sans-serif; padding: 20px; background: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          .item { padding: 10px; border-bottom: 1px solid #eee; }
          .nav { margin-top: 20px; display: flex; justify-content: space-between; }
          .btn { padding: 10px 20px; background: #007aff; color: white; text-decoration: none; border-radius: 5px; }
          .info { color: #666; font-size: 0.9rem; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h3>Cafe Search Test</h3>
          
          <form method="GET" style="margin-bottom: 20px;">
            <input type="text" name="q" value="${q}" placeholder="キーワード...">
            <button type="submit">検索</button>
          </form>

          <div class="info">
            全 ${total.toLocaleString()} 件中 
            ${offset + 1} 〜 ${Math.min(offset + LIMIT, total)} 件目を表示
          </div>

          <div class="list">
            ${results.map(row => html`
              <div class="item">
                <strong>${row.title}</strong><br>
                <small>${row.address}</small>
              </div>
            `)}
          </div>

          <div class="nav">
            ${offset > 0 
              ? html`<a href="?q=${q}&offset=${offset - LIMIT}" class="btn">前へ</a>`
              : html`<span></span>`}
            
            ${hasNext 
              ? html`<a href="?q=${q}&offset=${offset + LIMIT}" class="btn">次の100件を表示</a>`
              : html`<span></span>`}
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (e) {
    return c.text(`Error: ${e}`);
  }
});
/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'

type Bindings = { ALETHEIA_PROTO_DB: D1Database }
export const test06 = new Hono<{ Bindings: Bindings }>()

const LIMIT = 10; // 検証しやすくするため件数を絞っています

test06.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB;
  
  const q = c.req.query('q') || '';
  const region = c.req.query('region') || 'all';
  const offset = parseInt(c.req.query('offset') || '0', 10);
  const isHtmx = c.req.header('HX-Request') === 'true';

  // 1. クエリビルド (本番に近い region フィルタもどきを追加)
  let whereClause = "WHERE deleted_at IS NULL";
  let params: any[] = [];
  if (q) {
    whereClause += " AND (title LIKE ? OR address LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }

  try {
    const { results } = await db.prepare(`
      SELECT title, address FROM services 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(...params, LIMIT, offset).all();

    const { total } = await db.prepare(`
      SELECT COUNT(*) as total FROM services ${whereClause}
    `).bind(...params).first<{ total: number }>() || { total: 0 };

    const hasNext = offset + results.length < total;
    const nextOffset = offset + results.length;

    // --- HTMX 部分更新 (本番の /search エンドポイント相当) ---
    if (isHtmx) {
      return c.html(
        <>
          {/* OOB: ヘッダー更新 */}
          <div id="info-display" hx-swap-oob="true">
            全 {total.toLocaleString()} 件 / {offset + results.length} 件表示中 (Region: {region})
          </div>

          {/* カードリスト (hx-select で抽出される対象) */}
          <div id="list-items">
            {results.map((row: any) => (
              <div style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                <strong>{row.title}</strong><br/>
                <small>{row.address}</small>
              </div>
            ))}
          </div>

          {/* OOB: ボタンエリア更新 */}
          <div id="nav-area" hx-swap-oob="true">
            {hasNext ? (
              <button 
                className="btn"
                hx-get={`/_sandbox/test06?q=${q}&region=${region}&offset=${nextOffset}`}
                hx-target="#list-items"
                hx-swap="beforeend"
                hx-select="#list-items > *"
              >
                さらに表示
              </button>
            ) : (
              <p>完了</p>
            )}
          </div>
        </>
      );
    }

    // --- 初期レンダリング (本番の Top.tsx + renderer 相当) ---
    return c.html(
      <html lang="ja">
        <head>
          <meta charset="UTF-8" />
          <title>Debug test06 (JSX)</title>
          <script src="https://unpkg.com/htmx.org@1.9.12"></script>
          <style>{`
            body { font-family: sans-serif; padding: 20px; }
            .container { max-width: 500px; margin: 0 auto; border: 1px solid #ccc; padding: 15px; }
            .btn { width: 100%; padding: 10px; background: #007aff; color: white; border: none; cursor: pointer; }
          `}</style>
        </head>
        <body>
          <div className="container">
            {/* SearchSection 相当のフォーム */}
            <div id="search-section" style={{ marginBottom: '20px' }}>
              <select id="region-select" name="region" hx-get="/_sandbox/test06" hx-target="#list-container" hx-include="[name='q']">
                <option value="all">全国</option>
                <option value="tokyo">東京</option>
              </select>
              <form hx-get="/_sandbox/test06" hx-target="#list-container" hx-include="#region-select">
                <input type="text" name="q" value={q} placeholder="検索..." />
                <button type="submit">Go</button>
              </form>
            </div>

            {/* Top.tsx のリスト外枠相当 */}
            <div id="list-container">
              <div id="info-display">全 {total} 件表示中</div>
              
              <div id="list-items" style={{ minHeight: '100px', background: '#fff' }}>
                {results.map((row: any) => (
                  <div style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    <strong>{row.title}</strong><br/><small>{row.address}</small>
                  </div>
                ))}
              </div>

              <div id="nav-area" style={{ marginTop: '10px' }}>
                {hasNext && (
                  <button 
                    className="btn"
                    hx-get={`/_sandbox/test06?q=${q}&region=${region}&offset=${nextOffset}`}
                    hx-target="#list-items"
                    hx-swap="beforeend"
                    hx-select="#list-items > *"
                  >
                    さらに表示
                  </button>
                )}
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  } catch (e) {
    return c.text(`Error: ${e}`);
  }
});
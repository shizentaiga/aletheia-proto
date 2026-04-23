/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'

type Bindings = { ALETHEIA_PROTO_DB: D1Database }
export const test06 = new Hono<{ Bindings: Bindings }>()

const LIMIT = 10;

// --- コンポーネント: 1つの「塊（Block）」を定義 ---
// これが 1-10, 11-20... という単位の塊になります
const ListBlock = ({ results, nextOffset, q, region, hasNext }: any) => (
  <div className="list-block">
    {/* 1. データの表示 */}
    {results.map((row: any) => (
      <div style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
        <strong>{row.title}</strong><br/>
        <small>{row.address}</small>
      </div>
    ))}

    {/* 2. 次の塊を呼び出すボタン（ボタン自身が次の塊に置き換わる） */}
    <div className="nav-area" style={{ marginTop: '10px' }}>
      {hasNext ? (
        <button 
          className="btn"
          hx-get={`/_sandbox/test06?q=${q}&region=${region}&offset=${nextOffset}`}
          hx-target="closest .nav-area" 
          hx-swap="outerHTML" // 👈 重要：このボタンエリア自体が、次の ListBlock に丸ごと入れ替わる
        >
          さらに表示
        </button>
      ) : (
        <p style={{ textAlign: 'center', color: '#999' }}>すべてのデータを読み込みました</p>
      )}
    </div>
  </div>
);

test06.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB;
  const q = c.req.query('q') || '';
  const region = c.req.query('region') || 'all';
  const offset = parseInt(c.req.query('offset') || '0', 10);
  const isHtmx = c.req.header('HX-Request') === 'true';

  // --- データ取得ロジック ---
  let whereClause = "WHERE deleted_at IS NULL";
  let params: any[] = [];
  if (q) {
    whereClause += " AND (title LIKE ? OR address LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }

  const { results } = await db.prepare(`
    SELECT title, address FROM services ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).bind(...params, LIMIT, offset).all();

  const { total } = await db.prepare(`
    SELECT COUNT(*) as total FROM services ${whereClause}
  `).bind(...params).first<{ total: number }>() || { total: 0 };

  const hasNext = offset + results.length < total;
  const nextOffset = offset + results.length;

  // --- レスポンス生成 ---

  // 追加読み込み時 (HTMX)
  if (isHtmx) {
    return c.html(
      <ListBlock results={results} nextOffset={nextOffset} q={q} region={region} hasNext={hasNext} />
    );
  }

  // 初期表示時
  return c.html(
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <script src="https://unpkg.com/htmx.org@1.9.12"></script>
        <style>{`
          body { font-family: sans-serif; background: #f4f4f4; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .btn { width: 100%; padding: 12px; background: #007aff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
          input { width: 70%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
        `}</style>
      </head>
      <body>
        <div className="container">
          {/* 検索フォーム：ここを押すとリスト全体がリセットされる */}
          <form hx-get="/_sandbox/test06" hx-target="#main-list" style={{ marginBottom: '20px' }}>
            <input type="text" name="q" value={q} placeholder="検索ワード..." />
            <button type="submit" style={{ width: '25%', marginLeft: '2%' }}>検索</button>
          </form>

          {/* メインリスト表示エリア */}
          <div id="main-list">
            <div style={{ color: '#666', marginBottom: '10px' }}>全 {total} 件</div>
            <ListBlock results={results} nextOffset={nextOffset} q={q} region={region} hasNext={hasNext} />
          </div>
        </div>
      </body>
    </html>
  );
});
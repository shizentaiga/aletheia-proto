/**
 * =============================================================================
 * 【 ALETHEIA - D1 Smart Inspector (DB Search with Total Count) 】
 * =============================================================================
 * 改善: 読み込んだ中からのフィルタではなく、D1へ直接検索クエリを発行。
 * 特徴: 
 * 1. 検索実行時、COUNT(*) OVER() により、LIMIT制限前の「総ヒット件数」を同時に取得。
 * 2. サーバーエラー回避のため、各テーブルのスキーマに合わせた動的クエリ生成。
 * 3. 表示件数と実件数の差を可視化し、デバッグの精度を向上。
 * 4. HTMX導入により、スクロール位置を維持したまま部分更新が可能。
 * 5. 時刻表示: DBのUTCデータを環境に依存せずJST(日本時間)へ変換して表示。
 * =============================================================================
 */

import { Hono } from 'hono'
import { html } from 'hono/html'

// -----------------------------------------------------------------------------
// 1. 設定 & 共通ロジック
// -----------------------------------------------------------------------------

const CONFIG = {
  TABLES: [
    'access_plans', 'users', 'transport_nodes', 
    'brands', 'categories', 'services', 
    'service_cafe_details', 'user_activities'
  ],
  PAGE_LIMIT: 100,
} as const;

// 日本語マップ
const COLUMN_MAP: Record<string, string> = {
  user_id: 'ユーザーID', display_name: '表示名', title: '名称', address: '住所',
  name: '名称', address_prefix: '地域', line_name: '路線', email: 'メール',
};

// フォーマッタ
const LABEL_FORMATTER = (key: string, value: any) => {
  if (value === null || value === undefined) return null;
  if (key === 'total_count_internal') return null; // 内部用カラムなので非表示
  if (key.startsWith('has_') || typeof value === 'boolean') return value ? '✅ 有' : 'ー';

  // 日時関連のカラム（_at で終わる、または created_at / updated_at）を日本時間へ変換
  if (key.endsWith('_at') || key === 'created_at' || key === 'updated_at') {
    try {
      // 1. 文字列の場合は SQLite の形式 "YYYY-MM-DD HH:MM:SS" を ISO形式へ変換し UTC(Z) を付与
      // 2. 数値の場合は Unixタイムスタンプ（秒）として扱う
      const date = typeof value === 'number' 
        ? new Date(value * 1000) 
        : new Date(String(value).replace(' ', 'T') + 'Z');

      // 実行環境（Local/Cloudflare）に関わらず日本時間でフォーマット
      return new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }).format(date);
    } catch (e) {
      return value; // 変換失敗時は生データを返す
    }
  }

  return value;
};

// -----------------------------------------------------------------------------
// 2. デザイン (CSS & HTMX Script)
// -----------------------------------------------------------------------------

const head = html`
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <style>
    body { font-family: sans-serif; font-size: 0.75rem; background: #f0f2f5; padding: 20px; color: #333; }
    section { background: #fff; border-radius: 6px; padding: 15px; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h4 { margin: 0 0 12px; color: #2c3e50; border-left: 4px solid #2c3e50; padding-left: 10px; display: flex; justify-content: space-between; align-items: center; }
    
    .search-form { display: flex; gap: 8px; margin-bottom: 15px; }
    .search-input { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    .search-btn { background: #3498db; color: #fff; border: none; padding: 0 15px; border-radius: 4px; cursor: pointer; font-weight: bold; }
    .search-btn:hover { background: #2980b9; }

    .table-container { max-height: 400px; overflow: auto; border: 1px solid #e1e4e8; }
    table { width: 100%; border-collapse: collapse; }
    th { position: sticky; top: 0; background: #f8f9fa; border-bottom: 2px solid #ddd; padding: 8px; text-align: left; z-index: 5; }
    td { border-bottom: 1px solid #eee; padding: 8px; white-space: nowrap; }
    tr:hover { background: #f1f9ff; }
    
    .col-ja { display: block; font-size: 0.6rem; color: #3498db; font-weight: bold; }
    .null-val { color: #ccc; font-style: italic; }
    .err-msg { color: #e74c3c; font-size: 0.7rem; background: #fdf2f2; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
    .count-badge { font-size: 0.7rem; font-weight: normal; background: #eee; padding: 2px 6px; border-radius: 10px; color: #666; }
    .count-highlight { color: #3498db; font-weight: bold; }
    .htmx-request { opacity: 0.6; }
  </style>
`;

// -----------------------------------------------------------------------------
// 3. 部分更新用コンポーネント
// -----------------------------------------------------------------------------

const TableSection = (res: any) => html`
  <section id="section-${res.table}">
    <h4>
      <div>${res.table}</div>
      <div class="count-badge">
        表示: <span class="count-highlight">${res.rows.length}</span> / 総数: <span class="count-highlight">${res.totalCount}</span> 件
      </div>
    </h4>
    
    <form class="search-form" 
          hx-get="/_sandbox/test02" 
          hx-target="#section-${res.table}" 
          hx-swap="outerHTML" 
          hx-trigger="submit, keyup[enter] from:input">
      <input type="text" 
             name="q_${res.table}" 
             class="search-input" 
             value="${res.query}" 
             placeholder="${res.table} 内を検索（住所、名称など）...">
      <button type="submit" class="search-btn">検索</button>
      ${res.query ? html`
        <button hx-get="/_sandbox/test02" 
                hx-target="#section-${res.table}" 
                hx-swap="outerHTML" 
                style="font-size:0.6rem; border:none; background:none; color:#3498db; cursor:pointer; margin-left:5px;">クリア</button>
      ` : ''}
    </form>

    ${res.error ? html`<div class="err-msg">SQL Error: ${res.error}</div>` : ''}

    ${res.rows.length > 0 ? html`
      <div class="table-container">
        <table>
          <thead>
            <tr>
              ${Object.keys(res.rows[0]).filter(k => k !== 'total_count_internal').map(k => html`
                <th>
                  <span class="col-ja">${COLUMN_MAP[k] || ''}</span>
                  ${k}
                </th>
              `)}
            </tr>
          </thead>
          <tbody>
            ${res.rows.map((row: any) => html`
              <tr>
                ${Object.entries(row).filter(([k]) => k !== 'total_count_internal').map(([k, v]) => html`
                  <td>${LABEL_FORMATTER(k, v) ?? html`<span class="null-val">null</span>`}</td>
                `)}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    ` : html`<p style="padding:20px; color:#999;">該当データなし</p>`}
  </section>
`;

// -----------------------------------------------------------------------------
// 4. ルーティング & ロジック
// -----------------------------------------------------------------------------

type Bindings = { ALETHEIA_PROTO_DB: D1Database }
export const test02 = new Hono<{ Bindings: Bindings }>()

test02.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB;
  const searchParams = c.req.query();
  const htmxTarget = c.req.header('HX-Target');

  const data = await Promise.all(
    CONFIG.TABLES.map(async (t) => {
      const queryWord = searchParams[`q_${t}`] || '';
      
      // HTMXリクエスト時は対象テーブル以外はスキップ
      if (htmxTarget && htmxTarget !== `section-${t}`) return null;

      let sql = `SELECT *, COUNT(*) OVER() as total_count_internal FROM ${t}`;
      let params: string[] = [];

      if (queryWord) {
        const kw = `%${queryWord}%`;
        if (t === 'services') {
          sql += ` WHERE title LIKE ? OR address LIKE ?`;
          params = [kw, kw];
        } else if (t === 'transport_nodes') {
          sql += ` WHERE name LIKE ? OR address_prefix LIKE ? OR line_name LIKE ?`;
          params = [kw, kw, kw];
        } else if (t === 'users') {
          sql += ` WHERE display_name LIKE ? OR email LIKE ? OR google_id LIKE ?`;
          params = [kw, kw, kw];
        } else if (t === 'brands' || t === 'categories') {
          sql += ` WHERE name LIKE ? OR ${t === 'categories' ? 'display_name' : 'brand_id'} LIKE ?`;
          params = [kw, kw];
        } else if (t === 'access_plans') {
          sql += ` WHERE display_name LIKE ? OR plan_id LIKE ?`;
          params = [kw, kw];
        } else {
          sql += ` WHERE rowid LIKE ?`;
          params = [kw];
        }
      }

      sql += ` LIMIT ${CONFIG.PAGE_LIMIT}`;

      try {
        const { results } = await db.prepare(sql).bind(...params).all();
        const rows = (results || []) as Record<string, any>[];
        const totalCount = rows.length > 0 ? rows[0].total_count_internal : 0;
        
        return { table: t, rows, totalCount, query: queryWord, error: null };
      } catch (e) {
        return { table: t, rows: [], totalCount: 0, query: queryWord, error: String(e) };
      }
    })
  );

  // HTMXリクエストの場合は、対象のセクションのみ返却
  if (htmxTarget) {
    const targetData = data.find(d => d !== null);
    return c.html(targetData ? TableSection(targetData) : html``);
  }

  // 初回読み込み
  return c.html(html`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>ALETHEIA D1 Smart Inspector</title>
      ${head}
    </head>
    <body>
      <h3>🧪 ALETHEIA: DB Inspector (HTMX Mode)</h3>
      <p style="color:#666; margin-bottom: 20px;">※検索してもページ全体はリロードされません。快適にDBを探索できます。</p>
      ${data.map(res => res ? TableSection(res) : '')}
    </body>
    </html>
  `);
});
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
    'services', // カフェ本体。ここが最重要
    'transport_nodes', 
    'access_plans',
    'categories'
  ],
  PAGE_LIMIT: 200, // 調査用に少し多めに取得
} as const;

// 調査対象の都道府県リスト
const PREF_LIST = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "東京都", "神奈川県", "大阪府", "福岡県"];

const COLUMN_MAP: Record<string, string> = {
  title: '名称', address: '住所', address_prefix: '地域', name: '名称'
};

const LABEL_FORMATTER = (key: string, value: any) => {
  if (value === null || value === undefined) return html`<span class="null-val">null</span>`;
  if (key === 'total_count_internal') return null;
  
  // 文字列の末尾に不可視文字がないかチェックするための可視化
  if (typeof value === 'string' && (key === 'address' || key === 'address_prefix')) {
    const hasSpace = /^\s|\s$/.test(value);
    return html`${value}${hasSpace ? html`<span style="background:red;color:white;font-size:0.5rem">⚠️空白有</span>` : ''}`;
  }
  
  return value;
};

// -----------------------------------------------------------------------------
// 2. デザイン (CSS)
// -----------------------------------------------------------------------------

const head = html`
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <style>
    body { font-family: sans-serif; font-size: 0.75rem; background: #f4f7f6; padding: 20px; color: #333; }
    section { background: #fff; border-radius: 8px; padding: 15px; margin-bottom: 25px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    h3 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h4 { margin: 0 0 12px; display: flex; justify-content: space-between; align-items: center; }
    
    .diagnostic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; margin-bottom: 15px; }
    .diag-card { background: #ebf5fb; padding: 8px; border-radius: 4px; text-align: center; border: 1px solid #d6eaf8; }
    .diag-card.zero { background: #fdedec; border-color: #fadbd8; }
    .diag-num { display: block; font-size: 1.1rem; font-weight: bold; color: #2980b9; }
    .zero .diag-num { color: #e74c3c; }

    .table-container { max-height: 450px; overflow: auto; border: 1px solid #eee; }
    table { width: 100%; border-collapse: collapse; font-family: monospace; }
    th { position: sticky; top: 0; background: #34495e; color: white; padding: 8px; text-align: left; z-index: 10; }
    td { border-bottom: 1px solid #eee; padding: 6px 8px; }
    tr:nth-child(even) { background: #fafafa; }
    
    .search-form { display: flex; gap: 5px; margin-bottom: 10px; }
    .search-input { flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px; }
    .search-btn { background: #2c3e50; color: white; border: none; padding: 0 12px; border-radius: 4px; cursor: pointer; }
    .null-val { color: #ffa500; font-style: italic; font-weight: bold; }
  </style>
`;

// -----------------------------------------------------------------------------
// 3. ルーティング & ロジック
// -----------------------------------------------------------------------------

type Bindings = { ALETHEIA_PROTO_DB: D1Database }
export const test02 = new Hono<{ Bindings: Bindings }>()

test02.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB;
  const searchParams = c.req.query();
  const htmxTarget = c.req.header('HX-Target');

  // --- 切り分けロジック1: 都道府県別の記数統計を取得 ---
  const stats = await Promise.all(
    PREF_LIST.map(async (pref) => {
      const { results } = await db.prepare(
        `SELECT COUNT(*) as count FROM services WHERE address LIKE ?`
      ).bind(`${pref}%`).all();
      return { name: pref, count: results[0]?.count || 0 };
    })
  );

  // --- 切り分けロジック2: テーブルデータの取得 ---
  const data = await Promise.all(
    CONFIG.TABLES.map(async (t) => {
      const queryWord = searchParams[`q_${t}`] || '';
      if (htmxTarget && htmxTarget !== `section-${t}`) return null;

      let sql = `SELECT *, COUNT(*) OVER() as total_count_internal FROM ${t}`;
      let params: string[] = [];

      if (queryWord) {
        const kw = `%${queryWord}%`;
        if (t === 'services') {
          sql += ` WHERE address LIKE ? OR title LIKE ?`;
          params = [kw, kw];
        } else {
          sql += ` WHERE rowid LIKE ? OR (CASE WHEN EXISTS (SELECT 1 FROM pragma_table_info('${t}') WHERE name='name') THEN name ELSE '' END) LIKE ?`;
          params = [kw, kw];
        }
      } else {
        // デフォルトは「東北」や「北海道」が怪しいので、あえてそれらが含まれるデータを優先的に出す
        if (t === 'services') sql += ` ORDER BY CASE WHEN address LIKE '%道%' OR address LIKE '%県%' THEN 0 ELSE 1 END, address ASC`;
      }

      sql += ` LIMIT ${CONFIG.PAGE_LIMIT}`;

      try {
        const { results } = await db.prepare(sql).bind(...params).all();
        const rows = (results || []) as Record<string, any>[];
        const totalCount = rows.length > 0 ? (rows[0].total_count_internal as number) : 0;
        return { table: t, rows, totalCount, query: queryWord };
      } catch (e) {
        return { table: t, rows: [], totalCount: 0, query: queryWord, error: String(e) };
      }
    })
  );

  const renderSection = (res: any) => html`
    <section id="section-${res.table}">
      <h4>
        <div>Table: <strong>${res.table}</strong></div>
        <span style="font-size:0.7rem">取得: ${res.rows.length} / 全体件数: ${res.totalCount}</span>
      </h4>
      <form class="search-form" hx-get="/_sandbox/test02" hx-target="#section-${res.table}" hx-swap="outerHTML">
        <input type="text" name="q_${res.table}" class="search-input" value="${res.query}" placeholder="住所、名称で絞り込み（例: 北海道, 仙台市）">
        <button type="submit" class="search-btn">確認</button>
      </form>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              ${res.rows.length > 0 ? Object.keys(res.rows[0]).filter(k => k !== 'total_count_internal').map(k => html`
                <th>${COLUMN_MAP[k] || k}</th>
              `) : ''}
            </tr>
          </thead>
          <tbody>
            ${res.rows.map((row: any) => html`
              <tr>
                ${Object.entries(row).filter(([k]) => k !== 'total_count_internal').map(([k, v]) => html`
                  <td>${LABEL_FORMATTER(k, v)}</td>
                `)}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    </section>
  `;

  if (htmxTarget) {
    const targetData = data.find(d => d !== null);
    return c.html(targetData ? renderSection(targetData) : html``);
  }

  return c.html(html`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      ${head}
      <title>DB Diagnostic Inspector</title>
    </head>
    <body>
      <h3>🔍 不具合調査: データ存在確認パネル</h3>
      
      <section>
        <h4>📍 都道府県別データ登録状況 (servicesテーブル)</h4>
        <div class="diagnostic-grid">
          ${stats.map(s => html`
            <div class="diag-card ${s.count === 0 ? 'zero' : ''}">
              <span style="font-size:0.6rem">${s.name}</span>
              <span class="diag-num">${s.count}</span>
            </div>
          `)}
        </div>
        <p style="font-size:0.65rem; color:#666;">
          ※もし「北海道」が0件で、「北海」で検索してヒットする場合、DB内の住所文字列に余計な空白や改行が含まれている可能性があります。
        </p>
      </section>

      ${data.map(res => res ? renderSection(res) : '')}
      
      <section style="background:#fff3cd">
        <h4>🛠️ 切り分けのヒント</h4>
        <ul style="margin:0; padding-left:15px; font-size:0.7rem; line-height:1.5">
          <li><strong>統計が0件の場合:</strong> D1へのインポート自体に失敗しているか、WHERE句の条件（Like検索）がDBの形式と合っていません。</li>
          <li><strong>住所に赤いラベルが出る場合:</strong> データ末尾に不可視の空白があります。<code>trim()</code> 処理が必要です。</li>
          <li><strong>DBにはあるのに検索できない場合:</strong> 検索ロジック側の「広域エリア名（Kanto等）」の変換処理が「Tohoku」や「Hokkaido」に対応しているか確認してください。</li>
        </ul>
      </section>
    </body>
    </html>
  `);
});
import { Hono } from 'hono'
import { html } from 'hono/html'

type Bindings = {
  ALETHEIA_PROTO_DB: D1Database
  ENVIRONMENT?: string
}

export const test02 = new Hono<{ Bindings: Bindings }>()

/**
 * ==========================================================
 * 【 Test02: D1 Database 接続疎通確認 】
 * ==========================================================
 */

// --- A. 店舗一覧表示 (servicesテーブル) ---
// アクセス先: http://localhost:8787/_sandbox/test02
test02.get('/', async (c) => {
  const envName = c.env.ENVIRONMENT || 'development (local)';

  try {
    // 1. schema.sql で定義した services テーブルから全件取得
    const { results } = await c.env.ALETHEIA_PROTO_DB
      .prepare('SELECT * FROM services LIMIT 10')
      .all();

    // 2. 取得したデータをリスト形式でレンダリング
    return c.html(html`
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #333;">🧪 Test02: DB Connection Test</h2>
        <p>Environment: <strong>${envName}</strong></p>
        <hr>
        <h3>Services Table (Sample Data)</h3>
        ${results.length === 0 
          ? html`<p style="color: red;">⚠️ データが見つかりません。seed.sqlを実行しましたか？</p>` 
          : html`
            <div style="display: grid; gap: 10px;">
              ${results.map((item: any) => html`
                <div style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; background: #fff;">
                  <strong style="font-size: 1.1rem;">${item.title}</strong><br>
                  <small style="color: #666;">ID: ${item.id}</small><br>
                  <span style="display: inline-block; margin-top: 5px; padding: 2px 8px; background: #e0e0e0; border-radius: 4px; font-size: 0.8rem;">
                    ${item.station_context}
                  </span>
                </div>
              `)}
            </div>
          `
        }
        <hr>
      </div>
    `)
  } catch (e) {
    console.error("DB Error:", e);
    return c.html(html`
      <div style="color: red; padding: 20px; border: 2px solid red;">
        <h3>❌ データベース接続エラー</h3>
        <p>${String(e)}</p>
        <p><strong>確認事項:</strong></p>
        <ul>
          <li>wrangler.jsonc の Binding名が <code>ALETHEIA_PROTO_DB</code> か？</li>
          <li>ローカル実行なら <code>--local</code> を付けて <code>execute</code> したか？</li>
        </ul>
      </div>
    `, 500)
  }
})

// --- B. ユーザー生データ確認 (JSON) ---
// アクセス先: http://localhost:8787/_sandbox/test02/raw
test02.get('/raw', async (c) => {
  const { results } = await c.env.ALETHEIA_PROTO_DB.prepare('SELECT * FROM users').all();
  return c.json(results);
})
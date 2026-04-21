import { Hono } from 'hono'
import { html } from 'hono/html'

export const test05 = new Hono()

test05.get('/', (c) => {
  // Cloudflare Workers環境では、c.req.raw.cf から地理・接続情報を取得可能
  // ローカル開発環境（wrangler dev）でも一部シミュレートされます
  const cf = c.req.raw.cf as any 

  // 主要な情報の抽出
  const info = {
    ip: c.req.header('cf-connecting-ip') || 'unknown',
    colo: cf?.colo || 'unknown',          // データセンター（例: NRT = 成田）
    country: cf?.country || 'unknown',    // 国コード（例: JP）
    region: cf?.region || 'unknown',      // 都道府県コード（例: "Tokyo" または "13"）
    city: cf?.city || 'unknown',          // 市区町村
    asOrganization: cf?.asOrganization || 'unknown', // プロバイダ名
    uag: c.req.header('user-agent') || 'unknown',
    loc: cf?.country || 'unknown',
  }

  // デバッグ用ログ（wranglerのコンソールに出力）
  console.log('Access Info:', JSON.stringify(info, null, 2))

  return c.html(html`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>Cloudflare Trace Monitor</title>
      <style>
        body { font-family: monospace; background: #1a1a1a; color: #00ff00; padding: 20px; }
        .monitor { border: 1px solid #333; padding: 15px; border-radius: 5px; background: #000; }
        .item { margin-bottom: 5px; }
        .label { color: #888; }
        .value { color: #fff; }
        .debug-panel { margin-top: 20px; border-top: 1px dashed #444; padding-top: 10px; color: #ffadad; }
      </style>
    </head>
    <body>
      <h3>[ALETHEIA] CDN Trace Monitor</h3>
      <div class="monitor">
        <div class="item"><span class="label">IP: </span><span class="value">${info.ip}</span></div>
        <div class="item"><span class="label">COLO: </span><span class="value">${info.colo}</span></div>
        <div class="item"><span class="label">REGION: </span><span class="value">${info.region} (推定都道府県)</span></div>
        <div class="item"><span class="label">CITY: </span><span class="value">${info.city}</span></div>
        <div class="item"><span class="label">ISP: </span><span class="value">${info.asOrganization}</span></div>
      </div>

      <div class="debug-panel">
        <h4>デバッグモニター（不具合判定項目）</h4>
        <ul>
          ${!cf ? html`<li>⚠️ <strong>ERROR:</strong> Cloudflare CFオブジェクトが取得できていません。ローカル実行時は --remote モードを検討してください。</li>` : ''}
          ${info.region === 'unknown' ? html`<li>⚠️ <strong>WARN:</strong> 地域情報(Region)が特定できません。VPN利用中またはIPデータベース未登録の可能性があります。</li>` : ''}
          <li>INFO: COLOが 'NRT' なら成田、'KIX' なら関空経由です。</li>
          <li>INFO: 判定ロジック：cf.regionプロパティの値を参照しています。</li>
        </ul>
      </div>
    </body>
    </html>
  `)
})
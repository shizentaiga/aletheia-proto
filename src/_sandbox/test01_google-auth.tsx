import { Hono } from 'hono'
import { html } from 'hono/html'

type Bindings = {
  GOOGLE_CLIENT_ID: string
  BASE_URL: string
}

export const test01 = new Hono<{ Bindings: Bindings }>()

/**
 * ==========================================================
 * 【 Test01: Google Auth UI 疎通確認 】
 * ==========================================================
 */

// --- A. ログインボタン設置画面 ---
// http://localhost:8787/_sandbox/test01/
test01.get('/', (c) => {
  return c.html(html`
    <div style="font-family: sans-serif; padding: 40px; text-align: center;">
      <h2 style="color: #333;">ALETHEIA Auth Test</h2>
      <p style="color: #666; margin-bottom: 30px;">
        ボタンを押して Google 認証フロー（擬似）を開始します
      </p>
      
      <a href="/_sandbox/test01/google-mock" style="
        display: inline-flex;
        align-items: center;
        padding: 10px 24px;
        background-color: #ffffff;
        border: 1px solid #dadce0;
        border-radius: 4px;
        color: #3c4043;
        text-decoration: none;
        font-weight: 500;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      ">
        <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" style="margin-right: 10px;">
        Google でサインイン
      </a>

      <div style="margin-top: 40px; font-size: 0.8rem; color: #999;">
        <p>※現在はリダイレクトURL制限を考慮し、<br>実際のGoogle通信を除外した「モック画面」へ遷移します。</p>
        <p>設定完了後は <code>googleAuth()</code> ミドルウェアを適用します。</p>
      </div>
    </div>
  `)
})

// --- B. 認証成功の擬似画面（モック） ---
test01.get('/google-mock', (c) => {
  return c.html(html`
    <div style="font-family: sans-serif; padding: 40px;">
      <h1 style="color: #4285F4;">✅ 認証フローの疎通成功</h1>
      <p>この画面が表示されていれば、<strong>サンドボックス内のルーティング</strong>は正常です。</p>
      <hr>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #4285F4;">
        <p><strong>Next Step:</strong></p>
        <ol>
          <li>Google Cloud Console でリダイレクトURLを許可</li>
          <li><code>BASE_URL</code> 環境変数を <code>wrangler.jsonc</code> に設定</li>
          <li>実際の <code>googleAuth</code> ミドルウェアを有効化</li>
        </ol>
      </div>
    </div>
  `)
})
import { Hono } from 'hono'
import { html } from 'hono/html'

type Bindings = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string // 後半のステップで使用
  BASE_URL: string 
}

export const test01 = new Hono<{ Bindings: Bindings }>()

/**
 * 1. 認証開始 (Googleのログイン画面へ)
 * ユーザーを Google Auth サーバーへリダイレクトします。
 */
test01.get('/auth/google', (c) => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
  
  // 【修正ポイント】c.env.BASE_URL に頼らず、現在のリクエストURLから Origin を取得
  // これにより、localhost でも本番ドメインでも動的に正しいURIが生成されます。
  const origin = new URL(c.req.url).origin
  const redirectUri = `${origin}/_sandbox/test01/auth/google/callback`
  
  const options = {
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    // 成功コードに倣い、スペース区切りの文字列として指定
    scope: 'openid email profile',
    access_type: 'offline',
    // 確実にアカウント選択画面を出すための設定
    prompt: 'select_account',
  }
  
  const qs = new URLSearchParams(options).toString()
  return c.redirect(`${rootUrl}?${qs}`)
})

/**
 * 2. コールバック受取
 * Google での認証後、ブラウザが戻ってくる場所です。
 */
test01.get('/auth/google/callback', async (c) => {
  // URLクエリパラメータから 認可コード(code) を抽出
  const code = c.req.query('code')
  const error = c.req.query('error')
  
  if (error) return c.text(`Google Auth Error: ${error}`, 400)
  if (!code) return c.text('認証コード(code)の取得に失敗しました', 400)

  // 【本日のゴール】Googleから認可コードを持って戻ってこれたことを確認
  return c.html(html`
    <div style="font-family: sans-serif; padding: 40px;">
      <h1 style="color: #4285F4;">✅ 疎通成功！</h1>
      <p style="color: #555;">Googleからの帰還を確認しました。認証コード（code）が正常に発行されています：</p>
      <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; word-break: break-all; border: 1px solid #ddd; font-family: monospace;">
        ${code}
      </div>
      <p style="margin-top: 20px; font-size: 0.9rem; color: #666;">
        ※この <code>code</code> は、Googleからユーザー情報を引き出すための「一時的な引換券」です。
      </p>
      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
      <a href="/_sandbox/test01/" style="color: #4285F4; text-decoration: none;">← サンドボックスTOPへ戻る</a>
    </div>
  `)
})

/**
 * トップ画面
 * 認証の入り口となるUIです。
 */
test01.get('/', (c) => {
  return c.html(html`
    <div style="font-family: sans-serif; padding: 40px; text-align: center;">
      <h2 style="color: #333;">ALETHEIA Auth Test</h2>
      <p style="color: #666; margin-bottom: 30px;">
        Google Cloud Consoleの設定と、Honoのルーティング疎通を確認します
      </p>
      
      <a href="/_sandbox/test01/auth/google" style="
        display: inline-flex;
        align-items: center;
        padding: 12px 28px;
        background-color: #4285F4;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        Googleでサインイン
      </a>

      <div style="margin-top: 40px; font-size: 0.85rem; color: #999;">
        <p>リダイレクトURIの期待値:<br>
        <code>http://localhost:8787/_sandbox/test01/auth/google/callback</code></p>
      </div>
    </div>
  `)
})
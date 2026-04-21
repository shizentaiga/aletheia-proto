import { Hono } from 'hono'
import { html } from 'hono/html'

// ==========================================================
// 1. プログラム定数・設定値 (Config)
// ==========================================================
const AUTH_CONFIG = {
  GOOGLE_AUTH_ENDPOINT: 'https://accounts.google.com/o/oauth2/v2/auth',
  CALLBACK_PATH: '/_sandbox/test01/auth/google/callback',
  SCOPES: 'openid email profile',
  PROMPT: 'select_account',
} as const

// ==========================================================
// 2. テキスト・デザイン資産 (Assets)
// ==========================================================
const UI_TEXT = {
  TITLE: 'ALETHEIA Auth Test',
  SUBTITLE: 'Google Cloud Consoleの設定と、Honoのルーティング疎通を確認します',
  LOGIN_BTN: 'Googleでサインイン',
  SUCCESS_TITLE: '✅ 疎通成功！',
  SUCCESS_DESC: 'Googleからの帰還を確認しました。認証コード（code）が正常に発行されています：',
  FOOTER_NOTE: '※この code は、ユーザー情報を引き出すための「一時的な引換券」です。'
}

const STYLES = {
  PRIMARY_COLOR: '#4285F4',
  BG_LIGHT: '#f4f4f4',
  TEXT_MAIN: '#333',
  TEXT_SUB: '#666',
  CONTAINER: 'font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;',
  BUTTON: `
    display: inline-flex;
    align-items: center;
    padding: 12px 28px;
    background-color: #4285F4;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `,
  CODE_BLOCK: `
    background: #f4f4f4;
    padding: 15px;
    border-radius: 5px;
    word-break: break-all;
    border: 1px solid #ddd;
    font-family: monospace;
  `
}

// ==========================================================
// 3. メインロジック (Routes)
// ==========================================================
type Bindings = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  BASE_URL: string 
}

export const test01 = new Hono<{ Bindings: Bindings }>()

/**
 * A. トップ画面
 */
test01.get('/', (c) => {
  const origin = new URL(c.req.url).origin
  const expectedUri = `${origin}${AUTH_CONFIG.CALLBACK_PATH}`

  return c.html(html`
    <div style="${STYLES.CONTAINER} text-align: center;">
      <h2 style="color: ${STYLES.TEXT_MAIN};">${UI_TEXT.TITLE}</h2>
      <p style="color: ${STYLES.TEXT_SUB}; margin-bottom: 30px;">${UI_TEXT.SUBTITLE}</p>
      
      <a href="/_sandbox/test01/auth/google" style="${STYLES.BUTTON}">
        ${UI_TEXT.LOGIN_BTN}
      </a>

      <div style="margin-top: 40px; font-size: 0.85rem; color: #999; text-align: left; background: #fafafa; padding: 10px;">
        <p style="margin: 0;"><strong>リダイレクトURIの期待値:</strong></p>
        <code>${expectedUri}</code>
      </div>
    </div>
  `)
})

/**
 * B. 認証開始 (Googleへ転送)
 */
test01.get('/auth/google', (c) => {
  const origin = new URL(c.req.url).origin
  const redirectUri = `${origin}${AUTH_CONFIG.CALLBACK_PATH}`
  
  const queryParams = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: AUTH_CONFIG.SCOPES,
    access_type: 'offline',
    prompt: AUTH_CONFIG.PROMPT,
  })
  
  return c.redirect(`${AUTH_CONFIG.GOOGLE_AUTH_ENDPOINT}?${queryParams.toString()}`)
})

/**
 * C. コールバック受取 (Googleから帰還)
 */
test01.get('/auth/google/callback', async (c) => {
  const code = c.req.query('code')
  const error = c.req.query('error')
  
  if (error) return c.text(`Google Auth Error: ${error}`, 400)
  if (!code) return c.text('認証コード(code)の取得に失敗しました', 400)

  return c.html(html`
    <div style="${STYLES.CONTAINER}">
      <h1 style="color: ${STYLES.PRIMARY_COLOR};">${UI_TEXT.SUCCESS_TITLE}</h1>
      <p style="color: #555;">${UI_TEXT.SUCCESS_DESC}</p>
      
      <div style="${STYLES.CODE_BLOCK}">
        ${code}
      </div>
      
      <p style="margin-top: 20px; font-size: 0.9rem; color: ${STYLES.TEXT_SUB};">
        ${UI_TEXT.FOOTER_NOTE}
      </p>
      
      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
      <a href="/_sandbox/test01/" style="color: ${STYLES.PRIMARY_COLOR}; text-decoration: none;">← サンドボックスTOPへ戻る</a>
    </div>
  `)
})
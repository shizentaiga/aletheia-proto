import { Hono } from 'hono'
import { html } from 'hono/html'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

// ==========================================================
// 1. プログラム定数・設定値 (Config)
// ==========================================================
const AUTH_CONFIG = {
  GOOGLE_AUTH_ENDPOINT: 'https://accounts.google.com/o/oauth2/v2/auth',
  CALLBACK_PATH: '/_sandbox/test01/auth/google/callback',
  LOGOUT_PATH: '/_sandbox/test01/logout',
  SESSION_COOKIE: 'aletheia_test_session',
  SCOPES: 'openid email profile',
  PROMPT: 'select_account',
} as const

// ==========================================================
// 2. テキスト・デザイン資産 (Assets)
// ==========================================================
const UI_TEXT = {
  TITLE: 'ALETHEIA Auth Test',
  LOGIN_BEFORE: '現在は【未ログイン】状態です',
  LOGIN_AFTER: '✅ 認証済み: サービスを利用可能です',
  LOGIN_BTN: 'Googleでサインイン',
  LOGOUT_BTN: 'ログアウト（セッション破棄）',
  MONITOR_TITLE: '🔍 Debug Monitor'
}

const STYLES = {
  PRIMARY_COLOR: '#4285F4',
  DANGER_COLOR: '#d90429',
  CONTAINER: 'font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;',
  CARD: 'border: 1px solid #ddd; padding: 25px; border-radius: 10px; margin-bottom: 20px; text-align: center;',
  MONITOR: 'background: #282c34; color: #61dafb; padding: 15px; border-radius: 8px; font-size: 0.85rem; text-align: left; font-family: monospace;',
  BUTTON_PRIMARY: `
    display: inline-block; padding: 12px 24px; background: #4285F4; 
    color: white; text-decoration: none; border-radius: 5px; fontWeight: bold; margin-top: 10px;
  `,
  BUTTON_OUTLINE: `
    display: inline-block; padding: 10px 20px; border: 1px solid #d90429; 
    color: #d90429; text-decoration: none; border-radius: 5px; margin-top: 10px; font-size: 0.9rem;
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
 * A. トップ画面 (拠点のハブ)
 * セッションCookieの有無で「ログイン前」「ログイン後」のUIを切り替えます。
 */
test01.get('/', (c) => {
  const session = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)
  const origin = new URL(c.req.url).origin
  const redirectUri = `${origin}${AUTH_CONFIG.CALLBACK_PATH}`

  return c.html(html`
    <div style="${STYLES.CONTAINER}">
      <h2 style="text-align: center; color: #333; margin-bottom: 30px;">${UI_TEXT.TITLE}</h2>

      <div style="${STYLES.CARD}">
        ${session ? html`
          <p style="color: #2b9348; font-weight: bold;">${UI_TEXT.LOGIN_AFTER}</p>
          <a href="${AUTH_CONFIG.LOGOUT_PATH}" style="${STYLES.BUTTON_OUTLINE}">${UI_TEXT.LOGOUT_BTN}</a>
        ` : html`
          <p style="color: #666;">${UI_TEXT.LOGIN_BEFORE}</p>
          <a href="/_sandbox/test01/auth/google" style="${STYLES.BUTTON_PRIMARY}">${UI_TEXT.LOGIN_BTN}</a>
        `}
      </div>

      <div style="${STYLES.MONITOR}">
        <h3 style="margin: 0 0 10px 0; font-size: 1rem; color: #fff; border-bottom: 1px solid #444; padding-bottom: 5px;">
          ${UI_TEXT.MONITOR_TITLE}
        </h3>
        <p style="margin: 5px 0;">STATUS: ${session ? 'LOGGED_IN' : 'GUEST'}</p>
        <p style="margin: 5px 0;">REDIRECT_URI: <span style="color: #d19a66;">${redirectUri}</span></p>
        <p style="margin: 5px 0;">SESSION_ID: <span style="color: #98c379;">${session || '(none)'}</span></p>
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
 * C. コールバック受取 (処理後にトップへ即リダイレクト)
 */
test01.get('/auth/google/callback', async (c) => {
  const code = c.req.query('code')
  if (!code) return c.text('認証に失敗しました', 400)

  // 1. 本来はここでToken交換とDB保存を行う
  // 2. 暫定的に「code」をセッションIDとしてCookieにセット (動作確認用)
  setCookie(c, AUTH_CONFIG.SESSION_COOKIE, `test-session-${code.substring(0, 8)}`, {
    path: '/',
    httpOnly: true,
    maxAge: 3600,
  })

  // 3. 【重要】URLを綺麗にするため、拠点のトップページへリダイレクト
  return c.redirect('/_sandbox/test01/')
})

/**
 * D. ログアウト処理
 */
test01.get('/logout', (c) => {
  deleteCookie(c, AUTH_CONFIG.SESSION_COOKIE, { path: '/' })
  return c.redirect('/_sandbox/test01/')
})
import { Hono } from 'hono'
import { html } from 'hono/html'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

// ==========================================================
// 1. プログラム定数・設定値 (Config)
// ==========================================================
const AUTH_CONFIG = {
  GOOGLE_AUTH_ENDPOINT: 'https://accounts.google.com/o/oauth2/v2/auth',
  GOOGLE_TOKEN_ENDPOINT: 'https://oauth2.googleapis.com/token',
  GOOGLE_USERINFO_ENDPOINT: 'https://www.googleapis.com/oauth2/v3/userinfo',
  CALLBACK_PATH: '/_sandbox/test01/auth/google/callback',
  LOGOUT_PATH: '/_sandbox/test01/logout',
  DELETE_ACCOUNT_PATH: '/_sandbox/test01/delete-account', // 追加
  SESSION_COOKIE: 'aletheia_test_session',
  SCOPES: 'openid email profile',
  PROMPT: 'select_account',
} as const

// ==========================================================
// 2. デザイン資産 (Assets)
// ==========================================================
const STYLES = {
  PRIMARY_COLOR: '#4285F4',
  CONTAINER: 'font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;',
  CARD: 'border: 1px solid #ddd; padding: 25px; border-radius: 10px; margin-bottom: 20px; text-align: center;',
  MONITOR: 'background: #282c34; color: #61dafb; padding: 15px; border-radius: 8px; font-size: 0.8rem; text-align: left; font-family: monospace; overflow-x: auto;',
  BTN_PRIMARY: 'display: inline-block; padding: 12px 24px; background: #4285F4; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;',
  BTN_LOGOUT: 'display: inline-block; padding: 10px 20px; border: 1px solid #666; color: #666; text-decoration: none; border-radius: 5px; font-size: 0.9rem; margin-right: 8px;',
  BTN_DANGER: 'display: inline-block; padding: 10px 20px; border: 1px solid #d90429; color: #d90429; text-decoration: none; border-radius: 5px; font-size: 0.9rem; cursor: pointer; background: transparent;'
}

// ==========================================================
// 3. メインロジック (Routes)
// ==========================================================
type Bindings = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  ALETHEIA_PROTO_DB: D1Database 
}

export const test01 = new Hono<{ Bindings: Bindings }>()

/**
 * A. トップ画面 (Debug Monitor搭載)
 */
test01.get('/', async (c) => {
  const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)
  const db = c.env.ALETHEIA_PROTO_DB

  // モニター用：status_id と deleted_at も取得するように拡張
  const { results: dbUsers } = await db.prepare(
    'SELECT user_id, google_id, email, display_name, status_id, last_login_at, deleted_at FROM users ORDER BY created_at DESC LIMIT 5'
  ).all()

  const currentUser = sessionUserId 
    ? await db.prepare('SELECT * FROM users WHERE user_id = ?').bind(sessionUserId).first()
    : null

  /**
   * 【修正：日本時間への変換処理】
   * DBから取得したUTC時刻を、表示直前にJSTへ変換します。
   * SQLiteの CURRENT_TIMESTAMP はUTCであるため、" UTC" を付与してDateオブジェクト化します。
   */
  const formatJST = (utcString: string | null) => {
    if (!utcString) return null
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(utcString + " UTC"))
  }

  const localizedUsers = dbUsers.map((user: any) => ({
    ...user,
    // ステータスの可読性を向上
    status: user.status_id === 1 ? '🔴 DELETED' : '🟢 ACTIVE',
    last_login_at: formatJST(user.last_login_at as string),
    deleted_at: formatJST(user.deleted_at as string)
  }))

  return c.html(html`
    <div style="${STYLES.CONTAINER}">
      <h2 style="text-align: center;">ALETHEIA Auth DB Test</h2>
      <div style="${STYLES.CARD}">
        ${currentUser ? html`
          <p style="color: #2b9348; font-weight: bold;">✅ ログイン中: ${currentUser.display_name}</p>
          <p style="font-size: 0.8rem; color: #666; margin-bottom: 20px;">Email: ${currentUser.email}</p>
          <div>
            <a href="${AUTH_CONFIG.LOGOUT_PATH}" style="${STYLES.BTN_LOGOUT}">ログアウト</a>
            <button 
              onclick="if(confirm('本当に退会しますか？\\nこの操作は取り消せません。')){ location.href='${AUTH_CONFIG.DELETE_ACCOUNT_PATH}'; }"
              style="${STYLES.BTN_DANGER}">
              退会する
            </button>
          </div>
        ` : html`
          <p style="color: #666;">現在は【未ログイン】です</p>
          <a href="/_sandbox/test01/auth/google" style="${STYLES.BTN_PRIMARY}">Googleでサインイン</a>
        `}
      </div>
      <div style="${STYLES.MONITOR}">
        <h3 style="color: #fff; border-bottom: 1px solid #444; margin: 0 0 10px 0;">🔍 Debug Monitor (DB: users)</h3>
        <pre style="margin: 0;">${JSON.stringify({
          session_id: sessionUserId || 'none',
          db_rows_count: dbUsers.length,
          latest_users: localizedUsers // 日本時間 & ステータス反映済み
        }, null, 2)}</pre>
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
    prompt: AUTH_CONFIG.PROMPT,
  })
  return c.redirect(`${AUTH_CONFIG.GOOGLE_AUTH_ENDPOINT}?${queryParams.toString()}`)
})

/**
 * C. コールバック受取 (デバッグログ強化版)
 */
test01.get('/auth/google/callback', async (c) => {
  const code = c.req.query('code')
  const origin = new URL(c.req.url).origin
  const redirectUri = `${origin}${AUTH_CONFIG.CALLBACK_PATH}`
  const db = c.env.ALETHEIA_PROTO_DB

  if (!code) return c.text('Authorization code missing', 400)

  try {
    // 1. 認可コードをアクセストークンに交換
    console.log('--- Step 1: Exchanging code for token ---')
    const tokenRes = await fetch(AUTH_CONFIG.GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text()
      console.error('Token Exchange Error:', tokenRes.status, errorText)
      throw new Error(`Token Exchange Failed: ${tokenRes.status}`)
    }
    const tokenData = await tokenRes.json() as any
    console.log('Token data received (keys):', Object.keys(tokenData))

    // 2. ユーザープロフィール取得
    console.log('--- Step 2: Fetching UserInfo ---')
    const userRes = await fetch(AUTH_CONFIG.GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userRes.ok) {
      const errorText = await userRes.text()
      console.error('UserInfo Fetch Error:', userRes.status, errorText)
      throw new Error(`UserInfo Fetch Failed: ${userRes.status}`)
    }

    const googleUser = await userRes.json() as any
    console.log('Raw Google User Data:', JSON.stringify(googleUser))

    /**
     * 【D1_TYPE_ERROR対策：重要】 
     * '|| null' を用いて明示的にデータベースが扱える型に変換（クレンジング）します。
     */
    const userData = {
      sub: googleUser.sub || null,
      email: googleUser.email || null,
      name: googleUser.name || googleUser.email || 'Unknown'
    }

    if (!userData.sub) {
      console.error('Validation Error: googleUser.sub is missing', googleUser)
      throw new Error(`Google ID (sub) could not be retrieved.`)
    }

    // 3. DB連携
    console.log('--- Step 3: DB Operations ---')
    let user = await db.prepare('SELECT * FROM users WHERE google_id = ?')
      .bind(userData.sub).first() as any

    if (!user) {
      console.log('Registering new user:', userData.email)
      const newUserId = crypto.randomUUID() 
      await db.prepare(`
        INSERT INTO users (user_id, google_id, email, display_name, role_id, status_id, plan_id, last_login_at)
        VALUES (?, ?, ?, ?, 0, 0, 'free', CURRENT_TIMESTAMP)
      `).bind(newUserId, userData.sub, userData.email, userData.name).run()
      
      user = { user_id: newUserId }
    } else {
      console.log('Existing user login:', user.user_id)
      /**
       * 【論理削除からの復帰】
       * 再ログイン時は status_id を 0 に戻し、deleted_at をリセットします。
       */
      await db.prepare('UPDATE users SET status_id = 0, deleted_at = NULL, last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?')
        .bind(user.user_id).run()
    }

    // 4. セッション発行
    setCookie(c, AUTH_CONFIG.SESSION_COOKIE, user.user_id, {
      path: '/', httpOnly: true, secure: true, maxAge: 3600, sameSite: 'Lax' // sameSiteを追加(CSRF対策)
    })
    console.log('--- Step 4: Success, redirecting ---')
    return c.redirect('/_sandbox/test01/')

  } catch (e) {
    console.error('Final Catch Block:', e)
    return c.text('Auth Error: ' + String(e), 500)
  }
})

/**
 * D. ログアウト処理
 */
test01.get('/logout', (c) => {
  deleteCookie(c, AUTH_CONFIG.SESSION_COOKIE, { path: '/' })
  return c.redirect('/_sandbox/test01/')
})

/**
 * E. 論理削除（退会）処理
 */
test01.get('/delete-account', async (c) => {
  const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)
  const db = c.env.ALETHEIA_PROTO_DB

  if (!sessionUserId) return c.redirect('/_sandbox/test01/')

  try {
    /**
     * 【教訓】データを物理削除せず、フラグと時刻で管理。
     * これにより、Debug Monitor上で「退会済み」として履歴を確認可能にします。
     */
    await db.prepare('UPDATE users SET status_id = 1, deleted_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .bind(sessionUserId).run()

    deleteCookie(c, AUTH_CONFIG.SESSION_COOKIE, { path: '/' })
    console.log(`User ${sessionUserId} logically deleted.`)
    return c.redirect('/_sandbox/test01/')
  } catch (e) {
    console.error('Delete Account Error:', e)
    return c.text('Delete Error: ' + String(e), 500)
  }
})
// リダイレクトURL(ローカル用)：
// http://localhost:8787/auth/google/callback
// リダイレクトURL(リモート用＝仮ドメイン)：
// https://aletheia-proto.tshizen2506.workers.dev/auth/google/callback

import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

// ==========================================================
// 1. 認証設定 (Config)
// ==========================================================
export const AUTH_CONFIG = {
  GOOGLE_AUTH_ENDPOINT: 'https://accounts.google.com/o/oauth2/v2/auth',
  GOOGLE_TOKEN_ENDPOINT: 'https://oauth2.googleapis.com/token',
  GOOGLE_USERINFO_ENDPOINT: 'https://www.googleapis.com/oauth2/v3/userinfo',
  CALLBACK_PATH: '/auth/google/callback',
  LOGOUT_PATH: '/logout',
  DELETE_ACCOUNT_PATH: '/delete-account',
  SESSION_COOKIE: 'aletheia_session',
  SCOPES: 'openid email profile',
  PROMPT: 'select_account',
} as const

// ==========================================================
// 2. 共通ユーティリティ (Utilities)
// ==========================================================

/**
 * ユーザー情報の型定義
 * Top.tsxのProps型と整合性を取るために定義します
 */
export interface AuthUser {
  user_id: string
  display_name: string | null
  email: string | null
  role_id: number
  status_id: number
  plan_id: string
  last_login_at: string | null
}

/**
 * セッションCookieから現在の有効なユーザーを取得
 */
export const getCurrentUser = async (db: D1Database, sessionUserId?: string): Promise<AuthUser | null> => {
  if (!sessionUserId) return null
  // ステータスが ACTIVE (0) のユーザーのみを「ログイン中」とみなす
  // .first<AuthUser>() で返り値の型を確定させます
  return await db.prepare('SELECT * FROM users WHERE user_id = ? AND status_id = 0')
    .bind(sessionUserId)
    .first<AuthUser>()
}

// ==========================================================
// 3. 認証ハンドラー (Hono Sub-App)
// ==========================================================
type Bindings = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  ALETHEIA_PROTO_DB: D1Database
}

export const authApp = new Hono<{ Bindings: Bindings }>()

/**
 * A. Google認証開始
 */
authApp.get('/auth/google', (c) => {
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
 * B. Googleコールバック受取
 */
authApp.get('/auth/google/callback', async (c) => {
  const code = c.req.query('code')
  const origin = new URL(c.req.url).origin
  const redirectUri = `${origin}${AUTH_CONFIG.CALLBACK_PATH}`
  const db = c.env.ALETHEIA_PROTO_DB

  if (!code) return c.text('Authorization code missing', 400)

  try {
    // 1. 認可コードをアクセストークンに交換
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

    if (!tokenRes.ok) throw new Error(`Token Exchange Failed: ${tokenRes.status}`)
    const tokenData = await tokenRes.json() as { access_token: string }

    // 2. ユーザープロフィール取得
    const userRes = await fetch(AUTH_CONFIG.GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userRes.ok) throw new Error(`UserInfo Fetch Failed: ${userRes.status}`)
    const googleUser = await userRes.json() as any

    // D1_TYPE_ERROR対策：クレンジング
    const sub = googleUser.sub || null
    const email = googleUser.email || null
    const name = googleUser.name || googleUser.email || 'Unknown'

    if (!sub) throw new Error('Google ID (sub) missing')

    // 3. DB連携 (UPSERTロジック)
    let user = await db.prepare('SELECT user_id FROM users WHERE google_id = ?')
      .bind(sub).first<{ user_id: string }>()

    if (!user) {
      // 新規登録
      const newUserId = crypto.randomUUID()
      await db.prepare(`
        INSERT INTO users (user_id, google_id, email, display_name, role_id, status_id, plan_id, last_login_at)
        VALUES (?, ?, ?, ?, 0, 0, 'free', CURRENT_TIMESTAMP)
      `).bind(newUserId, sub, email, name).run()
      user = { user_id: newUserId }
    } else {
      // 既存：再ログイン（論理削除からの復帰含む）
      await db.prepare(`
        UPDATE users 
        SET status_id = 0, deleted_at = NULL, last_login_at = CURRENT_TIMESTAMP 
        WHERE user_id = ?
      `).bind(user.user_id).run()
    }

    // 4. セッションCookie発行
    setCookie(c, AUTH_CONFIG.SESSION_COOKIE, user.user_id, {
      path: '/',
      httpOnly: true,
      secure: true,
      maxAge: 3600 * 24 * 7, // 1週間
      sameSite: 'Lax',
    })

    return c.redirect('/')

  } catch (e) {
    console.error('Auth Error:', e)
    return c.text('Auth Error: ' + String(e), 500)
  }
})

/**
 * C. ログアウト
 */
authApp.get('/logout', (c) => {
  deleteCookie(c, AUTH_CONFIG.SESSION_COOKIE, { path: '/' })
  return c.redirect('/')
})

/**
 * D. 退会（論理削除）
 */
authApp.get('/delete-account', async (c) => {
  const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)
  const db = c.env.ALETHEIA_PROTO_DB

  if (!sessionUserId) return c.redirect('/')

  try {
    await db.prepare('UPDATE users SET status_id = 1, deleted_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .bind(sessionUserId).run()

    deleteCookie(c, AUTH_CONFIG.SESSION_COOKIE, { path: '/' })
    return c.redirect('/')
  } catch (e) {
    console.error('Delete Error:', e)
    return c.text('Delete Error', 500)
  }
})
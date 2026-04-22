/**
 * =============================================================================
 * 【 ALETHEIA - 認証基盤モジュール / auth.ts 】
 * =============================================================================
 * Google OAuth 2.0 (OIDC) を利用したログイン、ログアウト、および論理退会を制御します。
 * * 🔗 Google Cloud Console 設定用リダイレクトURL:
 * - Local:  http://localhost:8787/auth/google/callback
 * - Remote: https://aletheia-proto.tshizen2506.workers.dev/auth/google/callback
 * * 📁 File Path: src/lib/auth.ts
 * =============================================================================
 */

import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

// -----------------------------------------------------------------------------
// 1. 固定設定値 (Config & Constants)
// -----------------------------------------------------------------------------

/**
 * 認証に関連するエンドポイントおよびCookie設定
 * 将来的に認証プロバイダを増やす、あるいはクッキー名を変更する場合に参照
 */
export const AUTH_CONFIG = {
  // Google API Endpoints
  GOOGLE_AUTH_ENDPOINT: 'https://accounts.google.com/o/oauth2/v2/auth',
  GOOGLE_TOKEN_ENDPOINT: 'https://oauth2.googleapis.com/token',
  GOOGLE_USERINFO_ENDPOINT: 'https://www.googleapis.com/oauth2/v3/userinfo',

  // Application Paths
  CALLBACK_PATH: '/auth/google/callback',
  LOGOUT_PATH: '/auth/logout',          // /auth を付与
  DELETE_ACCOUNT_PATH: '/auth/delete-account', // /auth を付与

  // Session Settings
  SESSION_COOKIE: 'aletheia_session',
  SESSION_MAX_AGE: 3600 * 24 * 7, // 7日間 (秒単位)
  
  // Auth Options
  SCOPES: 'openid email profile',
  PROMPT: 'select_account',
} as const

/**
 * システム内で使用する共通メッセージテキスト
 */
const MESSAGES = {
  ERROR_CODE_MISSING: 'Authorization code missing',
  ERROR_TOKEN_FAILED: 'Token Exchange Failed',
  ERROR_USERINFO_FAILED: 'UserInfo Fetch Failed',
  ERROR_SUB_MISSING: 'Google ID (sub) missing',
  ERROR_GENERAL: 'Auth Error: ',
  ERROR_DELETE_FAILED: 'Delete Account Error',
} as const

// -----------------------------------------------------------------------------
// 2. データ型定義 (Type Definitions)
// -----------------------------------------------------------------------------

/**
 * ユーザー情報の型定義 (D1 Table: users)
 * Top.tsx 等の UI コンポーネントへ Props として渡す際の基準となります
 */
export interface AuthUser {
  user_id: string         // システム内部用UUID
  display_name: string | null
  email: string | null
  role_id: number         // 0:USER, 1:ADMIN...
  status_id: number       // 0:ACTIVE, 1:DELETED
  plan_id: string         // free, pro...
  last_login_at: string | null
}

// -----------------------------------------------------------------------------
// 3. 共通ユーティリティ (Utilities)
// -----------------------------------------------------------------------------

/**
 * セッションCookieから現在ログイン中の有効なユーザーを取得する
 * @param db - D1データベースインスタンス
 * @param sessionUserId - Cookieから取得したユーザーID
 * @returns ユーザーオブジェクト、または未ログイン/退会済みなら null
 */
export const getCurrentUser = async (db: D1Database, sessionUserId?: string): Promise<AuthUser | null> => {
  if (!sessionUserId) return null
  
  // 論理削除 (status_id = 1) されたユーザーは、Cookieが残っていても null を返す
  return await db.prepare('SELECT * FROM users WHERE user_id = ? AND status_id = 0')
    .bind(sessionUserId)
    .first<AuthUser>()
}

// -----------------------------------------------------------------------------
// 4. 認証ハンドラー (Hono Sub-App)
// -----------------------------------------------------------------------------

type Bindings = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  ALETHEIA_PROTO_DB: D1Database
}

export const authApp = new Hono<{ Bindings: Bindings }>()

/**
 * A. Google認証開始
 * ユーザーを Google のログイン画面へリダイレクトします
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
 * 認証成功後のコードをトークン・ユーザー情報と交換し、DBへ保存・セッション発行を行います
 */
authApp.get('/auth/google/callback', async (c) => {
  const code = c.req.query('code')
  const origin = new URL(c.req.url).origin
  const redirectUri = `${origin}${AUTH_CONFIG.CALLBACK_PATH}`
  const db = c.env.ALETHEIA_PROTO_DB

  if (!code) return c.text(MESSAGES.ERROR_CODE_MISSING, 400)

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

    if (!tokenRes.ok) throw new Error(`${MESSAGES.ERROR_TOKEN_FAILED}: ${tokenRes.status}`)
    const tokenData = await tokenRes.json() as { access_token: string }

    // 2. ユーザープロフィール取得
    const userRes = await fetch(AUTH_CONFIG.GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userRes.ok) throw new Error(`${MESSAGES.ERROR_USERINFO_FAILED}: ${userRes.status}`)
    const googleUser = await userRes.json() as any

    // D1_TYPE_ERROR防止: 取得した値をクレンジング
    const sub = googleUser.sub || null
    const email = googleUser.email || null
    const name = googleUser.name || googleUser.email || 'Unknown'

    if (!sub) throw new Error(MESSAGES.ERROR_SUB_MISSING)

    // 3. DB連携 (UPSERTロジック)
    let user = await db.prepare('SELECT user_id FROM users WHERE google_id = ?')
      .bind(sub).first<{ user_id: string }>()

    if (!user) {
      // --- 新規登録 ---
      const newUserId = crypto.randomUUID()
      await db.prepare(`
        INSERT INTO users (user_id, google_id, email, display_name, role_id, status_id, plan_id, last_login_at)
        VALUES (?, ?, ?, ?, 0, 0, 'free', CURRENT_TIMESTAMP)
      `).bind(newUserId, sub, email, name).run()
      user = { user_id: newUserId }
    } else {
      // --- 既存: 再ログイン (論理削除からの復帰を含む) ---
      await db.prepare(`
        UPDATE users 
        SET status_id = 0, deleted_at = NULL, last_login_at = CURRENT_TIMESTAMP 
        WHERE user_id = ?
      `).bind(user.user_id).run()
    }

    // 4. セッションCookie発行 (1週間の有効期限)
    setCookie(c, AUTH_CONFIG.SESSION_COOKIE, user.user_id, {
      path: '/',
      httpOnly: true,
      secure: true,
      maxAge: AUTH_CONFIG.SESSION_MAX_AGE,
      sameSite: 'Lax',
    })

    return c.redirect('/')

  } catch (e) {
    console.error(e)
    return c.text(MESSAGES.ERROR_GENERAL + String(e), 500)
  }
})

/**
 * C. ログアウト処理
 * サーバー側のセッション（Cookie）を削除してトップページへ戻します
 */
authApp.get('/auth/logout', (c) => {
  deleteCookie(c, AUTH_CONFIG.SESSION_COOKIE, { path: '/' })
  return c.redirect('/')
})

/**
 * D. 退会処理 (論理削除)
 * 物理削除はせず、status_id を更新してユーザーを無効化します
 */
authApp.get('/auth/delete-account', async (c) => {
  const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)
  const db = c.env.ALETHEIA_PROTO_DB

  if (!sessionUserId) return c.redirect('/')

  try {
    // ステータスを 1 (DELETED) に変更し、削除時刻を記録
    await db.prepare('UPDATE users SET status_id = 1, deleted_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .bind(sessionUserId).run()

    deleteCookie(c, AUTH_CONFIG.SESSION_COOKIE, { path: '/' })
    return c.redirect('/')
  } catch (e) {
    console.error(e)
    return c.text(MESSAGES.ERROR_DELETE_FAILED, 500)
  }
})
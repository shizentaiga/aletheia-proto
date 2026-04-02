import { Hono } from 'hono'
import { googleAuth } from '@hono/oauth-providers/google'

// 1. 環境変数の型を定義
// 親 (index.ts) と「道具箱」の中身を完全に一致させます。
type Bindings = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  aletheia_db: D1Database // 親が持っているものはここにも書く
  ENVIRONMENT?: string
  BASE_URL: string // ← 追加
}

// 2. Honoのインスタンス作成（子アプリ）
export const test01 = new Hono<{ Bindings: Bindings }>()

// --- 【修正ポイント】 Google認証の設定を一箇所に集約 ---
// ここで「門番」の設定を一括で行います。
// 複数のルートに跨って環境変数を確認し、Googleとの通信準備を整えます。
const authMiddleware = (c: any, next: any) => {
  // 1. 環境変数の取得状況を厳密にチェック
  const rawBaseUrl = c.env.BASE_URL;
  const clientId = c.env.GOOGLE_CLIENT_ID;

  // --- [診断ログ：開始] ---
  console.log("--- [DEBUG] Auth Middleware Start ---");
  console.log("A. Raw BASE_URL from Env:", rawBaseUrl ? `"${rawBaseUrl}"` : "MISSING (undefined)");
  console.log("B. Client ID Status:", clientId ? "OK" : "MISSING");
  
  // もし BASE_URL が取れていないなら、ここで明確にエラーを出す（原因の特定を早める）
  if (!rawBaseUrl || rawBaseUrl === "BASE_URL_IS_EMPTY") {
    console.error("❌ ERROR: BASE_URL is not defined in environment variables!");
    return c.text("Configuration Error: BASE_URL is missing. Please check wrangler.json and Cloudflare settings.", 500);
  }

  // 2. 組み立てたURLをログに出す
  const redirectUri = `${rawBaseUrl}/sandbox/test01/google`;
  console.log("C. Final Redirect URI to Google:", redirectUri);

  // 3. 実行前の最終確認
  if (redirectUri.includes("localhost") && !rawBaseUrl.includes("localhost")) {
    console.warn("⚠️ WARNING: Redirect URI contains localhost unexpectedly!");
  }
  console.log("--- [DEBUG] Auth Middleware End ---");

  return googleAuth({
    client_id: clientId,
    client_secret: c.env.GOOGLE_CLIENT_SECRET,
    scope: ['openid', 'email', 'profile'],
    redirect_uri: redirectUri,
  })(c, next);
};

// --- A. 認証開始地点 ---
// アクセス先： http://localhost:8787/sandbox/test01/login
test01.get('/login', authMiddleware, (c) => {
  // authMiddlewareが成功すると、自動的にGoogleのログイン画面へ飛ばされます。
  return c.text('Redirecting to Google...')
})

// --- B. 認証後の受け取り地点（コールバック） ---
// アクセス先： http://localhost:8787/sandbox/test01/google
test01.get('/google', authMiddleware, async (c) => {
  console.log("--- Callback Reached ---");

  // Googleから解析済みのユーザー情報を取り出します
  const user = c.get('user-google');

  if (!user) {
    console.log("User Data Status: NOT FOUND");
    return c.text('認証情報が取得できませんでした。', 401);
  }

  console.log("User Data Status: FOUND", user.email);

  // 画面に結果を表示します
  return c.html(`
    <div style="padding: 20px; font-family: sans-serif; line-height: 1.6;">
      <h1 style="color: #4285F4;">✅ Google認証に成功しました！</h1>
      <p>取得したメールアドレス: <strong>${user.email}</strong></p>
      <hr>
      <p style="font-size: 0.9em; color: #666;">（デバッグ用：取得データの全容）</p>
      <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px; overflow: auto;">${JSON.stringify(user, null, 2)}</pre>
      <p><a href="/sandbox/test02">→ 次はDBのデータを確認する</a></p>
    </div>
  `);
})
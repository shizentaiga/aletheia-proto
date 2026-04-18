import { Hono } from 'hono'
import { googleAuth } from '@hono/oauth-providers/google'

// 1. 環境変数の型を定義
type Bindings = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

// 2. Honoのインスタンス作成
// export const testRoute = new Hono<{ Bindings: Bindings }>()
export const test01 = new Hono<{ Bindings: Bindings }>()

// --- 【修正ポイント1】 Google認証の「開始」地点 ---
// ブラウザで http://localhost:8787/test/login にアクセスすると実行されます。
// .use ではなく .get にし、パスを '/login' に変更しました。
test01.get('/login', (c, next) => {
  // --- デバッグ用ログ ---
  console.log("CLIENT_ID:", c.env.GOOGLE_CLIENT_ID ? "OK" : "MISSING");
  console.log("CLIENT_SECRET:", c.env.GOOGLE_CLIENT_SECRET ? "OK" : "MISSING");
  // --------------------

  const auth = googleAuth({
    client_id: c.env.GOOGLE_CLIENT_ID,
    client_secret: c.env.GOOGLE_CLIENT_SECRET,
    scope: ['openid', 'email', 'profile'],
    // 【重要】Googleでの処理が終わった後の「戻り先」をここで指定します。
    // メイン側の '/test' と結合されるため、フルURLを記述します。
    redirect_uri: 'http://localhost:8787/sandbox/test01/google', 
  })
  return auth(c, next)
})

// --- 【修正ポイント2】 認証後の「受け取り（答え合わせ）」地点 ---
test01.get('/google', 
  // 第1引数：ここに「解析用の門（ミドルウェア）」を設置します
  (c, next) => {
    const authHandler = googleAuth({
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      scope: ['openid', 'email', 'profile'],
      redirect_uri: 'http://localhost:8787/sandbox/test01/google',
    });
    // 【重要】ここで実行(authHandler(c, next))することで、Googleからのデータを解析し、c.set('user-google', ...) してくれます
    return authHandler(c, next);
  },
  // 第2引数：解析が終わった後に実行される「メインの処理」です
  async (c) => {
    // ログ1: ここに到達したことを確認
    console.log("--- Callback Reached ---");

    // ログ2: Googleから届いた生のクエリパラメータを表示（codeなどが含まれます）
    console.log("Query Params:", c.req.query());

    // Googleから解析済みのユーザー情報を取り出します
    const user = c.get('user-google');

    // ログ3: 解析結果をターミナルで確認
    console.log("User Data Status:", user ? "FOUND" : "NOT FOUND");

    if (!user) {
      return c.text('認証情報が取得できませんでした。', 401);
    }

    return c.html(`
      <div style="padding: 20px; font-family: sans-serif; line-height: 1.6;">
        <h1 style="color: #2e7d32;">✅ Google認証に成功しました！</h1>
        <p>取得したメールアドレス: <strong>${user.email}</strong></p>
        <hr>
        <p style="font-size: 0.9em; color: #666;">（デバッグ用：取得データの全容）</p>
        <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;">${JSON.stringify(user, null, 2)}</pre>
      </div>
    `);
  }
);
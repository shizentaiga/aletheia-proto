import { Hono } from 'hono'

// 【道具箱の中身を定義】
// プログラムが「データベース（DB）」という道具を使えるように準備します。
type Bindings = {
  DB: D1Database
}

// 【テスト専用のミニアプリを作成】
// 上記の「道具箱（Bindings）」を持った状態で、新しいテスト画面を作ります。
export const test02 = new Hono<{ Bindings: Bindings }>()

/**
 * テスト案 A: 登録されている全員の名簿を表示する
 * アクセス先： http://localhost:8787/sandbox/test02/
 */
test02.get('/', async (c) => {
  try {
    // 1. データベースに対して「ユーザー全員分をちょうだい」と命令（SELECT文）を投げます
    const { results } = await c.env.DB.prepare('SELECT * FROM users').all();
    
    // 2. 成功したら、画面に「成功」という文字と一緒にデータを表示します
    return c.json({
      status: "success",
      message: "データベースとの接続に成功しました！",
      data: results // ここに名簿の中身が入ります
    });
  } catch (e) {
    // もし失敗（エラー）したら、何が悪かったのかを画面に表示します
    console.error(e);
    return c.json({
      status: "error",
      message: "データベースに繋げませんでした。設定を確認してください。",
      error: String(e)
    }, 500);
  }
});

/**
 * テスト案 B: 特定の1人だけを指定して情報を表示する
 * アクセス先： http://localhost:8787/sandbox/test02/（調べたいID）
 * 例： http://localhost:8787/sandbox/test02/test_google_id_001
 */
test02.get('/:id', async (c) => {
  // URLの末尾に入力された「ID」を読み取ります
  const id = c.req.param('id');

  // データベースの中から、その「ID」に一致する人だけを1人（first）探します
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first();
    
  // 検索結果を画面に表示します（いなければ Not Found と出ます）
  return c.json({
    queried_id: id,
    user: user || "指定されたIDのユーザーは見つかりませんでした。"
  });
});
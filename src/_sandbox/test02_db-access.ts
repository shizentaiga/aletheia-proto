/**
 * ==========================================================
 * 【Aletheia 管理用URL・コマンドメモ】
 * ==========================================================
 * * ■ 本番環境 (Cloudflare Workers)
 * ----------------------------------------------------------
 * - TOP (開発メニュー):  https://aletheia-proto.tshizen2506.workers.dev/sandbox/
 * - Google認証テスト:    https://aletheia-proto.tshizen2506.workers.dev/sandbox/test01/login
 * - DB接続・一覧表示:    https://aletheia-proto.tshizen2506.workers.dev/sandbox/test02
 * * ■ ローカル開発環境 (http://localhost:8787)
 * ----------------------------------------------------------
 * - Google認証テスト:    http://localhost:8787/sandbox/test01/login
 * - DB接続・一覧表示:    http://localhost:8787/sandbox/test02
 * * ■ 開発・運用コマンド (ターミナル実行用)
 * ----------------------------------------------------------
 * 【重要：反映】 npx wrangler deploy
 * ⇒ GitHubへのPushだけでは本番環境(Workers)は更新されません。
 * コードや環境変数を変えたら、必ずこのコマンドで本番へ送り出すこと。
 * * 【重要：監視】 npx wrangler tail
 * ⇒ 本番環境の console.log をリアルタイムで確認します。
 * 「401エラー」や「Internal Server Error」が出たら、まずこれを見る。
 * * 【DB操作：ローカル】 npx wrangler d1 execute aletheia-db --local --file=./seed.sql
 * 【DB操作：本番】     npx wrangler d1 execute aletheia-db --remote --file=./seed.sql
 * ==========================================================
 */

import { Hono } from 'hono'

// ==========================================
// 1. 道具箱の中身を定義（型定義）
// ==========================================
// 親ファイル (sandbox/index.ts) と名前を完全に一致させます。
type Bindings = {
  aletheia_db: D1Database  // Cloudflare D1（本番・ローカル共通）
  ENVIRONMENT?: string     // 実行環境（development / production）
}

// 【テスト専用のミニアプリを作成】
export const test02 = new Hono<{ Bindings: Bindings }>()

// ==========================================
// テスト案 A: 登録されている全員の名簿を表示する
// ==========================================
/**
 * アクセス先（ローカル）： http://localhost:8787/sandbox/test02/
 * アクセス先（本番）： https://(あなたのドメイン)/sandbox/test02/
 */
test02.get('/', async (c) => {
  // 今、どちらの環境で動いているかを判定（未設定なら development とみなす）
  const envName = c.env.ENVIRONMENT || 'development (local)';

  try {
    // 1. データベースに対して「ユーザー全員分をちょうだい」と命令を投げます
    // ※ 接続先は設定ファイルに基づいて自動で切り替わります。
    const { results } = await c.env.aletheia_db.prepare('SELECT * FROM users').all();
    
    // 2. 成功したら、実行環境の情報と一緒にデータを表示します
    return c.json({
      status: "success",
      message: "データベースとの接続に成功しました！",
      environment: envName,
      data: results
    });
  } catch (e) {
    // もし失敗（エラー）したら、エラー内容を画面に表示します
    console.error(e);
    return c.json({
      status: "error",
      message: "データベースに繋げませんでした。設定（wrangler.json）を確認してください。",
      environment: envName,
      error: String(e)
    }, 500);
  }
});

// ==========================================
// テスト案 B: 特定の1人だけを指定して情報を表示する
// ==========================================
/**
 * アクセス先： http://localhost:8787/sandbox/test02/(調べたいID)
 * 例： http://localhost:8787/sandbox/test02/test_id_001
 */
test02.get('/:id', async (c) => {
  const id = c.req.param('id');
  const envName = c.env.ENVIRONMENT || 'development (local)';

  try {
    // 【修正箇所】DB ではなく aletheia_db を使用します
    // データベースの中から、その「ID」に一致する人だけを1人（first）探します
    const user = await c.env.aletheia_db.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first();
      
    return c.json({
      status: "success",
      environment: envName,
      queried_id: id,
      user: user || "指定されたIDのユーザーは見つかりませんでした。"
    });
  } catch (e) {
    console.error(e);
    return c.json({ 
      status: "error", 
      message: "個別検索に失敗しました。",
      environment: envName,
      error: String(e) 
    }, 500);
  }
});
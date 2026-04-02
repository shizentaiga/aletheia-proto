-- ==========================================================
-- 【実行コマンド備忘録：テーブルの作成・初期化】
-- ==========================================================
-- ローカル: npx wrangler d1 execute aletheia-db --local --file=./schema.sql
-- 本番適用: npx wrangler d1 execute aletheia-db --remote --file=./schema.sql
-- ==========================================================

-- 1. 既存のテーブルを削除（初期化テスト用）
-- ※ 構造を変更して作り直したい時に、このファイルを実行するだけでリセット可能です。
DROP TABLE IF EXISTS users;

-- 2. ユーザーテーブルの作成（Aletheia ユーザー管理の基盤）
CREATE TABLE users (
    -- Googleの固有ID (sub): ユーザーを一意に識別する不変の鍵
    id TEXT PRIMARY KEY,

    -- メールアドレス: 連絡用（将来のID破棄や匿名化を見据え、厳格な制約は持たせない）
    email TEXT,

    -- 表示名: サービス内で表示される名前
    display_name TEXT,

    -- リフレッシュトークン: セッションの自動延命（ローリング・セッション）に使用する鍵
    refresh_token TEXT,

    -- 最終ログイン日時: セッションの有効期限切れ（ガバナンス）を判定するために記録
    last_login_at DATETIME,

    -- 登録日時: デフォルトで実行時の時刻が記録されます
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 動作確認用の最小テストデータ
-- ※ 接続テスト時に「データが0件ではないこと」を確認するために1件だけ投入します。
-- ※ 詳細なテストユーザーは seed.sql で管理するのがおすすめです。
INSERT INTO users (id, email, display_name) 
VALUES ('test_google_id_001', 'test@example.com', '接続テスト用ユーザー');
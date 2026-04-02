-- 既存のテーブルを削除（初期化テスト用）
DROP TABLE IF EXISTS users;

-- ユーザーテーブルの作成
CREATE TABLE users (
    id TEXT PRIMARY KEY,           -- Googleの固有ID (sub)
    email TEXT,                    -- メールアドレス（将来の破棄を見据えNULL許容）
    display_name TEXT,             -- 表示名
    refresh_token TEXT,            -- 自動延命用の鍵
    last_login_at DATETIME,        -- 最終アクセス（延命判定用）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- テストデータの挿入（動作確認用）
INSERT INTO users (id, email, display_name) 
VALUES ('test_google_id_001', 'test@example.com', 'テストユーザー');
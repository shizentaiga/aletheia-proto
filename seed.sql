-- ==========================================================
-- 【実行コマンド備忘録】
-- ==========================================================
-- ローカル: npx wrangler d1 execute aletheia-db --local --file=./seed.sql
-- 本番適用: npx wrangler d1 execute aletheia-db --remote --file=./seed.sql
-- ==========================================================

-- 1人目：本番用（メインアカウント等）
INSERT OR REPLACE INTO users (id, email, display_name, created_at)
VALUES (
    'test_google_id_001', 
    'tshizen2506@gmail.com', 
    '清善 泰賀', 
    CURRENT_TIMESTAMP
);

-- 2人目：開発テスト用
INSERT OR REPLACE INTO users (id, email, display_name, created_at)
VALUES (
    'test_id_001', 
    'aletheia_dev@example.com', 
    '清善 泰賀 (Dev)', 
    CURRENT_TIMESTAMP
);

-- 3人目：ゲスト用
INSERT OR REPLACE INTO users (id, email, display_name, created_at)
VALUES (
    'test_id_002', 
    'guest@example.com', 
    'ゲスト閲覧者', 
    CURRENT_TIMESTAMP
);
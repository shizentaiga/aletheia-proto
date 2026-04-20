/**
 * =============================================================================
 * 【 ALETHEIA - Core Seed Data (_core.sql) 】
 * =============================================================================
 * 役割: データベース全体の基礎（骨格）を構築する。
 * 依存関係: schema.sql (v1.7.0) の実行後、かつ他の全てのシードより先に実行すること。
 * -----------------------------------------------------------------------------
 * ■ v1.7.0 変更点
 * 1. role_definitions: 役割を数値(ID)で管理するためのマスタデータを追加。
 * 2. status_definitions: 提案やユーザーの状態を文脈別に定義。
 * 3. users: role(TEXT) から role_id(INT) へ移行。
 * 4. 冪等性の確保: INSERT OR REPLACE を維持。
 * =============================================================================
 */

-- 1. 役割定義 (Role Definitions)
-- 0: 一般ユーザー, 1: 管理者, 2: 店舗オーナー
INSERT OR REPLACE INTO role_definitions (id, name)
VALUES 
(0, 'USER'),
(1, 'ADMIN'),
(2, 'OWNER');

-- 2. 状態定義 (Status Definitions)
-- 文脈(context)ごとにステータスを分離して管理
INSERT OR REPLACE INTO status_definitions (id, context, name)
VALUES 
-- 提案 (PROPOSAL) 関連
(0, 'PROPOSAL', 'pending'),
(1, 'PROPOSAL', 'approved'),
(2, 'PROPOSAL', 'rejected'),
-- ユーザー (USER) 関連
(10, 'USER', 'active'),
(11, 'USER', 'suspended'),
(12, 'USER', 'deleted');

-- 3. 基盤データの投入 (Access Plans)
INSERT OR REPLACE INTO access_plans (plan_id, display_name, max_favorites, max_memo_length, can_propose_edits)
VALUES 
('free', 'Free Plan', 10, 60, 0),
('editor_pro', 'Editor Pro', 100, 1000, 1);

-- 4. カテゴリ定義 (Categories)
INSERT OR REPLACE INTO categories (category_id, display_name)
VALUES 
('cat_cafe', '☕ Cafe'),
('cat_work', '💻 Workspace'),
('cat_study', '📖 Study Space'),
('cat_other', '✨ Other');

-- 5. システム管理ユーザーの作成 (ID: ULID形式)
-- role='admin' から role_id=1 へ変更
INSERT OR REPLACE INTO users (user_id, email, display_name, role_id, status_id, plan_id)
VALUES 
('01ARZ3NDEKTSV4RRFFQ69G5FAV', 'admin@aletheia.local', 'ALETHEIA System', 1, 10, 'editor_pro');

-- 6. ブランド定義 (Brands - チェーン店管理用)
INSERT OR REPLACE INTO brands (brand_id, name, is_chain, official_url)
VALUES 
('brand_starbucks', 'Starbucks Coffee', 1, 'https://www.starbucks.co.jp/'),
('brand_mcdonalds', 'McDonald''s', 1, 'https://www.mcdonalds.co.jp/'),
('brand_doutor', 'Doutor Coffee', 1, 'https://www.doutor.co.jp/');
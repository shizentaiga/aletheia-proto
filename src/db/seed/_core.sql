/**
 * =============================================================================
 * 【 ALETHEIA - Core Seed Data (_core.sql) 】
 * =============================================================================
 * 役割: データベース全体の基礎（骨格）を構築する。
 * 依存関係: 全てのシードの中で最初に実行される必要がある。
 * 内容:
 * 1. 既存データの全削除（リセット）
 * 2. アクセスプラン、カテゴリ定義
 * 3. システム管理者アカウントの作成
 * =============================================================================
 */

-- 1. データのクリーンアップ (依存関係の逆順に削除し、制約エラーを防ぐ)
-- 子テーブルから順に削除
DELETE FROM slots;
DELETE FROM user_activities;
DELETE FROM service_proposals;
DELETE FROM proposal_supports;
DELETE FROM service_cafe_details;
DELETE FROM service_category_rel;
-- 親テーブルを削除
DELETE FROM services;
DELETE FROM users;
DELETE FROM access_plans;
DELETE FROM categories;
DELETE FROM brands;

-- 2. 基盤データの投入 (Access Plans)
-- plan_id は users や services の NOT NULL 制約で使用される
INSERT INTO access_plans (plan_id, display_name, max_favorites, max_memo_length, can_propose_edits)
VALUES 
('free', 'Free Plan', 10, 60, 0),
('editor_pro', 'Editor Pro', 100, 1000, 1);

-- 3. カテゴリ定義 (Categories)
INSERT INTO categories (category_id, display_name)
VALUES 
('cat_cafe', '☕ Cafe'),
('cat_work', '💻 Workspace'),
('cat_study', '📖 Study Space'),
('cat_other', '✨ Other');

-- 4. システム管理ユーザーの作成 (ID: ULID形式)
/**
 * user_id: 01ARZ3NDEKTSV4RRFFQ69G5FAV (固定ULID)
 * 役割: 今後投入されるチェーン店データの owner_id として参照される。
 * 開発者がこのIDをそのまま使用してログイン・検証を行うことも想定。
 */
INSERT INTO users (user_id, email, display_name, role, plan_id)
VALUES 
('01ARZ3NDEKTSV4RRFFQ69G5FAV', 'admin@aletheia.local', 'ALETHEIA System', 'admin', 'editor_pro');

-- 5. ブランド定義 (Brands - チェーン店管理用)
-- 今後の starbucks.sql などで brand_id として参照する
INSERT INTO brands (brand_id, name, is_chain, official_url)
VALUES 
('BRD_STARBUCKS', 'Starbucks', 1, 'https://www.starbucks.co.jp/'),
('BRD_DOUTOR', 'Doutor', 1, 'https://www.doutor.co.jp/');
/**
 * =============================================================================
 * 【 ALETHEIA - Core Seed Data (_core.sql) 】
 * =============================================================================
 * 役割: データベース全体の基礎（骨格）を構築する。
 * 依存関係: 全てのシードの中で最初に実行される必要がある。
 * -----------------------------------------------------------------------------
 * ■ v1.6.0 での変更点
 * 1. 依存関係の整理: 新設された proposal_supports を含め、削除順序を厳密化。
 * 2. ブランドIDの正規化: starbucks.sql 等と整合性を取るため小文字蛇形記法へ統一。
 * 3. 拡張性の確保: 今後のデータマージ提案を見越し、管理者の権限を再定義。
 * =============================================================================
 */

-- 1. データのクリーンアップ (依存関係の逆順に削除し、制約エラーを防ぐ)
-- 子テーブル（外部キー参照元）から順に削除
DELETE FROM slots;
DELETE FROM user_activities;
DELETE FROM proposal_supports; -- v1.6追加
DELETE FROM service_proposals;
DELETE FROM service_cafe_details;
DELETE FROM service_category_rel;

-- 親テーブルを削除
DELETE FROM services;
DELETE FROM users;
DELETE FROM access_plans;
DELETE FROM categories;
DELETE FROM brands;

-- 2. 基盤データの投入 (Access Plans)
-- plan_id は users や services の FOREIGN KEY 制約で参照される
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
 * 役割: システム由来の地点（公式データ）の owner_id として機能する。
 * 開発中のログインセッションや管理者権限の検証にこの固定IDを使用する。
 */
INSERT INTO users (user_id, email, display_name, role, plan_id)
VALUES 
('01ARZ3NDEKTSV4RRFFQ69G5FAV', 'admin@aletheia.local', 'ALETHEIA System', 'admin', 'editor_pro');

-- 5. ブランド定義 (Brands - チェーン店管理用)
-- 一括登録される店舗データのブランド識別子として使用。
-- id体系を starbucks.sql 等の外部シードファイルと統一 (brand_xxx)。
INSERT INTO brands (brand_id, name, is_chain, official_url)
VALUES 
('brand_starbucks', 'Starbucks Coffee', 1, 'https://www.starbucks.co.jp/'),
('brand_mcdonalds', 'McDonald''s', 1, 'https://www.mcdonalds.co.jp/'),
('brand_doutor', 'Doutor Coffee', 1, 'https://www.doutor.co.jp/');
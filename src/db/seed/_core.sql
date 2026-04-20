/**
 * =============================================================================
 * 【 ALETHEIA - Core Seed Data (_core.sql) 】
 * =============================================================================
 * 役割: データベース全体の基礎（骨格）を構築する。
 * 依存関係: schema.sql の実行後、かつ他の全てのシードより先に実行すること。
 * -----------------------------------------------------------------------------
 * ■ v1.6.1 変更点
 * 1. 冗長な DELETE 文を削除（schema.sql 側で初期化されるため）。
 * 2. 冪等性（繰り返し実行可能）を確保するため INSERT OR REPLACE を採用。
 * =============================================================================
 */

-- 1. 基盤データの投入 (Access Plans)
-- INSERT OR REPLACE により、既存のプラン設定を壊さず更新可能
INSERT OR REPLACE INTO access_plans (plan_id, display_name, max_favorites, max_memo_length, can_propose_edits)
VALUES 
('free', 'Free Plan', 10, 60, 0),
('editor_pro', 'Editor Pro', 100, 1000, 1);

-- 2. カテゴリ定義 (Categories)
INSERT OR REPLACE INTO categories (category_id, display_name)
VALUES 
('cat_cafe', '☕ Cafe'),
('cat_work', '💻 Workspace'),
('cat_study', '📖 Study Space'),
('cat_other', '✨ Other');

-- 3. システム管理ユーザーの作成 (ID: ULID形式)
-- 開発・運用の起点となる固定ID。
INSERT OR REPLACE INTO users (user_id, email, display_name, role, plan_id)
VALUES 
('01ARZ3NDEKTSV4RRFFQ69G5FAV', 'admin@aletheia.local', 'ALETHEIA System', 'admin', 'editor_pro');

-- 4. ブランド定義 (Brands - チェーン店管理用)
-- 一括登録される店舗データのブランド識別子。
-- 以降の chains/*.sql で参照されるため、ここでの定義が必須。
INSERT OR REPLACE INTO brands (brand_id, name, is_chain, official_url)
VALUES 
('brand_starbucks', 'Starbucks Coffee', 1, 'https://www.starbucks.co.jp/'),
('brand_mcdonalds', 'McDonald''s', 1, 'https://www.mcdonalds.co.jp/'),
('brand_doutor', 'Doutor Coffee', 1, 'https://www.doutor.co.jp/');
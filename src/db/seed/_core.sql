/**
 * =============================================================================
 * 【 ALETHEIA - Core Seed Data (_core.sql) 】
 * =============================================================================
 * 役割: データベース全体の基礎（骨格）を構築する。
 * 依存関係: schema.sql (v1.9.0) 実行後、かつ他の全てのシードより先に実行すること。
 * -----------------------------------------------------------------------------
 * ■ v1.9.0 変更点
 * 1. プラン刷新: free(0円) / pro(330円) / biz(3300円) の3層構造へ移行。
 * 2. status_definitions: 大文字表記に統一。
 * 3. 設計思想の明文化: オーナー紐付けおよび将来の拡張性に関する注釈を追加。
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
INSERT OR REPLACE INTO status_definitions (id, context, name)
VALUES 
-- 提案 (PROPOSAL) 関連
(0, 'PROPOSAL', 'PENDING'),
(1, 'PROPOSAL', 'APPROVED'),
(2, 'PROPOSAL', 'REJECTED'),
-- ユーザー (USER) 関連
(10, 'USER', 'ACTIVE'),
(11, 'USER', 'SUSPENDED'),
(13, 'USER', 'DELETED');

-- 3. 基盤データの投入 (Access Plans)
-- =============================================================================
-- 【プラン定義】
-- free: 無料。お気に入り等の基本機能。
-- pro : 月額330円。編集提案権限、お気に入り100件、メモ200文字。
-- biz : 月額3300円。オーナー権限。自店舗管理、将来的な予約・決済機能の解放。
-- =============================================================================
INSERT OR REPLACE INTO access_plans (
    plan_id, 
    display_name, 
    max_favorites, 
    max_memo_length, 
    can_propose_edits
) VALUES 
('free', 'Free Plan', 10,  60,  0),
('pro',  'Pro Plan',  100, 200, 1),
('biz',  'Biz Plan',  500, 1000, 1);

-- 4. カテゴリ定義 (Categories)
INSERT OR REPLACE INTO categories (category_id, display_name)
VALUES 
('cat_cafe',  '☕ Cafe'),
('cat_work',  '💻 Workspace'),
('cat_study', '📖 Study Space'),
('cat_other', '✨ Other');

-- 5. システム管理ユーザー (ULID: 01ARZ3NDEKTSV4RRFFQ69G5FAV)
-- role_id=1(ADMIN), plan_id='biz'(最高権限)
INSERT OR REPLACE INTO users (user_id, email, display_name, role_id, status_id, plan_id)
VALUES 
('01ARZ3NDEKTSV4RRFFQ69G5FAV', 'admin@aletheia.local', 'ALETHEIA System', 1, 10, 'biz');

-- 6. ブランド定義 (Brands)
INSERT OR REPLACE INTO brands (brand_id, name, is_chain, official_url)
VALUES 
('brand_starbucks', 'Starbucks Coffee', 1, 'https://www.starbucks.co.jp/'),
('brand_mcdonalds', 'McDonald''s', 1, 'https://www.mcdonalds.co.jp/'),
('brand_doutor',    'Doutor Coffee',   1, 'https://www.doutor.co.jp/');
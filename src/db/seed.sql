/**
 * =============================================================================
 * 【 ALETHEIA - Initial Seed Data (v1.5.0-Zen-Refined) 】
 * =============================================================================
 * ■ 実行コマンド
 * -----------------------------------------------------------------------------
 * [LOCAL]  npx wrangler d1 execute ALETHEIA_PROTO_DB --local  --file=./src/db/seed.sql
 * [REMOTE] npx wrangler d1 execute ALETHEIA_PROTO_DB --remote --file=./src/db/seed.sql
 * -----------------------------------------------------------------------------
 * ■ 運用方針
 * 1. システム整合性: plan_id 等の必須制約をすべて満たした最小構成。
 * 2. ID体系: 開発環境でも本番同様の ULID 形式（擬似的な固定文字列）を使用。
 * 3. 予約体験の検証: booked_by が NULL（空き）と非NULL（予約済）の挙動を即座に確認。
 * =============================================================================
 */

-- 1. データのクリーンアップ (依存関係の逆順に削除)
DELETE FROM slots;
DELETE FROM user_activities;
DELETE FROM service_proposals;
DELETE FROM service_category_rel;
DELETE FROM services;
DELETE FROM users;
DELETE FROM access_plans;
DELETE FROM categories;

-- 2. 基盤データの投入
INSERT INTO access_plans (plan_id, display_name, max_favorites, can_propose_edits)
VALUES 
('free', 'Free Plan', 10, 0),
('editor_pro', 'Editor Pro', 100, 1);

INSERT INTO categories (category_id, display_name)
VALUES 
('cat_cafe', '☕ Cafe'),
('cat_work', '💻 Workspace'),
('cat_study', '📖 Study Space');

-- 3. システム管理ユーザーの作成 (ID: 01H... は ULID 形式の例)
INSERT INTO users (user_id, email, display_name, role, plan_id)
VALUES 
('01ARZ3NDEKTSV4RRFFQ69G5FAV', 'admin@aletheia.local', 'ALETHEIA System', 'admin', 'editor_pro');

-- 4. サービス・店舗データの投入 (xn76: 東京, xn77: 北部/東部)
-- ※ v1.5仕様に合わせて geohash_9, address などを構成
INSERT INTO services (
    service_id, owner_id, plan_id, title, address, geohash_9, lat, lng, version
) VALUES  
-- --- 東京駅エリア ---
('SRV_MARUNOUCHI_001', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'editor_pro', '☕ Coffee 丸の内', '千代田区丸の内1-1', 'xn76ghj00', 35.6812, 139.7671, 1),
('SRV_TOKYO_ST_002', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'editor_pro', '💻 Station Work Tokyo', '東京駅構内 1F', 'xn76ghk00', 35.6815, 139.7660, 1),

-- --- 田端駅エリア ---
('SRV_TABATA_101', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', '☕ 田端ふれあいカフェ', '北区田端1-1', 'xn775v100', 35.7381, 139.7608, 1),
('SRV_TABATA_102', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', '📖 線路沿いの自習室', '北区東田端', 'xn775v200', 35.7375, 139.7615, 1),

-- --- 小岩駅エリア ---
('SRV_KOIWA_201', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', '☕ 小岩サンロード喫茶', '江戸川区南小岩', 'xn77ey100', 35.7335, 139.8825, 1);

-- 5. カテゴリ紐付け
INSERT INTO service_category_rel (service_id, category_id) VALUES 
('SRV_MARUNOUCHI_001', 'cat_cafe'),
('SRV_TOKYO_ST_002', 'cat_work'),
('SRV_TABATA_101', 'cat_cafe'),
('SRV_TABATA_102', 'cat_study'),
('SRV_KOIWA_201', 'cat_cafe');

-- 6. 予約可能枠 (Slots) の投入
-- start_at_unix は 2026-04-20 以降の未来時間を想定
INSERT INTO slots (
    slot_id, service_id, start_at_unix, duration_minutes, booked_by, version
) VALUES  
-- 「Coffee 丸の内」の枠
('SLT_001', 'SRV_MARUNOUCHI_001', 1776654000, 60, NULL, 1), -- 空き枠
('SLT_002', 'SRV_MARUNOUCHI_001', 1776657600, 60, '01ARZ3NDEKTSV4RRFFQ69G5FAV', 2), -- 予約済枠

-- 「Station Work」の枠
('SLT_003', 'SRV_TOKYO_ST_002', 1776654000, 15, NULL, 1),
('SLT_004', 'SRV_TOKYO_ST_002', 1776654900, 15, NULL, 1);

-- 7. 視認性テスト用の活動履歴
INSERT INTO user_activities (activity_id, user_id, service_id, favorited_at, personal_memo)
VALUES 
('ACT_001', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'SRV_MARUNOUCHI_001', CURRENT_TIMESTAMP, '丸の内の定番スポット。静かで良い。');
/**
 * =============================================================================
 * 【 ALETHEIA - Initial Seed Data (v1.6.0-Zen-Refined) 】
 * =============================================================================
 * ■ 実行コマンド
 * -----------------------------------------------------------------------------
 * [LOCAL]  npx wrangler d1 execute ALETHEIA_PROTO_DB --local  --file=./src/db/seed.sql
 * [REMOTE] npx wrangler d1 execute ALETHEIA_PROTO_DB --remote --file=./src/db/seed.sql
 * -----------------------------------------------------------------------------
 * ■ v1.6.0 での変更点
 * 1. 外部ID連携: ext_place_id を含むシードを追加し、Googleマップ連携をシミュレート。
 * 2. 成長モデルの検証: verification_level を使い、未検証と検証済みの混在をテスト。
 * 3. 柔軟なオーナーシップ: owner_id が NULL の「野良スポット」データを投入。
 * =============================================================================
 */

-- 1. データのクリーンアップ (依存関係の逆順に削除)
DELETE FROM slots;
DELETE FROM user_activities;
DELETE FROM service_proposals;
DELETE FROM service_category_rel;
DELETE FROM service_cafe_details;
DELETE FROM services;
DELETE FROM brands;
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

-- 3. システム管理ユーザーの作成
INSERT INTO users (user_id, email, display_name, role, plan_id)
VALUES 
('01ARZ3NDEKTSV4RRFFQ69G5FAV', 'admin@aletheia.local', 'ALETHEIA System', 'admin', 'editor_pro');

-- 4. ブランド（チェーン店）のシード
INSERT INTO brands (brand_id, name, is_chain, official_url)
VALUES 
('brand_starbucks', 'Starbucks Coffee', 1, 'https://www.starbucks.co.jp/');

-- 5. サービス・店舗データの投入
-- v1.6仕様：ext_place_id, verification_level を活用
INSERT INTO services (
    service_id, owner_id, plan_id, ext_place_id, ext_source, 
    title, address, geohash_9, lat, lng, verification_level, version
) VALUES  
-- --- 東京駅エリア (Google連携を想定した検証済みデータ) ---
(
    'SRV_MARUNOUCHI_001', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'editor_pro', 
    'ChIJL6X7B9-LGGAR6E7Y9p9Y9pI', 'google', 
    '☕ Coffee 丸の内', '千代田区丸の内1-1', 'xn76ghj00', 35.6812, 139.7671, 1, 1
),
(
    'SRV_TOKYO_ST_002', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'editor_pro', 
    'ChIJ_5p_p-uLGGAR_SAMPLE_ID', 'google', 
    '💻 Station Work Tokyo', '東京駅構内 1F', 'xn76ghk00', 35.6815, 139.7660, 1, 1
),

-- --- 田端駅エリア (オーナー不在の「発見された」スポット) ---
(
    'SRV_TABATA_101', NULL, 'free', 
    NULL, 'user_manual', 
    '☕ 田端ふれあいカフェ', '北区田端1-1', 'xn775v100', 35.7381, 139.7608, 1, 1
),

-- --- 小岩駅エリア (座標未確定：名前と住所だけの「種」のデータ) ---
(
    'SRV_KOIWA_201', NULL, 'free', 
    NULL, 'user_manual', 
    '☕ 小岩サンロード喫茶', '江戸川区南小岩', NULL, NULL, NULL, 0, 1
);

-- 6. カテゴリ紐付け
INSERT INTO service_category_rel (service_id, category_id) VALUES 
('SRV_MARUNOUCHI_001', 'cat_cafe'),
('SRV_TOKYO_ST_002', 'cat_work'),
('SRV_TABATA_101', 'cat_cafe'),
('SRV_KOIWA_201', 'cat_cafe');

-- 7. カフェ詳細（Wi-Fi/電源情報）
INSERT INTO service_cafe_details (service_id, has_wifi, has_power) VALUES
('SRV_MARUNOUCHI_001', 1, 1),
('SRV_TOKYO_ST_002', 1, 1);

-- 8. 予約可能枠 (Slots) 
-- 2026-04-20 15:00 JST (1776654000) 付近の未来時間
INSERT INTO slots (
    slot_id, service_id, start_at_unix, duration_minutes, booked_by, version
) VALUES  
-- Coffee 丸の内：空きと予約済みの混在テスト
('SLT_001', 'SRV_MARUNOUCHI_001', 1776654000, 60, NULL, 1),
('SLT_002', 'SRV_MARUNOUCHI_001', 1776657600, 60, '01ARZ3NDEKTSV4RRFFQ69G5FAV', 2);

-- 9. 視認性テスト用の活動履歴
INSERT INTO user_activities (activity_id, user_id, service_id, favorited_at, personal_memo)
VALUES 
('ACT_001', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'SRV_MARUNOUCHI_001', CURRENT_TIMESTAMP, '丸の内の定番スポット。静かで良い。');

-- 10. 改善提案（座標未確定の小岩の店舗に対する提案シミュレーション）
INSERT INTO service_proposals (proposal_id, service_id, user_id, field_name, proposed_value, status)
VALUES
('PROP_001', 'SRV_KOIWA_201', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'lat_lng', '35.7335, 139.8825', 'pending');
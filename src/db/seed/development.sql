/**
 * =============================================================================
 * 【 ALETHEIA - Development Seed Data (development.sql) 】
 * =============================================================================
 * 役割: 開発環境での動作確認用サンプルデータ（肉付け）を提供する。
 * 依存関係: _core.sql および 各チェーン店シードの実行後に投入すること。
 * =============================================================================
 */

-- 1. 開発用ユーザー（管理者以外の一般ユーザーテスト用）
-- 管理者（01ARZ3NDEKTSV4RRFFQ69G5FAV）は _core.sql で作成済みのため不要
INSERT INTO users (user_id, email, display_name, role, plan_id)
VALUES 
('USER_TEST_GUEST', 'guest@example.com', 'テスト客', 'user', 'free');

-- 2. サービス・店舗データの投入 (サンプル地点)
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
-- --- 田端駅エリア (オーナー不在のスポット) ---
(
    'SRV_TABATA_101', NULL, 'free', 
    NULL, 'user_manual', 
    '☕ 田端ふれあいカフェ', '北区田端1-1', 'xn775v100', 35.7381, 139.7608, 1, 1
),
-- --- 小岩駅エリア (座標未確定の「種」) ---
(
    'SRV_KOIWA_201', NULL, 'free', 
    NULL, 'user_manual', 
    '☕ 小岩サンロード喫茶', '江戸川区南小岩', NULL, NULL, NULL, 0, 1
);

-- 3. カテゴリ紐付け (Category IDは _core.sql で定義済み)
INSERT INTO service_category_rel (service_id, category_id) VALUES 
('SRV_MARUNOUCHI_001', 'cat_cafe'),
('SRV_TOKYO_ST_002', 'cat_work'),
('SRV_TABATA_101', 'cat_cafe'),
('SRV_KOIWA_201', 'cat_cafe');

-- 4. カフェ詳細
INSERT INTO service_cafe_details (service_id, has_wifi, has_power) VALUES
('SRV_MARUNOUCHI_001', 1, 1),
('SRV_TOKYO_ST_002', 1, 1);

-- 5. 予約可能枠 (Slots) 
INSERT INTO slots (
    slot_id, service_id, start_at_unix, duration_minutes, booked_by, version
) VALUES  
('SLT_001', 'SRV_MARUNOUCHI_001', 1776654000, 60, NULL, 1),
('SLT_002', 'SRV_MARUNOUCHI_001', 1776657600, 60, 'USER_TEST_GUEST', 2);

-- 6. 活動履歴
INSERT INTO user_activities (activity_id, user_id, service_id, favorited_at, personal_memo)
VALUES 
('ACT_001', 'USER_TEST_GUEST', 'SRV_MARUNOUCHI_001', CURRENT_TIMESTAMP, '丸の内の定番スポット。');

-- 7. 改善提案
INSERT INTO service_proposals (proposal_id, service_id, user_id, field_name, proposed_value, status)
VALUES
('PROP_001', 'SRV_KOIWA_201', 'USER_TEST_GUEST', 'lat_lng', '35.7335, 139.8825', 'pending');
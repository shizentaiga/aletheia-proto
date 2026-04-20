-- npx wrangler d1 execute ALETHEIA_PROTO_DB --file=./src/db/seed/development.sql --local

/**
 * =============================================================================
 * 【 ALETHEIA - Development Seed Data (development.sql) 】
 * =============================================================================
 * 役割: 開発環境での動作確認用サンプルデータ（肉付け）を提供する。
 * 運用: INSERT OR REPLACE により、既存データを上書きして単独実行可能。
 * -----------------------------------------------------------------------------
 * ■ v1.7.0 変更点
 * 1. users: role(TEXT) -> role_id(INT) / status_id=10(ACTIVE) を追加。
 * 2. service_proposals: status(TEXT) -> status_id(INT: 0=pending) へ移行。
 * 3. transport_nodes: 空間検索テスト用の駅サンプルデータを追加。
 * 4. address: 運用ルール「都道府県から始まること」を全データに適用。
 * =============================================================================
 */

-- 1. 開発用ユーザー
INSERT OR REPLACE INTO users (user_id, email, display_name, role_id, status_id, plan_id)
VALUES 
('USER_TEST_GUEST', 'guest@example.com', 'テスト客', 0, 10, 'free');

-- 2. 交通ノード (駅データ：小岩・東京・田端の空間検索用)
INSERT OR REPLACE INTO transport_nodes (node_id, name, type, line_name, geohash_9, lat, lng, address_prefix)
VALUES
('NODE_KOIWA', '小岩駅', 'station', '総武線', 'xn77ebx00', 35.7335, 139.8825, '東京都江戸川区'),
('NODE_TOKYO', '東京駅', 'station', '山手線', 'xn76ghj00', 35.6812, 139.7671, '東京都千代田区'),
('NODE_TABATA', '田端駅', 'station', '山手線', 'xn775v100', 35.7381, 139.7608, '東京都北区');

-- 3. サービス・店舗データの投入
INSERT OR REPLACE INTO services (
    service_id, owner_id, plan_id, ext_place_id, ext_source, 
    title, address, geohash_9, lat, lng, verification_level, version
) VALUES  
-- --- 東京駅エリア ---
(
    'SRV_MARUNOUCHI_001', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'editor_pro', 
    'ChIJL6X7B9-LGGAR6E7Y9p9Y9pI', 'google', 
    '☕ Coffee 丸の内', '東京都千代田区丸の内1-1', 'xn76ghj00', 35.6812, 139.7671, 1, 1
),
(
    'SRV_TOKYO_ST_002', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'editor_pro', 
    'ChIJ_5p_p-uLGGAR_SAMPLE_ID', 'google', 
    '💻 Station Work Tokyo', '東京都千代田区丸の内1（東京駅構内 1F）', 'xn76ghk00', 35.6815, 139.7660, 1, 1
),
-- --- 田端駅エリア ---
(
    'SRV_TABATA_101', NULL, 'free', 
    NULL, 'user_manual', 
    '☕ 田端ふれあいカフェ', '東京都北区田端1-1', 'xn775v100', 35.7381, 139.7608, 1, 1
),
-- --- 小岩駅エリア (座標未確定の「種」) ---
(
    'SRV_KOIWA_201', NULL, 'free', 
    NULL, 'user_manual', 
    '☕ 小岩サンロード喫喫', '東京都江戸川区南小岩', NULL, NULL, NULL, 0, 1
);

-- 4. カテゴリ紐付け
INSERT OR REPLACE INTO service_category_rel (service_id, category_id) VALUES 
('SRV_MARUNOUCHI_001', 'cat_cafe'),
('SRV_TOKYO_ST_002', 'cat_work'),
('SRV_TABATA_101', 'cat_cafe'),
('SRV_KOIWA_201', 'cat_cafe');

-- 5. カフェ詳細
INSERT OR REPLACE INTO service_cafe_details (service_id, has_wifi, has_power) VALUES
('SRV_MARUNOUCHI_001', 1, 1),
('SRV_TOKYO_ST_002', 1, 1);

-- 6. 予約可能枠 (Slots) 
INSERT OR REPLACE INTO slots (
    slot_id, service_id, start_at_unix, duration_minutes, booked_by, version
) VALUES  
('SLT_001', 'SRV_MARUNOUCHI_001', 1776654000, 60, NULL, 1),
('SLT_002', 'SRV_MARUNOUCHI_001', 1776657600, 60, 'USER_TEST_GUEST', 2);

-- 7. 活動履歴
INSERT OR REPLACE INTO user_activities (activity_id, user_id, service_id, favorited_at, personal_memo)
VALUES 
('ACT_001', 'USER_TEST_GUEST', 'SRV_MARUNOUCHI_001', CURRENT_TIMESTAMP, '丸の内の定番スポット。');

-- 8. 改善提案 (status_id=0: pending)
INSERT OR REPLACE INTO service_proposals (proposal_id, service_id, user_id, field_name, proposed_value, status_id)
VALUES
('PROP_001', 'SRV_KOIWA_201', 'USER_TEST_GUEST', 'lat_lng', '35.7335, 139.8825', 0);

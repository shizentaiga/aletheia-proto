-- npx wrangler d1 execute ALETHEIA_PROTO_DB --file=./src/db/seed/development.sql --local

/**
 * =============================================================================
 * 【 ALETHEIA - Development Seed Data (v1.9.0-JSON-Integrated) 】
 * =============================================================================
 * 役割: 開発環境での動作確認用サンプルデータを提供。
 * 運用: INSERT OR REPLACE により、既存データを上書きして単独実行可能。
 * -----------------------------------------------------------------------------
 * ■ v1.9.0 変更点
 * 1. service_cafe_detailsを廃止し、attributes_jsonへ統合。
 * 2. 座標未確定データ（小岩）の許容構造を維持。
 * 3. ユーザー状態・権限IDを最新スキーマに準拠。
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

-- 3. サービス・店舗データの投入 (attributes_jsonに設備を集約)
-- ⭐️削除(db/seed/areasで追加するため)

-- 4. カテゴリ紐付け
-- ⭐️削除(db/seed/areasで追加するため)

-- 6. 予約可能枠 (Slots) 
-- ⭐️削除(db/seed/areasで追加するため)

-- 7. 活動履歴
-- ⭐️削除(db/seed/areasで追加するため)

-- 8. 改善提案 (status_id=0: pending)
-- ⭐️削除(db/seed/areasで追加するため)

/**
 * =============================================================================
 * 【 ALETHEIA - Chain Data (starbucks.sql) 】
 * =============================================================================
 * 役割: 東京都内のスターバックス432店舗を登録し、検索パフォーマンスを検証する。
 * owner_id: 01ARZ3NDEKTSV4RRFFQ69G5FAV (ALETHEIA System)
 * =============================================================================
 */

-- 既存のスタバデータのみを特定して削除（再実行を可能にするため）
DELETE FROM services WHERE service_id LIKE 'SRV_STB_%';

-- 1. サービス本体の登録
INSERT INTO services (
    service_id, 
    owner_id, 
    plan_id, 
    title, 
    address, 
    geohash_9, 
    lat, 
    lng, 
    version
) VALUES 
-- --- 千代田区・大手町周辺エリア ---
('SRV_STB_001', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', '皇居外苑 和田倉噴水公園店', '東京都 千代田区 皇居外苑3-1', 'xn76ghn5r', 35.6841, 139.7612, 1),
('SRV_STB_002', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', '竹橋パレスサイド店', '東京都 千代田区 一ツ橋1-1-1 竹橋パレスサイドビルディング 1F', 'xn76hc9m6', 35.6913, 139.7578, 1),
('SRV_STB_003', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', 'ＫＤＤＩ大手町ビル店', '東京都 千代田区 大手町1-8-1 ＫＤＤＩ大手町ビル 1F', 'xn76hcbh9', 35.6883, 139.7618, 1),
('SRV_STB_004', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', '大手町東京サンケイビル店', '東京都 千代田区 大手町1-7-2 東京サンケイビル B1階', 'xn76hcbhy', 35.6874, 139.7634, 1),
('SRV_STB_005', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', '大手町ビル店', '東京都 千代田区 大手町1-6-1 大手町ビル', 'xn76hcbmz', 35.6865, 139.7631, 1),

-- --- 江戸川区エリア (小岩・葛西) ---
('SRV_STB_164', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', 'シャポー小岩店', '東京都 江戸川区 南小岩7-24-15', 'xn77ey27k', 35.7332, 139.8824, 1),
('SRV_STB_165', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', '葛西駅南口店', '東京都 江戸川区 東葛西6-2-1 RECS東葛西2階', 'xn76v88q0', 35.6635, 139.8732, 1),
('SRV_STB_166', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', '江戸川総合レクリエーション公園店', '東京都 江戸川区 南葛西3-23-9 江戸川総合レクリエーション公園 ファミリースポーツ広場', 'xn76v3hbh', 35.6558, 139.8727, 1),
('SRV_STB_167', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', '葛西臨海公園駅店', '東京都 江戸川区 臨海町6-3-4 葛西臨海公園駅高架下ビル', 'xn76v1rph', 35.6444, 139.8615, 1),

-- --- 武蔵村山エリア (郊外テスト用) ---
('SRV_STB_431', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', 'むさし村山新青梅街道店', '東京都 武蔵村山市 榎3-2-3', 'xn75rj567', 35.7483, 139.3875, 1),
('SRV_STB_432', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', 'イオンモールむさし村山1階店', '東京都 武蔵村山市 榎1-1-3 イオンモールむさし村山', 'xn75rj4ez', 35.7454, 139.3868, 1)
;

-- 2. カテゴリの一括紐付け (cat_cafe)
INSERT INTO service_category_rel (service_id, category_id)
SELECT service_id, 'cat_cafe' FROM services WHERE service_id LIKE 'SRV_STB_%';
/**
 * [ALETHEIA v1.9.0] Area Seed Data - Koiwa (koiwa.sql)
 * 役割：小岩エリアの実データ投入（アヤスカフェ小岩 / cafe bloom / サンライズ・カフェ）
 */

-- 1. アヤスカフェ小岩
INSERT OR REPLACE INTO services (
    service_id, owner_id, plan_id, ext_place_id, ext_source, 
    title, address, prefecture, city, lat, lng, 
    attributes_json, verification_level, version
) VALUES (
    'SRV_KOIWA_AYAS_001', NULL, 'free', 
    'GOOGLE_PLACE_AYAS_KOIWA', 'google', 
    '☕ アヤスカフェ小岩', '東京都江戸川区南小岩8丁目11-8ウイルコート小岩1F', '東京都', '江戸川区', 35.731720, 139.882140, 
    '{"facility": "ウイルコート1F", "payment": ["PayPay", "Rakuten Pay", "JCB", "AMEX"], "price_range": "1,000-2,000", "tel": "03-4361-8114", "url": "https://hotpepper.jp"}', 1, 1
);

-- 2. 地域活動支援センターこいわ～cafe bloom～
INSERT OR REPLACE INTO services (
    service_id, owner_id, plan_id, ext_place_id, ext_source, 
    title, address, prefecture, city, lat, lng, 
    attributes_json, verification_level, version
) VALUES (
    'SRV_KOIWA_BLOOM_002', NULL, 'free', 
    'GOOGLE_PLACE_CAFE_BLOOM', 'google', 
    '☕ 地域活動支援センターこいわ ～cafe bloom～', '東京都江戸川区南小岩7丁目19-7MACOビル2階', '東京都', '江戸川区', 35.733210, 139.880560, 
    '{"facility": "MACOビル2F", "payment": ["CASH_ONLY"], "type": "Medical/Welfare Counselor", "tel": "03-5655-9100"}', 1, 1
);

-- 3. サンライズ・カフェ
INSERT OR REPLACE INTO services (
    service_id, owner_id, plan_id, ext_place_id, ext_source, 
    title, address, prefecture, city, lat, lng, 
    attributes_json, verification_level, version
) VALUES (
    'SRV_KOIWA_SUNRISE_003', NULL, 'free', 
    'GOOGLE_PLACE_SUNRISE_CAFE', 'google', 
    '☕ サンライズ・カフェ', '東京都江戸川区東小岩6丁目18-17', '東京都', '江戸川区', 35.734780, 139.888560, 
    '{"payment": ["PayPay"], "price_range": "1-1,000", "tel": "03-3659-3585", "business_hours": {"open_start": "09:30"}}', 1, 1
);

-- カテゴリ紐付け（修正点：カンマとセミコロンの構成を適正化）
INSERT OR REPLACE INTO service_category_rel (service_id, category_id) VALUES 
('SRV_KOIWA_AYAS_001', 'cat_cafe'),
('SRV_KOIWA_BLOOM_002', 'cat_cafe'),
('SRV_KOIWA_SUNRISE_003', 'cat_cafe');
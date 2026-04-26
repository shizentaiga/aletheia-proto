/**
 * [ALETHEIA v1.9.0] Starbucks Data Converter
 * 役割：生データの住所正規化(Pref/City分離)および、設備情報のJSON集約。
 * 仕様：廃止されたservice_cafe_detailsを、services.attributes_jsonへ統合。
 * 特徴：将来の拡張性を維持しつつ、D1への1パス挿入を可能にする高密度シード生成。
 */

// 実行方法
// node scripts/convert_starbucks.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
    DB_ID: 'brand_starbucks',
    OWNER_ID: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    INPUT_JSON: path.join(__dirname, 'logs/st_all_raw.json'), 
    OUTPUT_SQL: path.join(__dirname, '../src/db/seed/chains/starbucks.sql'),
};

async function main() {
    console.log('🚀 [v1.9.0] JSON集約型・高密度変換を開始します...');

    try {
        if (!fs.existsSync(CONFIG.INPUT_JSON)) {
            console.error(`❌ 入力ファイルが見つかりません: ${CONFIG.INPUT_JSON}`);
            return;
        }

        const rawData = fs.readFileSync(CONFIG.INPUT_JSON, 'utf-8');
        const stores = JSON.parse(rawData);

        let totalSql = "-- ALETHEIA Starbucks Optimized Seeds (v1.9.0)\n-- Generated for D1 Compatibility (JSON Integrated)\n\n";

        stores.forEach((store) => {
            const f = store.fields;
            if (!f) return;

            const serviceId = `STB_${f.store_id}`;
            const extPlaceId = `STB_OFFICIAL_${f.store_id}`;
            
            // 1. 都道府県と市区町村の抽出
            const pref = f.address_1 || '';
            const city = f.address_2 || '';

            // 2. 住所のクレンジング
            let baseAddress = f.address_5.replace(/\s+/g, '');
            const cleanAddress = baseAddress.startsWith(pref) ? baseAddress : `${pref}${baseAddress}`;
            
            // 3. JSON属性の構築 (ここが今回の肝)
            const attributes = {
                wifi: f.public_wireless_service_flg === "1",
                reserve: f.reserve_flg === "1",
                // 営業時間情報などもJSONに入れておくと将来的に便利
                business_hours: {
                    mon_thu: f.business_day_mon_thu,
                    fri: f.business_day_fri,
                    sat: f.business_day_sat,
                    sun: f.business_day_sun
                }
            };

            // 4. エスケープ処理
            const escapedTitle = `スターバックス コーヒー ${f.name}`.replace(/'/g, "''");
            const escapedAddress = cleanAddress.replace(/'/g, "''");
            const escapedPref = pref.replace(/'/g, "''");
            const escapedCity = city.replace(/'/g, "''");
            const jsonString = JSON.stringify(attributes).replace(/'/g, "''"); // SQL用のエスケープ
            
            const [lat, lng] = f.location ? f.location.split(',') : ['NULL', 'NULL'];

            // --- SQL生成 ---
            
            // ① servicesテーブル (attributes_json カラムに集約)
            totalSql += `INSERT OR REPLACE INTO services (service_id, brand_id, owner_id, plan_id, ext_place_id, ext_source, title, address, prefecture, city, lat, lng, attributes_json, verification_level, version) VALUES ('${serviceId}', '${CONFIG.DB_ID}', '${CONFIG.OWNER_ID}', 'free', '${extPlaceId}', 'starbucks_official', '${escapedTitle}', '${escapedAddress}', '${escapedPref}', '${escapedCity}', ${lat}, ${lng}, '${jsonString}', 1, 1);\n`;
            
            // ② カテゴリ関連 (cat_cafe のみ)
            totalSql += `INSERT OR REPLACE INTO service_category_rel (service_id, category_id) VALUES ('${serviceId}', 'cat_cafe');\n`;
            
            // ※ 旧 step ③ (service_cafe_details) は廃止のため削除
        });

        const outputDir = path.dirname(CONFIG.OUTPUT_SQL);
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        fs.writeFileSync(CONFIG.OUTPUT_SQL, totalSql);
        console.log(`✨ 成功！ ${stores.length} 件を変換しました。`);
        console.log(`📍 出力先: ${CONFIG.OUTPUT_SQL}`);
        console.log(`✅ 設備情報を attributes_json へ集約完了。`);

    } catch (error) {
        console.error(`\n❌ エラーが発生しました: ${error.message}`);
    }
}

main();
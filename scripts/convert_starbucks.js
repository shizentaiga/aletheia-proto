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
    console.log('🚀 [修正版] ローカルJSONからの高度な変換を開始します...');

    try {
        if (!fs.existsSync(CONFIG.INPUT_JSON)) {
            console.error(`❌ 入力ファイルが見つかりません: ${CONFIG.INPUT_JSON}`);
            return;
        }

        const rawData = fs.readFileSync(CONFIG.INPUT_JSON, 'utf-8');
        const stores = JSON.parse(rawData);

        let totalSql = "-- ALETHEIA Starbucks Optimized Seeds (v1.8.0)\n-- Generated for D1 Compatibility\n\n";

        stores.forEach((store) => {
            const f = store.fields;
            if (!f) return;

            const serviceId = `STB_${f.store_id}`;
            const extPlaceId = `STB_OFFICIAL_${f.store_id}`;
            
            // 1. 都道府県と市区町村の確定
            const pref = f.address_1 || ''; // 例: 北海道
            const city = f.address_2 || ''; // 例: 札幌市中央区

            // 2. 住所のクレンジング (スペース除去)
            let baseAddress = f.address_5.replace(/\s+/g, '');
            // もし住所が都道府県から始まっていない場合のみ、先頭に付与
            const cleanAddress = baseAddress.startsWith(pref) ? baseAddress : `${pref}${baseAddress}`;
            
            // 3. 各種項目のエスケープ
            const escapedTitle = `スターバックス コーヒー ${f.name}`.replace(/'/g, "''");
            const escapedAddress = cleanAddress.replace(/'/g, "''");
            const escapedPref = pref.replace(/'/g, "''");
            const escapedCity = city.replace(/'/g, "''");
            
            const [lat, lng] = f.location ? f.location.split(',') : ['NULL', 'NULL'];
            const hasWifi = f.public_wireless_service_flg === "1" ? 1 : 0;

            // --- SQL生成 ---
            
            // ① servicesテーブル (prefecture, city カラムを埋める)
            totalSql += `INSERT OR REPLACE INTO services (service_id, brand_id, owner_id, plan_id, ext_place_id, ext_source, title, address, prefecture, city, lat, lng, verification_level, version) VALUES ('${serviceId}', '${CONFIG.DB_ID}', '${CONFIG.OWNER_ID}', 'free', '${extPlaceId}', 'starbucks_official', '${escapedTitle}', '${escapedAddress}', '${escapedPref}', '${escapedCity}', ${lat}, ${lng}, 1, 1);\n`;
            
            // ② カテゴリ関連 (cat_cafe)
            totalSql += `INSERT OR REPLACE INTO service_category_rel (service_id, category_id) VALUES ('${serviceId}', 'cat_cafe');\n`;
            
            // ③ カフェ詳細 (Wi-Fiフラグ)
            totalSql += `INSERT OR REPLACE INTO service_cafe_details (service_id, has_wifi) VALUES ('${serviceId}', ${hasWifi});\n`;
        });

        const outputDir = path.dirname(CONFIG.OUTPUT_SQL);
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        fs.writeFileSync(CONFIG.OUTPUT_SQL, totalSql);
        console.log(`✨ 成功！ ${stores.length} 件を変換しました。`);
        console.log(`📍 出力先: ${CONFIG.OUTPUT_SQL}`);
        console.log(`✅ prefecture/city カラムの補完と住所の正規化を完了しました。`);

    } catch (error) {
        console.error(`\n❌ エラーが発生しました: ${error.message}`);
    }
}

main();
// 実行方法
// node scripts/convert_starbucks.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modulesでのパス解決（成功済みファイルと同じ構成）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 設定
 */
const CONFIG = {
    DB_ID: 'brand_starbucks',
    OWNER_ID: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    INPUT_JSON: path.join(__dirname, 'logs/st_all_raw.json'), 
    OUTPUT_SQL: path.join(__dirname, '../src/db/seed/chains/starbucks.sql'),
};

async function main() {
    console.log('🚀 [JS版] ローカルJSONからの変換を開始します...');

    try {
        // 1. ファイルの存在確認
        if (!fs.existsSync(CONFIG.INPUT_JSON)) {
            console.error(`❌ 入力ファイルが見つかりません: ${CONFIG.INPUT_JSON}`);
            return;
        }

        // 2. JSONの読み込み
        const rawData = fs.readFileSync(CONFIG.INPUT_JSON, 'utf-8');
        const stores = JSON.parse(rawData);

        let totalSql = "-- ALETHEIA Starbucks Local Generated Seeds (v1.7.0)\n\n";

        // 3. 変換ループ
        stores.forEach((store) => {
            const f = store.fields;
            if (!f) return;

            const serviceId = `STB_${f.store_id}`;
            const extPlaceId = `STB_OFFICIAL_${f.store_id}`;
            
            // 成功済みJSと同じクレンジング・エスケープ処理
            const cleanAddress = f.address_5.replace(/\s+/g, '').replace(/'/g, "''");
            const title = `スターバックス コーヒー ${f.name.replace(/'/g, "''")}`;
            
            const [lat, lng] = f.location ? f.location.split(',') : ['NULL', 'NULL'];

            // servicesテーブル（1店舗1行の形式。Wi-Fi関連のインサートは削除）
            totalSql += `INSERT OR REPLACE INTO services (service_id, brand_id, owner_id, plan_id, ext_place_id, ext_source, title, address, prefecture, city, lat, lng, verification_level, version) VALUES ('${serviceId}', '${CONFIG.DB_ID}', '${CONFIG.OWNER_ID}', 'free', '${extPlaceId}', 'starbucks_official', '${title}', '${cleanAddress}', '${f.address_1}', '${f.address_2}', ${lat}, ${lng}, 1, 1);\n`;
        });

        // 4. 出力先ディレクトリの作成と書き込み
        const outputDir = path.dirname(CONFIG.OUTPUT_SQL);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(CONFIG.OUTPUT_SQL, totalSql);
        console.log(`✨ 成功！ ${stores.length} 件を変換し、${CONFIG.OUTPUT_SQL} に保存しました。`);

    } catch (error) {
        console.error(`\n❌ エラーが発生しました: ${error.message}`);
    }
}

main();
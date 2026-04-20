/**
 * =============================================================================
 * 【 ALETHEIA - Starbucks API Sync & Transformer (v1.3.0) 】
 * =============================================================================
 * 役割：公式サイト API から最新の店舗 JSON を取得し、D1 用シード SQL を自動生成する。
 * * ■ プロジェクト構造 (Work-tree)
 * root/
 * ├── src/db/seed/chains/           # [OUTPUT 1] 本番用シード配置先
 * │   └── starbucks.sql             # apply_seeds.sh が参照する本体
 * └── scripts/                      # 作業用ワークスペース
 * ├── fetch_and_convert_stb.js  # [MAIN] 本スクリプト
 * └── logs/                     # [OUTPUT 2] 作業ログ・一時保存
 * ├── st_all_raw.json       # 取得した全県分の生JSON（デバッグ用）
 * └── starbucks_gen.sql     # 変換結果のバックアップ
 * * ■ 設計思想 & 処理フロー (Data Pipeline)
 * 1. 【API連携】pref_code (01-47) をループし、ヘッダー偽装を用いて JSON を一括取得。
 * 2. 【ページネーション】'found' 値に基づき、100件超の店舗も漏れなく自動巡回。
 * 3. 【正規化】
 * - 座標：'location' (WGS84) を採用。
 * - 住所：'address_5' から不要な空白を除去し、都道府県開始ルールを適用。
 * - 設備：'public_wireless_service_flg' を has_wifi へマッピング。
 * 4. 【資産化】
 * - 'store_id' を元に 'STB_OFFICIAL_xxxx' という一意な ext_place_id を生成。
 * - INSERT OR REPLACE 形式で D1 への冪等性を担保。
 * * ■ 実行方法 (Execution)
 * $ node scripts/fetch_and_convert_stb.js
 * =============================================================================
 */

// ⭐️実行時間は、3秒 * 47都道府県に、さらに、ループ回数分が考慮されるので5分くらいかかるかも。

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modulesで __dirname を再現
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 設定
 */
const CONFIG = {
    DB_ID: 'brand_starbucks',
    OWNER_ID: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    OUTPUT_SQL: path.join(__dirname, '../src/db/seed/chains/starbucks.sql'),
    LOG_RAW: path.join(__dirname, 'logs/st_all_raw.json'),
    LOG_SQL_BACKUP: path.join(__dirname, 'logs/starbucks_gen.sql'),
    WAIT_MS: 3000, // サーバー負荷軽減のため3秒待機
};

/**
 * ユーティリティ：スリープ関数
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * スターバックスAPIからデータを取得する関数
 */
async function fetchStarbucksData(prefCode, start = 0) {
    const baseUrl = 'https://hn8madehag.execute-api.ap-northeast-1.amazonaws.com/prd-2019-08-21/storesearch';
    const params = new URLSearchParams({
        size: '100',
        'q.parser': 'structured',
        q: `(and ver:10000 record_type:1 pref_code:${prefCode})`,
        fq: "(and data_type:'prd')",
        sort: 'zip_code asc,store_id asc',
        start: start.toString()
    });

    const url = `${baseUrl}?${params.toString()}`;

    console.log(`📡 Requesting: [Pref:${prefCode}] Start:${start}...`);

    const response = await fetch(url, {
        headers: {
            'origin': 'https://store.starbucks.co.jp',
            'referer': 'https://store.starbucks.co.jp/',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} at Pref:${prefCode}`);
    }

    return await response.json();
}

/**
 * JSONデータをSQLに変換
 */
function convertToSql(hits) {
    let sqlLines = [];

    hits.forEach(hit => {
        const f = hit.fields;
        const storeId = f.store_id;
        const extPlaceId = `STB_OFFICIAL_${storeId}`;
        const serviceId = `STB_${storeId}`;
        
        // 住所クレンジング
        const cleanAddress = f.address_5.replace(/\s+/g, '');
        
        // 座標抽出
        const [lat, lng] = f.location ? f.location.split(',') : [null, null];
        
        // Wi-Fi
        const hasWifi = f.public_wireless_service_flg === "1" ? 1 : 0;

        // SQL生成
        sqlLines.push(`INSERT OR REPLACE INTO services (service_id, brand_id, owner_id, plan_id, ext_place_id, ext_source, title, address, lat, lng, verification_level) VALUES ('${serviceId}', '${CONFIG.DB_ID}', '${CONFIG.OWNER_ID}', 'free', '${extPlaceId}', 'starbucks_official', 'スターバックス コーヒー ${f.name.replace(/'/g, "''")}', '${cleanAddress}', ${lat}, ${lng}, 1);`);
        sqlLines.push(`INSERT OR REPLACE INTO service_category_rel (service_id, category_id) VALUES ('${serviceId}', 'cat_cafe');`);
        sqlLines.push(`INSERT OR REPLACE INTO service_cafe_details (service_id, has_wifi) VALUES ('${serviceId}', ${hasWifi});`);
    });

    return sqlLines.join('\n');
}

/**
 * メイン処理
 */
async function main() {
    try {
        if (!fs.existsSync(path.dirname(CONFIG.LOG_RAW))) {
            fs.mkdirSync(path.dirname(CONFIG.LOG_RAW), { recursive: true });
        }

        // 01(北海道)から47(沖縄)までのリストを作成
        const prefList = Array.from({ length: 47 }, (_, i) => (i + 1).toString().padStart(2, '0'));
        
        let allHits = [];
        let totalSql = "-- ALETHEIA Starbucks Nationwide Generated Seeds\n\n";

        console.log("🚀 Starting Nationwide Starbucks Data Acquisition...");
        console.log(`⏳ Estimated time: ~${Math.round((prefList.length * 1.2 * CONFIG.WAIT_MS) / 1000 / 60)} minutes\n`);

        for (const pref of prefList) {
            let start = 0;
            let hasMore = true;

            while (hasMore) {
                const data = await fetchStarbucksData(pref, start);
                const hits = data.hits.hit;
                
                if (hits && hits.length > 0) {
                    allHits.push(...hits);
                    totalSql += convertToSql(hits) + "\n";
                }

                const found = data.hits.found;
                start += 100;

                if (start >= found) {
                    hasMore = false;
                    // 次の都道府県に移る前にも待機を入れる
                    await sleep(CONFIG.WAIT_MS);
                } else {
                    // 同一県内のページネーション待機
                    console.log(`⏲️  Waiting ${CONFIG.WAIT_MS}ms for next page of Pref:${pref}...`);
                    await sleep(CONFIG.WAIT_MS);
                }
            }
        }

        fs.writeFileSync(CONFIG.OUTPUT_SQL, totalSql);
        fs.writeFileSync(CONFIG.LOG_SQL_BACKUP, totalSql);
        fs.writeFileSync(CONFIG.LOG_RAW, JSON.stringify(allHits, null, 2));

        console.log(`\n✨ Done!`);
        console.log(`- Total Records: ${allHits.length}`);
        console.log(`- Data Source: Official API (pref_code 01-47)`);
        console.log(`- Result Saved: ${CONFIG.OUTPUT_SQL}`);

    } catch (error) {
        console.error(`\n❌ Critical Error: ${error.message}`);
    }
}

main();
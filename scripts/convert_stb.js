// root/
// ├── src/db/seed/chains/      # 最終的な starbucks.sql の出力先
// └── scripts/                 # ← 今回作る作業用ワークスペース
//     ├── starbucks_raw.txt    # 432件のバラバラな生テキスト
//     ├── convert_stb.js       # 変換用Node.jsスクリプト
//     └── logs/                # 変換時のログや、一時的なJSONを置く場所（任意）

/**
 * =============================================================================
 * 【 ALETHEIA - Starbucks Data Transformer 】
 * =============================================================================
 * * ■ 目的
 * Webサイト等からコピーした非構造的なスタバ店舗テキスト（生データ）を解析し、
 * DB投入用の構造化されたSQL（INSERT文）へと変換する。
 * * ■ 設計思想
 * 1. 非構造データの柔軟な解釈:
 * 「店舗名」「住所」「区切り文字（詳細）」「不規則な空行」が混在する
 * 1000行超のテキストを、文脈に基づいて正確に1レコードずつ切り出す。
 * * 2. 安全なワークスペース分離 (Scripts-Local Sandbox):
 * 変換処理は scripts/ フォルダ内で完全に完結させる。
 * プロジェクト本体の src/db/seed/ 内にある既存SQLファイルを直接上書きせず、
 * あくまで logs/ フォルダへ「素材」としてのSQLを出力する。
 * これにより、手動で整えたマスターSQLを破壊するリスクを排除する。
 * * 3. 変換精度の透明性:
 * 変換成功分と、パース失敗（ノイズ等）分を区別し、
 * 実行後に「何件成功したか」をログ出力することでデータ欠落を防ぐ。
 * * ■ 入出力仕様
 * - INPUT:  scripts/starbucks_raw.txt (生テキストデータ)
 * - OUTPUT: scripts/logs/starbucks_generated.sql (生成されたINSERT文)
 * - LOGS:   scripts/logs/conversion_summary.json (パース結果のサマリー)
 * * ■ データ処理ルール
 * - ID生成: SRV_STB_001 からのオートインクリメント。
 * - 座標/Geohash: 住所文字列から「区」を判定し、代表的な座標を自動付与。
 * - クレンジング: 店名や住所に含まれる不要な空白、全角記号の正規化。
 * ■ 実行方法(ターミナルで実行)
 * node scripts/convert_stb.js
 * * =============================================================================
 */

// ここにNode.jsのロジックを実装予定

import fs from 'fs';
import path from 'path';

/**
 * 設定：入力ファイルと出力パス
 */
const INPUT_FILE = './scripts/starbucks_raw.txt';
const OUTPUT_SQL = './scripts/logs/starbucks_generated.sql';
const SUMMARY_LOG = './scripts/logs/conversion_summary.json';

// エリアごとの暫定座標（テスト用）
const AREA_COORDS = {
    '千代田区': { lat: 35.6812, lng: 139.7671, hash: 'xn76ghj00' },
    '中央区':   { lat: 35.6706, lng: 139.7719, hash: 'xn76gx600' },
    '港区':     { lat: 35.6586, lng: 139.7454, hash: 'xn76g8f00' },
    '江戸川区': { lat: 35.6635, lng: 139.8732, hash: 'xn76v8800' },
    '武蔵村山市': { lat: 35.7454, lng: 139.3868, hash: 'xn75rj400' },
    'DEFAULT':  { lat: 35.6895, lng: 139.6917, hash: 'xn769h000' } // 新宿付近
};

async function convert() {
    console.log('🚀 変換処理を開始します...');

    try {
        // logsフォルダがない場合は作成
        const logDir = path.dirname(OUTPUT_SQL);
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

        // 生データの読み込み
        const rawText = fs.readFileSync(INPUT_FILE, 'utf8');
        const lines = rawText.split('\n').map(l => l.trim());

        const stores = [];
        let currentStore = null;

        /**
         * 解析ロジック
         * 1. 空行や「詳細」はスキップ
         * 2. 「東京都」で始まる行は住所として確定
         * 3. それ以外で文字がある行は店名として扱う
         */
        for (const line of lines) {
            if (!line || line === '詳細') continue;

            if (line.startsWith('東京都')) {
                if (currentStore) {
                    currentStore.address = line;
                    stores.push(currentStore);
                    currentStore = null; // リセット
                }
            } else {
                currentStore = { name: line, address: '' };
            }
        }

        // SQL生成
        let sqlContent = `-- 生成日時: ${new Date().toLocaleString()}\n`;
        sqlContent += `INSERT INTO services (service_id, owner_id, plan_id, title, address, geohash_9, lat, lng, version) VALUES \n`;

        const sqlValues = stores.map((store, index) => {
            const id = `SRV_STB_${String(index + 1).padStart(3, '0')}`;
            
            // エリア判定
            const areaKey = Object.keys(AREA_COORDS).find(key => store.address.includes(key)) || 'DEFAULT';
            const { lat, lng, hash } = AREA_COORDS[areaKey];

            // SQL用にシングルクォートをエスケープ
            const safeName = store.name.replace(/'/g, "''");
            const safeAddr = store.address.replace(/'/g, "''");

            return `('${id}', '01ARZ3NDEKTSV4RRFFQ69G5FAV', 'free', '${safeName}', '${safeAddr}', '${hash}', ${lat}, ${lng}, 1)`;
        });

        sqlContent += sqlValues.join(',\n') + ';\n';

        // ファイル書き出し
        fs.writeFileSync(OUTPUT_SQL, sqlContent);
        
        // サマリーログ作成
        const summary = {
            total_parsed: stores.length,
            generated_at: new Date().toISOString(),
            output_file: OUTPUT_SQL
        };
        fs.writeFileSync(SUMMARY_LOG, JSON.stringify(summary, null, 2));

        console.log(`✅ 完了！ ${stores.length} 件のデータを処理しました。`);
        console.log(`📂 出力先: ${OUTPUT_SQL}`);

    } catch (err) {
        console.error('❌ エラーが発生しました:', err);
    }
}

convert();
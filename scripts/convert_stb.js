/**
 * =============================================================================
 * 【 ALETHEIA - Starbucks Data Transformer (v1.1.0) 】
 * =============================================================================
 * * ■ プロジェクト構造 (Work-tree)
 * root/
 * └── scripts/                  # 作業用ワークスペース
 * ├── starbucks_raw.txt     # [INPUT] 400件超の非構造化生テキスト
 * ├── convert_stb.js        # [MAIN] 変換用Node.jsスクリプト
 * └── logs/                 # [OUTPUT] 生成物およびログ
 * ├── starbucks_generated.sql  # DB投入用SQL (INSERT文)
 * └── conversion_summary.json  # パース結果サマリー
 * * ■ 設計思想 & 処理フロー
 * 1. 【安全設計】scripts/ フォルダ内のみで完結。外部ディレクトリへの影響を排除。
 * 2. 【動的解析】「店名行 → 住所行 → 制御文字(詳細等)」のパターンを文脈解析。
 * 3. 【先行登録モデル】緯度・経度・Geohashを排除し、住所ベースの登録に特化。
 * 4. 【データ品質】SQLエスケープ処理、IDのパディング(SRV_STB_001形式)を自動実施。
 * * ■ 入出力仕様 (I/O Specification)
 * - INPUT  : scripts/starbucks_raw.txt
 * - OUTPUT : scripts/logs/starbucks_generated.sql (Target: services table)
 * - LOGS   : scripts/logs/conversion_summary.json (Total count / Timestamp)
 * * ■ 実行方法 (Execution)
 * $ node scripts/convert_stb.js
 * * ■ 更新履歴 (Changelog)
 * - v1.0.0: 初版作成
 * - v1.1.0: スキーマ変更に伴い位置情報(Lat/Lng)を削除。パースロジックの堅牢化。
 * * =============================================================================
 */

import fs from 'fs';
import path from 'path';

// 設定：入出力パス（scriptsフォルダ内完結）
const INPUT_FILE = './scripts/starbucks_raw.txt';
const OUTPUT_SQL = './scripts/logs/starbucks_generated.sql';
const SUMMARY_LOG = './scripts/logs/conversion_summary.json';

// 固定値（管理者ID、ブランドID、プラン）
const OWNER_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAV'; // 管理者等の固定ID
const BRAND_ID = 'brand_starbucks';
const PLAN_ID  = 'free';

async function convert() {
    console.log('🚀 変換処理を開始します (Location Data Excluded mode)...');

    try {
        // 出力ディレクトリの準備
        const logDir = path.dirname(OUTPUT_SQL);
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

        // 生データの読み取り
        if (!fs.existsSync(INPUT_FILE)) {
            throw new Error(`入力ファイルが見つかりません: ${INPUT_FILE}`);
        }
        const rawText = fs.readFileSync(INPUT_FILE, 'utf8');
        const lines = rawText.split('\n').map(l => l.trim());

        const stores = [];
        let currentStoreName = null;

        /**
         * 解析ロジック：
         * 店名行 -> 住所行 -> 「詳細」または空行（無視）のサイクルを回す
         */
        for (const line of lines) {
            if (!line || line === '詳細') continue;

            // 住所行の判定（「東京都」から始まる前提）
            if (line.startsWith('東京都')) {
                if (currentStoreName) {
                    stores.push({
                        name: currentStoreName,
                        address: line
                    });
                    currentStoreName = null; // 登録完了したのでリセット
                }
            } else {
                // 住所でも「詳細」でも空行でもなければ店名とみなす
                currentStoreName = line;
            }
        }

        // SQL生成開始
        let sqlContent = `-- ALETHEIA Generated Starbucks Seed SQL\n`;
        sqlContent += `-- Generated at: ${new Date().toLocaleString()}\n`;
        sqlContent += `-- Total Records: ${stores.length}\n\n`;
        
        // 既存データの重複考慮のため、サービスID単位でのINSERT文
        sqlContent += `INSERT INTO services (service_id, brand_id, owner_id, plan_id, title, address, version) VALUES \n`;

        const sqlValues = stores.map((store, index) => {
            // ID生成: SRV_STB_001形式
            const id = `SRV_STB_${String(index + 1).padStart(3, '0')}`;
            
            // SQLインジェクション/エスケープ対策
            const safeName = store.name.replace(/'/g, "''");
            const safeAddr = store.address.replace(/'/g, "''");

            return `('${id}', '${BRAND_ID}', '${OWNER_ID}', '${PLAN_ID}', '${safeName}', '${safeAddr}', 1)`;
        });

        sqlContent += sqlValues.join(',\n') + ';\n';

        // 書き出し
        fs.writeFileSync(OUTPUT_SQL, sqlContent);
        
        // 処理サマリーの保存
        const summary = {
            status: "success",
            total_count: stores.length,
            target_brand: BRAND_ID,
            location_data: "excluded",
            output_path: OUTPUT_SQL,
            timestamp: new Date().toISOString()
        };
        fs.writeFileSync(SUMMARY_LOG, JSON.stringify(summary, null, 2));

        console.log(`✅ 完了！ ${stores.length} 件の店舗を抽出しました。`);
        console.log(`📂 SQL保存先: ${OUTPUT_SQL}`);
        console.log(`📄 ログ保存先: ${SUMMARY_LOG}`);

    } catch (err) {
        console.error('❌ 変換中にエラーが発生しました:', err.message);
    }
}

convert();
/**
 * =============================================================================
 * 【 ALETHEIA - Starbucks Data Transformer (v1.2.0) 】
 * =============================================================================
 * 役割：非構造化テキスト（生データ）から D1 投入用のシード SQL を自動生成する。
 * * ■ プロジェクト構造 (Work-tree)
 * root/
 * ├── src/db/seed/chains/           # [OUTPUT 1] 本番用シード配置先
 * │   └── starbucks.sql             # apply_seeds.sh が参照するファイル
 * └── scripts/                      # 作業用ワークスペース
 * ├── starbucks_raw.txt         # [INPUT] 400件超の非構造化生テキスト
 * ├── convert_stb.js            # [MAIN] 本スクリプト
 * └── logs/                     # [OUTPUT 2] 作業ログ
 * ├── starbucks_generated.sql # 変換結果のバックアップ
 * └── conversion_summary.json # 実行結果のサマリー
 * * ■ 設計思想 & 処理フロー
 * 1. 【安全設計】scripts/ 内で作業を完結させつつ、成功時のみ src/db へ反映。
 * 2. 【動的解析】「店名行 → 住所行 → 制御文字(詳細等)」のパターンを文脈解析。
 * 3. 【先行登録モデル】緯度・経度・Geohashを排除し、住所ベースの登録に特化。
 * 4. 【データ品質】SQLエスケープ、IDパディング、INSERT OR REPLACE を自動実施。
 * * ■ 入出力仕様 (I/O Specification)
 * - INPUT  : scripts/starbucks_raw.txt
 * - OUTPUT 1 : src/db/seed/chains/starbucks.sql (Application Seed)
 * - OUTPUT 2 : scripts/logs/starbucks_generated.sql (Log Backup)
 * - LOGS   : scripts/logs/conversion_summary.json (Execution Summary)
 * * ■ 実行方法 (Execution)
 * $ node scripts/convert_stb.js
 * * =============================================================================
 */

import fs from 'fs';
import path from 'path';

// 設定：入力パス
const INPUT_FILE = './scripts/starbucks_raw.txt';

// 設定：出力パス（1. 作業ログ用 / 2. DB運用シード用）
const OUTPUT_SQL_LOG = './scripts/logs/starbucks_generated.sql';
const OUTPUT_SQL_SEED = './src/db/seed/chains/starbucks.sql';
const SUMMARY_LOG = './scripts/logs/conversion_summary.json';

// 固定値（管理者ID、ブランドID、プラン）
const OWNER_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const BRAND_ID = 'brand_starbucks';
const PLAN_ID  = 'free';

async function convert() {
    console.log('🚀 変換処理を開始します (Multi-Output Mode)...');

    try {
        // --- 準備：出力ディレクトリの作成 ---
        [OUTPUT_SQL_LOG, OUTPUT_SQL_SEED, SUMMARY_LOG].forEach(filePath => {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 ディレクトリを作成しました: ${dir}`);
            }
        });

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

        // SQL生成
        let sqlContent = `-- ALETHEIA Generated Starbucks Seed SQL\n`;
        sqlContent += `-- Generated at: ${new Date().toLocaleString()}\n`;
        sqlContent += `-- Total Records: ${stores.length}\n\n`;
        
        // 既存データの重複考慮のため、INSERT OR REPLACE を使用
        sqlContent += `INSERT OR REPLACE INTO services (service_id, brand_id, owner_id, plan_id, title, address, version) VALUES \n`;

        const sqlValues = stores.map((store, index) => {
            // ID生成: SRV_STB_001形式
            const id = `SRV_STB_${String(index + 1).padStart(3, '0')}`;
            
            // SQLインジェクション/エスケープ対策
            const safeName = store.name.replace(/'/g, "''");
            const safeAddr = store.address.replace(/'/g, "''");

            return `('${id}', '${BRAND_ID}', '${OWNER_ID}', '${PLAN_ID}', '${safeName}', '${safeAddr}', 1)`;
        });

        sqlContent += sqlValues.join(',\n') + ';\n';

        // --- 書き出し処理 ---
        // 1. 作業ログへ保存（バックアップ用）
        fs.writeFileSync(OUTPUT_SQL_LOG, sqlContent);
        
        // 2. DBシード用ディレクトリへ保存 (apply_seeds.sh が参照する場所)
        fs.writeFileSync(OUTPUT_SQL_SEED, sqlContent);
        
        // 3. 処理サマリーの保存
        const summary = {
            status: "success",
            total_count: stores.length,
            target_brand: BRAND_ID,
            location_data: "excluded",
            outputs: {
                seed: OUTPUT_SQL_SEED,
                log: OUTPUT_SQL_LOG
            },
            timestamp: new Date().toISOString()
        };
        fs.writeFileSync(SUMMARY_LOG, JSON.stringify(summary, null, 2));

        console.log(`✅ 完了！ ${stores.length} 件の店舗を抽出しました。`);
        console.log(`📂 DBシード反映先: ${OUTPUT_SQL_SEED}`);
        console.log(`📄 ログ出力先: ${OUTPUT_SQL_LOG}`);

    } catch (err) {
        console.error('❌ 変換中にエラーが発生しました:', err.message);
    }
}

convert();
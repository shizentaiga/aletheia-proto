/**
 * =============================================================================
 * 【 ALETHEIA - データベース・クエリ層 / queries.ts 】
 * =============================================================================
 * 役割: D1(SQLite)に対するデータ操作ロジックを集約します。
 * * ■ パフォーマンス設計指針:
 * 1. 100万件規模のレコードを想定し、全件取得（SELECT *）は厳禁とする。
 * 2. 検索・一覧表示は「最大100件（定数管理）」に制限し、UIの応答性を担保。
 * 3. ページネーションや「もっと見る」に備え、取得時は常に「該当総数」も併せて取得する。
 * * ■ 地域コンテキスト設計:
 * - Cloudflare Workersのエッジ位置情報を起点とした動的フィルタリング。
 * - 階層構造（都道府県 > 市区町村）に基づいた集計クエリの実行。
 * * ■ 拡張性:
 * - 現時点では「店舗名」「住所」に特化。
 * - 将来的な「最寄駅」「お気に入りエリア」の実装を見据えた関数設計とする。
 * =============================================================================
 */

import { getPrefectureName, JP_REGIONS } from '../lib/constants';

// -----------------------------------------------------------------------------
// 1. 定数管理 (Config)
// -----------------------------------------------------------------------------

/**
 * 一覧表示における最大取得件数 (1ページあたりの件数)
 */
export const DISPLAY_LIMIT = 30;

// -----------------------------------------------------------------------------
// 2. 型定義 (Interfaces)
// -----------------------------------------------------------------------------

export interface Cafe {
  service_id: string;
  title: string;
  address: string;
  prefecture: string | null;
  city: string | null;
}

export interface RegionStat {
  name: string;
  count: number;
}

export interface FetchCafesResponse {
  cafes: Cafe[];
  totalCount: number;
  offset: number; // 現在のオフセット値を返す
}

// -----------------------------------------------------------------------------
// 3. Repository 関数群
// -----------------------------------------------------------------------------

/**
 * 3-1. カフェ一覧・検索取得 (fetchCafesByContext)
 * 地方指定、都道府県・市区町村、キーワード検索を統合して処理。
 * ユーザーが明示的に地域を指定していない場合は現在地を優先ソートします。
 */
export async function fetchCafesByContext(
  db: D1Database,
  options: { 
    region?: string;         // ユーザーが選択した絞り込み（kanto, 東京都, shibuya-ku等）
    detectedRegion?: string; // 現在地ヒント（Tokyo, Osaka等の生データ想定）
    keyword?: string; 
    offset?: number 
  } = {}
): Promise<FetchCafesResponse> {
  const { region, detectedRegion, keyword, offset = 0 } = options;
  
  let whereClauses: string[] = ["deleted_at IS NULL"];
  let whereParams: any[] = [];

  // --- 1. 地域フィルタの構築 (絞り込み) ---
  if (region) {
    const regionPrefectures = JP_REGIONS[region];

    if (regionPrefectures) {
      // 地方検索の場合（kanto等）：所属する全県をIN句で指定
      const placeholders = regionPrefectures.map(() => "?").join(", ");
      whereClauses.push(`prefecture IN (${placeholders})`);
      whereParams.push(...regionPrefectures);
    } else {
      // 個別の都道府県名・市区町村名での検索
      // constants.ts の変換関数を通し、英語名("Tokyo")でも日本語名に正規化
      const mappedPref = getPrefectureName(region);
      const targetValue = mappedPref || region;
      
      whereClauses.push("(prefecture = ? OR city = ?)");
      whereParams.push(targetValue, targetValue);
    }
  }

// --- 2. キーワード検索 (複合ワード対応) ---
  if (keyword) {
    // 全角・半角スペースで分割し、空の要素を除外
    const keywords = keyword.split(/[\s\u3000]+/).filter(Boolean);
    
    keywords.forEach(kw => {
      // 各単語が title または address のいずれかに含まれる (AND条件で蓄積)
      whereClauses.push("(title LIKE ? OR address LIKE ?)");
      whereParams.push(`%${kw}%`, `%${kw}%`);
    });
  }

  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;
  
  // --- 3. ソート順の構築 ---
  let sortClause = "created_at DESC";
  let sortParams: any[] = [];

  // 明示的な地域選択がない場合、現在地（detectedRegion）を最優先にする
  if (!region && detectedRegion) {
    // 🌟 重要: 生の現在地("Tokyo")を日本語("東京都")に変換してクエリに使用
    const jpnDetectedRegion = getPrefectureName(detectedRegion);
    if (jpnDetectedRegion) {
      sortClause = `CASE WHEN prefecture = ? THEN 0 ELSE 1 END, created_at DESC`;
      sortParams.push(jpnDetectedRegion);
    }
  }

  // --- 4. クエリ実行 ---
  const dataQuery = `
    SELECT service_id, title, address, prefecture, city
    FROM services
    ${whereSql}
    ORDER BY ${sortClause}
    LIMIT ? OFFSET ?
  `;

  const countQuery = `SELECT COUNT(*) as total FROM services ${whereSql}`;

  // bind順: [ソート用パラメータ, WHERE句用パラメータ, LIMIT, OFFSET](⭐️順序の誤りを修正。)
  const [dataResult, countResult] = await db.batch([
    db.prepare(dataQuery).bind(...whereParams, ...sortParams, DISPLAY_LIMIT, offset),
    db.prepare(countQuery).bind(...whereParams),
  ]);

  return {
    cafes: dataResult.results as unknown as Cafe[],
    totalCount: (countResult.results[0] as { total: number }).total,
    offset,
  };
}

/**
 * 3-2. 都道府県別・集計取得
 */
export async function getRegionStats(db: D1Database): Promise<RegionStat[]> {
  const query = `
    SELECT prefecture as name, COUNT(*) as count
    FROM services
    WHERE deleted_at IS NULL AND prefecture IS NOT NULL
    GROUP BY prefecture
    ORDER BY count DESC
    LIMIT ?
  `;
  const { results } = await db.prepare(query).bind(DISPLAY_LIMIT).all();
  return results as unknown as RegionStat[];
}

/**
 * 3-3. 市区町村別・集計取得
 */
export async function getCityStats(
  db: D1Database,
  prefecture: string
): Promise<RegionStat[]> {
  const query = `
    SELECT city as name, COUNT(*) as count
    FROM services
    WHERE deleted_at IS NULL AND prefecture = ? AND city IS NOT NULL
    GROUP BY city
    ORDER BY count DESC
    LIMIT ?
  `;
  const { results } = await db.prepare(query).bind(prefecture, DISPLAY_LIMIT).all();
  return results as unknown as RegionStat[];
}
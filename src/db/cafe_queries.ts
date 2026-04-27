/**
 * =============================================================================
 * 【 ALETHEIA - データベース・クエリ層 / queries.ts 】
 * =============================================================================
 * 役割: D1(SQLite)に対するデータ操作ロジックを集約します。
 * * ■ パフォーマンス設計指針:
 * 1. 100万件規模のレコードを想定し、全件取得（SELECT *）は厳禁とする。
 * 2. 検索・一覧表示は「定数管理（例：最大30件）」に制限し、UIの応答性を担保。
 * 3. ページネーションや「もっと見る」に備え、取得時は常に「該当総数」も併せて取得する。
 * 📁 File Path: src/db/cafe_queries.ts
* =============================================================================
 */

import { getPrefectureName, JP_REGIONS } from '../lib/constants';

// =============================================================================
// 1. 型定義 (Interfaces)
// =============================================================================

/**
 * カフェ情報の基本構造
 */
export interface Cafe {
  service_id: string;
  title: string;
  address: string;
  prefecture: string | null;
  city: string | null;
}

/**
 * 特定の地域単位（都道府県または市区町村）の集計データ
 */
export interface RegionStat {
  name: string;
  count: number;
}

/**
 * 全エリア（都道府県×市区町村）の集計データ
 */
export interface AreaStat {
  prefecture: string;
  city: string;
  count: number;
}

/**
 * 検索リクエストに対するレスポンス構造
 */
export interface FetchCafesResponse {
  cafes: Cafe[];
  totalCount: number;
  offset: number;
}

// =============================================================================
// 2. 定数管理 (Config)
// =============================================================================

/**
 * 一覧表示における最大取得件数 (1ページあたりの件数)
 */
export const DISPLAY_LIMIT = 30;

// =============================================================================
// 3. Repository 関数群 (Data Access)
// =============================================================================

/**
 * 3-1. カフェ一覧・検索取得 (fetchCafesByContext)
 * * 地方、都道府県・市区町村、キーワード検索を統合して処理。
 * 地域指定がない場合は、現在地（detectedRegion）を考慮したソートを行います。
 */
export async function fetchCafesByContext(
  db: D1Database,
  options: { 
    region?: string;         // ユーザー選択：地方(kanto), 都道府県(東京都), 市区町村(渋谷区)
    detectedRegion?: string; // システム検知：現在地ヒント (Tokyo 等)
    keyword?: string;        // 検索窓：キーワード
    offset?: number;
  } = {}
): Promise<FetchCafesResponse> {
  const { region, detectedRegion, keyword, offset = 0 } = options;
  
  let whereClauses: string[] = ["deleted_at IS NULL"];
  let whereParams: any[] = [];

  // --- A. 地域フィルタ (絞り込み) ---
  if (region) {
    const regionPrefectures = JP_REGIONS[region];

    if (regionPrefectures) {
      // 地方指定 (例: kanto) の場合
      const placeholders = regionPrefectures.map(() => "?").join(", ");
      whereClauses.push(`prefecture IN (${placeholders})`);
      whereParams.push(...regionPrefectures);
    } else {
      // 個別地域 (都道府県・市区町村) の場合
      const mappedPref = getPrefectureName(region);
      const targetValue = mappedPref || region;
      
      whereClauses.push("(prefecture = ? OR city = ?)");
      whereParams.push(targetValue, targetValue);
    }
  }

  // --- B. キーワード検索 (複合語対応) ---
  if (keyword) {
    const keywords = keyword.split(/[\s\u3000]+/).filter(Boolean);
    keywords.forEach(kw => {
      whereClauses.push("(title LIKE ? OR address LIKE ?)");
      whereParams.push(`%${kw}%`, `%${kw}%`);
    });
  }

  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;
  
  // --- C. ソート順の構築 ---
  let sortClause = "created_at DESC";
  let sortParams: any[] = [];

  // 地域未選択かつ現在地検知がある場合、当該地域を優先表示
  if (!region && detectedRegion) {
    const jpnDetectedRegion = getPrefectureName(detectedRegion);
    if (jpnDetectedRegion) {
      sortClause = `CASE WHEN prefecture = ? THEN 0 ELSE 1 END, created_at DESC`;
      sortParams.push(jpnDetectedRegion);
    }
  }

  // --- D. クエリ実行 ---
  const dataQuery = `
    SELECT service_id, title, address, prefecture, city
    FROM services
    ${whereSql}
    ORDER BY ${sortClause}
    LIMIT ? OFFSET ?
  `;

  const countQuery = `SELECT COUNT(*) as total FROM services ${whereSql}`;

  // bind順の整合性確保：WHERE句パラメータ -> ソート用パラメータ(CASE句) -> LIMIT/OFFSET
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
 * 3-2. 都道府県別・店舗数集計
 * 各都道府県ごとの有効な店舗数を取得します。
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
 * 3-3. 市区町村別・店舗数集計
 * 特定の都道府県内における、市区町村別の有効店舗数を取得します。
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

/**
 * 3-4. 全エリア別・店舗数集計 (getAllAreaStats)
 * 都道府県と市区町村のペアで集計し、店舗が存在するエリアのみを一覧化します。
 * フロントエンドでの動的な検索メニュー構築等に使用します。
 */
export async function getAllAreaStats(db: D1Database): Promise<AreaStat[]> {
  const query = `
    SELECT 
      prefecture, 
      city, 
      COUNT(*) as count
    FROM services
    WHERE deleted_at IS NULL 
      AND prefecture IS NOT NULL 
      AND city IS NOT NULL
    GROUP BY prefecture, city
    ORDER BY prefecture ASC, count DESC
  `;
  
  const { results } = await db.prepare(query).all();
  return results as unknown as AreaStat[];
}
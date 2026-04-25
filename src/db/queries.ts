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
export const DISPLAY_LIMIT = 100;

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
  offset: number; // 現在のオフセット値を返す（UI側での管理用）
}

// -----------------------------------------------------------------------------
// 3. Repository 関数群
// -----------------------------------------------------------------------------

/**
 * 3-1. カフェ一覧・検索取得 (fetchCafesByContext)
 * 地方(Region)指定、都道府県・市区町村、キーワード検索を統合して処理します。
 */
export async function fetchCafesByContext(
  db: D1Database,
  options: { 
    region?: string; 
    keyword?: string; 
    offset?: number 
  } = {}
): Promise<FetchCafesResponse> {
  const { region, keyword, offset = 0 } = options;
  
  let whereClauses: string[] = ["deleted_at IS NULL"];
  let params: any[] = [];

  // 1. 地域フィルタの正規化
  if (region) {
    // 🌟 A. 地方識別子 (kanto, tohoku 等) の判定
    const regionPrefectures = JP_REGIONS[region];

    if (regionPrefectures) {
      // 地方検索の場合：IN 句を用いて属する全県を対象にする
      const placeholders = regionPrefectures.map(() => "?").join(", ");
      whereClauses.push(`prefecture IN (${placeholders})`);
      params.push(...regionPrefectures);
    } else {
      // 🌟 B. 従来の都道府県・市区町村検索
      // Cloudflareの生データ(13, Tokyo等)を「東京都」形式に変換を試みる
      const mappedPref = getPrefectureName(region);
      
      if (mappedPref) {
        // 変換成功：マッピング後の日本語名で検索
        whereClauses.push("(prefecture = ? OR city = ?)");
        params.push(mappedPref, mappedPref);
      } else {
        // 変換不可：直接入力された名称（市区町村名や「東京都」など）として処理
        whereClauses.push("(prefecture = ? OR city = ?)");
        params.push(region, region);
      }
    }
  }

  // 2. キーワード検索
  if (keyword) {
    whereClauses.push("(title LIKE ? OR address LIKE ?)");
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;

  // --- クエリ実行 ---
  const dataQuery = `
    SELECT service_id, title, address, prefecture, city
    FROM services
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `SELECT COUNT(*) as total FROM services ${whereSql}`;

  const [dataResult, countResult] = await db.batch([
    db.prepare(dataQuery).bind(...params, DISPLAY_LIMIT, offset),
    db.prepare(countQuery).bind(...params),
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
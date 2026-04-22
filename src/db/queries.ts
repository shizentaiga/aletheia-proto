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

/**
 * =============================================================================
 * 【 ALETHEIA - データベース・クエリ層 / queries.ts 】
 * =============================================================================
 * 役割: D1(SQLite)に対するデータ操作ロジックを集約します。
 */

// -----------------------------------------------------------------------------
// 1. 定数管理 (Config)
// -----------------------------------------------------------------------------

/**
 * 一覧表示における最大取得件数
 * 100万件規模のデータがあっても、初期表示・検索結果はこの件数でクリップする
 */
const DISPLAY_LIMIT = 100;

// -----------------------------------------------------------------------------
// 2. 型定義 (Interfaces)
// -----------------------------------------------------------------------------

/**
 * 店舗情報の基本構造
 * Top.tsx / CafeCard.tsx の Props と完全に同期
 */
export interface Cafe {
  service_id: string;
  title: string;
  address: string;
  prefecture: string | null;
  city: string | null;
}

/**
 * 地域集計用構造
 * 都道府県や市区町村ごとの統計を表示する際に使用
 */
export interface RegionStat {
  name: string;  // 都道府県名 または 市区町村名
  count: number; // そのエリアに属する店舗数
}

/**
 * 一覧取得時の返却型
 * 常に該当総数を返すことで、UI側で「もっと見る」の要否を判定可能にする
 */
export interface FetchCafesResponse {
  cafes: Cafe[];
  totalCount: number;
}

// -----------------------------------------------------------------------------
// 3. Repository 関数群
// -----------------------------------------------------------------------------

/**
 * 3-1. カフェ一覧・検索取得 (fetchCafesByContext)
 * キーワード、または地域フィルタに基づき、表示用データを取得する。
 */
export async function fetchCafesByContext(
  db: D1Database,
  options: { region?: string; keyword?: string } = {}
): Promise<FetchCafesResponse> {
  const { region, keyword } = options;
  let whereClauses: string[] = ["deleted_at IS NULL"];
  let params: any[] = [];

  // 地域フィルタ (都道府県または市区町村の部分一致)
  if (region) {
    whereClauses.push("(prefecture = ? OR city = ?)");
    params.push(region, region);
  }

  // キーワード検索 (店名または住所の部分一致)
  if (keyword) {
    whereClauses.push("(title LIKE ? OR address LIKE ?)");
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // 1. データ取得クエリ
  const dataQuery = `
    SELECT service_id, title, address, prefecture, city
    FROM services
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ?
  `;

  // 2. 総件数取得クエリ
  const countQuery = `
    SELECT COUNT(*) as total FROM services ${whereSql}
  `;

  // D1のbatch実行を使用して、1回のラウンドトリップで両方取得
  const [dataResult, countResult] = await db.batch([
    db.prepare(dataQuery).bind(...params, DISPLAY_LIMIT),
    db.prepare(countQuery).bind(...params),
  ]);

  return {
    cafes: dataResult.results as unknown as Cafe[],
    totalCount: (countResult.results[0] as { total: number }).total,
  };
}

/**
 * 3-2. 都道府県別・集計取得 (getRegionStats)
 * 都道府県ごとの店舗数を集計し、店舗数が多い順（降順）で取得する。
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
 * 3-3. 市区町村別・集計取得 (getCityStats)
 * 指定された都道府県内における、市区町村ごとの店舗数を集計・取得する。
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

// -----------------------------------------------------------------------------
// 4. (Future) 拡張予約エリア
// -----------------------------------------------------------------------------
// TODO: 駅情報(transport_nodes)テーブルとのJOINによる「駅チカ検索」
// TODO: ユーザーのお気に入り(user_activities)に基づくパーソナライズ表示
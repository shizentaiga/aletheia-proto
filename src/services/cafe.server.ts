/**
 * =============================================================================
 * 【Aletheia - 店舗データ操作サービス / cafe.server.ts】
 * =============================================================================
 * ■ 役割: D1データベースへの直接アクセスと、ビジネスロジックの実行。
 * ■ 実行環境: Server Only (Cloudflare Workers)
 * -----------------------------------------------------------------------------
 */

// --- [1. 型定義の定義] ---
// このサービスが返却するデータの形状を定義します。
// UI側はこの型を参照することで、カラム名の打ち間違いを防止できます。
export type CafeResult = {
  title: string;
  station_context?: string;
};

/**
 * [CafeServerService]
 * 店舗データに関するデータベース操作をカプセル化したクラス（またはオブジェクト）。
 */
export const CafeServerService = {
  
  /**
   * エリア（Geohash）に基づいた店舗検索
   * @param db - index.tsx から渡される D1Database インスタンス
   * @param prefix - Geohashの前方一致クエリ
   * @returns 検索結果の配列
   */
  async searchByGeohash(db: D1Database, prefix: string): Promise<CafeResult[]> {
    // デバッグの指紋: サーバー側で動いていることを明示
    console.log(`[Server:Service] 検索開始 - prefix: ${prefix}`);

    try {
      // 複雑なクエリになっても、ここを修正するだけで済むよう隔離
      const { results } = await db
        .prepare("SELECT title, station_context FROM Services WHERE geohash LIKE ? LIMIT 10")
        .bind(`${prefix}%`)
        .all<CafeResult>();

      return results || [];
    } catch (error) {
      console.error("[Server:Service] データベースエラー:", error);
      throw new Error("Failed to fetch data from D1");
    }
  }
};
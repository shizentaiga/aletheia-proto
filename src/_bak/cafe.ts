/**
 * =============================================================================
 * 【  (アレテイア) - サービス/店舗データ・アクセス層 / cafe.ts】
 * =============================================================================
 * ■ 役割と設計思想
 * -----------------------------------------------------------------------------
 * 1. データ操作の集約: D1(SQLite)へのクエリを一手に引き受け、コントローラーを純粋に保つ。
 * 2. 実行時バリデーション: DBから取得したデータも、念のため `cafeSchema` で検閲。
 * 3. 空間検索の実装: Geohashを用いた前方一致検索により、近傍探索を高速化。
 * -----------------------------------------------------------------------------
 */

import { Cafe, CafeSummary } from '../types/cafe';
import { cafeSchema } from '../schemas/cafe';

/**
 * [CafeService クラス]
 * 静的メソッドを通じて、Cafeデータに関するCRUD操作を提供。
 * インスタンス化せずに呼び出せるようにし、Workersのメモリ消費を抑制します。
 */
export class CafeService {
  
  /**
   * 【取得】IDによる単一取得
   * @param db - D1Database インスタンス
   * @param id - ULID形式のID
   */
  static async getById(db: D1Database, id: string): Promise<Cafe | null> {
    console.log("🗄️ Service: getById 実行開始 - ID:", id);
    
    if (!db) {
      console.error("❌ Service: DBインスタンスが undefined です！Binding設定を確認してください。");
      return null;
    }

    try {
      const query = `SELECT * FROM Services WHERE id = ? LIMIT 1`;
      const result = await db.prepare(query).bind(id).first<Cafe>();
      
      if (!result) {
        console.log(`⚠️ Service: ID [${id}] に一致するデータが見つかりません。`);
        return null;
      }
      
      // DBから出した直後に「門番(Zod)」を通し、データの整合性を最終確認
      const parsed = cafeSchema.safeParse(result);
      if (!parsed.success) {
        console.error("❌ Service: Zodバリデーション失敗 (データ構造が不正です)", parsed.error);
        return null;
      }
      
      return parsed.data as Cafe;
    } catch (e) {
      console.error("❌ Service: getById で実行エラーが発生:", e);
      return null;
    }
  }

  /**
   * 【空間検索】Geohashによる近傍探索
   * @param db - D1Database インスタンス
   * @param prefix - 検索対象のGeohash前方部分（例: "xn76" = 東京周辺）
   * @returns 1行・高密度表示に適した CafeSummary の配列
   */
  static async getByGeohash(db: D1Database, prefix: string): Promise<CafeSummary[]> {
    console.log("🗄️ Service: getByGeohash 検索開始 - prefix:", prefix);
    
    if (!db) {
      console.error("❌ Service: DBインスタンスが undefined です！");
      return [];
    }

    /**
     * [SQL解説]
     * B-Treeインデックスが効く「前方一致検索」を利用。
     * 【注意】status = 'published' のデータのみを対象としています。
     * テストデータが表示されない場合は、DB内の status カラムを確認してください。
     */
    const query = `
      SELECT id, title, geohash, floor_info, station_context, status 
      FROM Services 
      WHERE geohash LIKE ? AND status = 'published'
      LIMIT 50
    `;
    
    try {
      // bind(`${prefix}%`) により "xn76..." で始まるデータを抽出
      const { results } = await db.prepare(query).bind(`${prefix}%`).all<CafeSummary>();
      
      const list = results || [];
      console.log(`✅ Service: クエリ完了 - ${list.length} 件取得`);
      return list;
    } catch (e) {
      console.error("❌ Service: getByGeohash 実行エラー:", e);
      return [];
    }
  }

  /**
   * 【保存】新規登録または更新 (Upsert)
   * @param db - D1Database インスタンス
   * @param data - 保存したいCafeオブジェクト
   */
  static async save(db: D1Database, data: Cafe): Promise<boolean> {
    console.log("🗄️ Service: save (Upsert) 実行開始 - ID:", data.id);

    try {
      // 保存前に「門番(Zod)」で厳格にチェック。不正なデータはDBに入れない。
      const validated = cafeSchema.parse(data);

      const query = `
        INSERT INTO Services (
          id, owner_id, status, geohash, lat, lng, address, 
          title, description, floor_info, station_context, 
          category_id, external_url, price_range, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status=excluded.status,
          geohash=excluded.geohash,
          lat=excluded.lat,
          lng=excluded.lng,
          address=excluded.address,
          title=excluded.title,
          description=excluded.description,
          floor_info=excluded.floor_info,
          station_context=excluded.station_context,
          category_id=excluded.category_id,
          external_url=excluded.external_url,
          price_range=excluded.price_range,
          updated_at=CURRENT_TIMESTAMP
      `;

      const result = await db.prepare(query).bind(
        validated.id, validated.owner_id, validated.status,
        validated.geohash, validated.lat, validated.lng, validated.address,
        validated.title, validated.description, validated.floor_info, validated.station_context,
        validated.category_id, validated.external_url, validated.price_range,
        validated.created_at, validated.updated_at
      ).run();

      console.log("✅ Service: save 成功");
      return result.success;
    } catch (e) {
      console.error("❌ Service: save 実行エラー:", e);
      return false;
    }
  }
}

/**
 * =============================================================================
 * 【開発者への申し送り：データベース運用の掟】
 * =============================================================================
 * 1. SQLの純粋性:
 * D1(SQLite)の特性を活かし、複雑なJOINよりもシンプルなWHERE検索を優先。
 * * 2. バリデーションの二重化:
 * 入口(Zod)と出口(SQL)の両方で型を縛ることで、データの腐敗(Data Corruption)を徹底的に防ぐ。
 * * 3. ステータス管理の罠:
 * 検索にヒットしない場合、SQLのミスよりも「status が published 以外になっている」
 * ケースが多い。デバッグ時はまず DB の中身を生の SQL で確認すること。
 * =============================================================================
 */
/**
 * =============================================================================
 * 【 ALETHEIA - データベース物理構造定義 / db.ts 】
 * =============================================================================
 * ■ 役割: D1 (SQLite) の各テーブルのカラム構造を1対1で定義する。
 * ■ 実行環境: Server-side (主に Repositories で使用)
 * -----------------------------------------------------------------------------
 * 💡 設計のポイント:
 * 1. schema.sql (v0.5.1) の物理設計を完全に反映する。
 * 2. 外部キー制約やステータスのリテラル型を定義し、不正なデータ操作を未然に防ぐ。
 * -----------------------------------------------------------------------------
 */

/** [users] ユーザー管理テーブル */
export type UserTable = {
  id: string;             // ULID or Google Sub
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'owner' | 'user';
  refresh_token: string | null;
  last_login_at: string | null;
  created_at: string;     // ISO8601 (DATETIME)
};

/** [services] 店舗・サービス基盤テーブル */
export type ServiceTable = {
  id: string;             // ULID
  owner_id: string;       // users.id (FK)
  status: 'draft' | 'published' | 'private' | 'archived';
  geohash: string;        // 空間検索用ハッシュ
  lat: number;
  lng: number;
  address: string | null;
  title: string;
  description: string | null;
  floor_info: string | null;
  station_context: string | null;
  category_id: number | null;
  external_url: string | null;
  price_range: string | null;
  created_at: string;
  updated_at: string;
};

/** [slots] 予約枠・証跡管理テーブル */
export type SlotTable = {
  id: string;
  service_id: string;     // services.id (FK)
  customer_id: string | null;
  user_email: string | null;
  booking_status: 'pending' | 'booked' | 'cancelled' | 'refunded' | 'no_show' | 'error';
  start_at_unix: number;  // 検索・計算用
  end_at_unix: number;
  actual_title: string;   // 不変性: 予約当時の店名
  actual_price: string | null; // 不変性: 予約当時の価格
  payment_intent_id: string | null;
  expires_at: number | null;
  created_at: string;
  updated_at: string;
};
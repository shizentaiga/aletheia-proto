import { ServiceTable } from './db';

/**
 * =============================================================================
 * 【 ALETHEIA - 店舗データ型定義 / cafe.types.ts 】
 * =============================================================================
 * ■ 役割: システム全体で使用される「店舗データ」の構造を論理的に定義する。
 * ■ 実行環境: Isomorphic (Server / Client 両方で参照可能)
 * -----------------------------------------------------------------------------
 * 💡 設計のポイント:
 * 1. db.ts の物理定義を Pick/Omit することで、DB構造との同期を保つ。
 * 2. 検索一覧表示(CafeResult)に必要な項目を厳選し、不要な情報漏洩を防ぐ。
 * -----------------------------------------------------------------------------
 */

/**
 * [CafeResult]
 * 検索一覧などで使用される、店舗の概要データ型。
 * D1 の ServiceTable から、表示に必要なカラムのみを抽出しています。
 */
export type CafeResult = Pick<
  ServiceTable,
  | 'id'
  | 'title'
  | 'geohash'
  | 'floor_info'
  | 'station_context'
  | 'category_id'
  | 'price_range'
> & {
  /** 距離計算などで使用するための緯度・経度（必須） */
  lat: number;
  lng: number;
};

/**
 * [CafeSearchResponse]
 * API エンドポイント (/api/search) が返却するレスポンス全体の型定義。
 */
export type CafeSearchResponse = {
  /** 検索にヒットした総件数 */
  total: number;
  /** 店舗データのリスト */
  items: CafeResult[];
};

/**
 * [CafeErrorResponse]
 * API エンドポイントがエラー時に返却する標準的な型。
 */
export type CafeErrorResponse = {
  /** エラー識別子 (例: "UNAUTHORIZED") */
  error: string;
  /** 開発者またはユーザー向けのメッセージ */
  message?: string;
};
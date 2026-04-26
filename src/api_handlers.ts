/**
 * =============================================================================
 * 【 ALETHEIA - APIハンドラ / ユーティリティ・ロジック 】
 * =============================================================================
 * 役割：
 * 1. フロントエンドからの非同期リクエストに対するデータ提供
 * 2. Hono Context からのパラメータ抽出および整形
 * 3. インフラ層（Cloudflare）に依存する情報のユーティリティ化
 * * 📁 File Path: src/api_handlers.ts
 * =============================================================================
 */

import { Context } from 'hono'
import { getAllAreaStats } from './db/cafe_queries'

/**
 * Cloudflare のコンテキストから位置情報（地理的情報）を抽出する
 * @param c - Hono Context
 * @returns { region, city, colo }
 */
export const getCloudflareLocation = (c: Context) => {
  // c.req.raw を unknown 経由でキャストして型安全にプロパティ参照
  const cf = (c.req.raw as unknown as { cf: any }).cf
  
  return {
    region: cf?.region || 'unknown',
    city: cf?.city || 'unknown',
    colo: cf?.colo || 'unknown'
  }
}

/**
 * リクエストのクエリパラメータから検索に必要な値を抽出し、型を整えて返す
 * @param c - Hono Context
 * @returns 検索パラメータオブジェクト
 */
export const getSearchParams = (c: Context) => {
  return {
    keyword: c.req.query('keyword') || '',
    region: c.req.query('region') || '',
    category: c.req.query('category') || '',
    offset: parseInt(c.req.query('offset') || '0', 10),
    detectedRegion: c.req.query('detectedRegion') || ''
  }
}

/**
 * [GET] /api/area-stats
 * 市区町村ごとの店舗数統計データを JSON 形式で返却する
 * @param c - Hono Context
 */
export const handleAreaStats = async (c: Context) => {
  const db = c.env.ALETHEIA_PROTO_DB
  
  try {
    // データベースからすべてのエリアの統計情報を取得
    const stats = await getAllAreaStats(db)
    
    // 成功時：フロントエンドが処理しやすい構造で JSON を返却
    return c.json({
      success: true,
      data: stats
    })
  } catch (e) {
    // 失敗時：エラーログを出力し、適切なステータスコードを返却
    console.error('Database fetch error:', e)
    return c.json(
      { 
        success: false, 
        message: 'Failed to fetch area stats' 
      }, 
      500
    )
  }
}
/**
 * APIハンドラおよびエンドポイントロジック
 * * フロントエンドからの非同期リクエスト（fetch）に対して、
 * データベースから取得したデータを JSON 形式でレスポンスします。
 * * 📁 File Path: src/api_handlers.ts
 */
import { Context } from 'hono'
import { getAllAreaStats } from './db/cafe_queries'

/**
 * [GET] /api/area-stats
 * エリアごとの店舗統計データ（各市区町村に何件店舗があるか）を返すハンドラ
 * * @param c - Honoのコンテキスト。環境変数（DB接続など）やリクエスト情報が含まれます。
 * @returns 統計データを含む JSON レスポンス
 */
export const handleAreaStats = async (c: Context) => {
  // Cloudflare Workers の D1 データベースなどの環境変数を取得
  const db = c.env.ALETHEIA_PROTO_DB
  
  try {
    // データベースからすべてのエリアの統計情報を取得
    // 戻り値の例: [{ prefecture: "東京都", city: "新宿区", count: 12 }, ...]
    const stats = await getAllAreaStats(db)
    
    // 成功時：フロントエンドが処理しやすい構造で JSON を返却
    return c.json({
      success: true,
      data: stats
    })
  } catch (e) {
    // 失敗時：エラー内容をログに出力し、適切なステータスコードを返却
    console.error('Database fetch error:', e)
    return c.json(
      { 
        success: false, 
        message: 'Failed to fetch area stats' 
      }, 
      500 // Internal Server Error
    )
  }
}
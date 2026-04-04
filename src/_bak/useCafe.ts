/**
 * =============================================================================
 * 【Aletheia (アレテイア) - サービス/店舗データ・カスタムフック / useCafe.ts】
 * =============================================================================
 * ■ 修正内容：Fetch 方式への移行（実行環境の断絶を解消）
 * -----------------------------------------------------------------------------
 * 1. サーバー依存の排除: 引数から db (D1Database) を削除。
 * 2. 通信プロトコルの変更: CafeService 経由の直接取得から fetch API 経由に変更。
 * 3. 疎通の正常化: ブラウザからサーバーの API 窓口 (/api/cafes) を叩くように変更。
 * -----------------------------------------------------------------------------
 */

import { useState, useCallback } from 'hono/jsx'
import { Cafe, CafeSummary } from '../types/cafe'

/**
 * [useCafe]
 * カフェデータに関する一連の挙動（アクション）をパッケージ化。
 * 修正後、db インスタンスは不要になりました。サーバーへの fetch がその役割を代行します。
 */
export const useCafe = () => {
  // --- 1. 状態 (State) の定義 ---
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [cafes, setCafes] = useState<CafeSummary[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);

  /**
   * 【アクション】エリア検索 (Geohash)
   * ブラウザからサーバーの API エンドポイントへリクエストを送ります。
   */
  const searchByArea = useCallback(async (geohash: string) => {
    console.log("🌐 Hook: API 検索リクエスト開始 - prefix:", geohash);
    
    setLoading(true);
    setError(null);
    
    try {
      /**
       * 修正の核心：直接 DB を叩かず、サーバーの API 窓口を叩く。
       * これにより、D1 へのアクセス権限を持つサーバー側が処理を代行します。
       */
      const response = await fetch(`/api/cafes?prefix=${encodeURIComponent(geohash)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const results: CafeSummary[] = await response.json();
      
      console.log(`✅ Hook: API 取得成功 - ${results.length} 件`);
      setCafes(results);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('エリア検索に失敗しました');
      console.error("❌ Hook: 通信エラー発生:", err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []); // db への依存がなくなったため、依存配列は空で OK

  /**
   * 【アクション】詳細取得 (将来用)
   * ※ 今回は一覧検索の疎通を優先し、構造のみ Fetch 形式に準拠させています。
   */
  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // 詳細取得用の API エンドポイントが実装された際に here で fetch します
      console.log("📍 Hook: fetchDetail (IDによる詳細取得は将来実装予定):", id);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('詳細情報の取得に失敗しました'));
    } finally {
      setLoading(false);
    }
  }, []);

  // --- 2. 外部へのインターフェース提供 ---
  return {
    cafes,
    selectedCafe,
    loading,
    error,
    searchByArea,
    fetchDetail
  };
};

/**
 * =============================================================================
 * 【開発者への申し送り：フック運用の掟（修正版）】
 * =============================================================================
 * 1. サーバー/クライアントの分離:
 * このフックはブラウザ上で動作することを前提としています。
 * fetch 先の URL (/api/cafes) が index.tsx で正しく定義されていることが必須です。
 * * 2. 疎通確認:
 * 検索ボタンを押しても動かない場合は、ブラウザの「ネットワーク」タブを確認し、
 * /api/cafes?prefix=... へのリクエストが 200 OK を返しているか見てください。
 * * 3. セキュリティ:
 * URL パラメータは encodeURIComponent で保護し、インジェクション対策を行っています。
 * =============================================================================
 */
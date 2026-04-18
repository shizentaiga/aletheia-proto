/**
 * =============================================================================
 * 【  - システム・エントリーポイント / index.tsx】
 * =============================================================================
 * 役割：ルーティングの定義と、各コンポーネント（Service, UI, Types）の接合。
 * * 💡 設計思想：
 * 現在は「動作の確実性」を確認しやすくするため、このファイルで全体を統括しています。
 * 開発規模が拡大した際には、各セクションのコメントに従い、
 * routes/ や types/ フォルダへ物理的に隔離・昇格させ、保守性を維持します。
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { CafeServerService } from './services/cafe.server'
import { HomeUI } from './components/Home.ui'

// --- [1. 型定義 (Infrastructure Types)] --------------------------------------
/**
 * 💡 将来の切り出し先: src/types/index.ts (または共通定義ファイル)
 * 理由: 環境変数(Bindings)は、DB操作だけでなく認証やストレージ(R2)など、
 * システム全体で参照されるため、一括管理することで型定義の重複を防ぎます。
 */
type Bindings = {
   _db: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// --- [2. サーバー側：APIエンドポイント] ---------------------------------------
/**
 * 💡 将来の切り出し先: src/routes/cafe.server.ts
 * 理由: 店舗検索以外に「お気に入り登録」「予約処理」「決済連携」等のAPIが増えた際、
 * index.tsx が肥大化して不具合の特定が難しくなるのを防ぐため、ドメインごとにルーティングを分割します。
 */
app.get('/api/search', async (c) => {
  const q = c.req.query('q') || 'xn76';
  
  try {
    /**
     * 【実行境界の遵守】
     * 直接SQLを書かず、cafe.server.ts (Service層) に実処理を委託します。
     * これにより、DBスキーマの変更があった際も Service 層の修正だけで完結します。
     */
    const results = await CafeServerService.searchByGeohash(c.env. _db, q);
    
    // 指紋ログ: サーバー側での正常終了を確認
    console.log(`[Server:API] 検索成功: ${results.length}件`);
    
    return c.json(results);
  } catch (e) {
    // ログに接頭辞を付け、エラーの発生源が「サーバーサイド」であることを明示
    console.error(`[Server:API] 致命的エラー: ${e}`);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// --- [3. クライアント側：ページレンダリング] ----------------------------------
/**
 * 💡 将来の構成変更:
 * 現在、HomeUI は内部に「ブリッジ・スクリプト（生のJS）」を保持していますが、
 * 本格的なフロントエンド開発（ハイドレーション）へ移行する際は、
 * スクリプト部分を src/hooks/useCafe.client.ts 等に昇格させ、
 * UIコンポーネントは純粋な「見た目」のみを定義する src/components/templates/ 配下へと整理します。
 */
app.get('/', (c) => {
  // 司令塔の役割：必要なデータ（タイトル等）を UI コンポーネントに注入して HTML を返却
  return c.html(<HomeUI title="  - 疎通確認済みモデル" />);
});

export default app
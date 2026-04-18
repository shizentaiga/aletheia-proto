/**
// src/
//  ├── index.tsx           # Hono：ルーティングとミドルウェアの定義のみ
//  ├── renderer.tsx        # 共通レイアウト・JSX設定 (公式HP踏襲)
//  ├── routes/             # 【新設】APIエンドポイントをドメイン別に分離
//  │    ├── cafe.server.ts # 店舗探索・予約API
//  │    └── auth.server.ts # 認証系API
//  ├── db/                 # 【公式準拠】
//  │    ├── schema.sql     # v0.5.1
//  │    ├── seed.sql       
//  │    └── repositories/  # データ操作ロジック
//  │         ├── service.repo.ts
//  │         └── slot.repo.ts
//  ├── components/         # 【公式準拠】UI部品
//  │    ├── Layout/        # ナビゲーション等
//  │    └── UI/            # 高密度リスト項目、検索バーなど
//  ├── pages/              # 【公式準拠】各画面のテンプレート
//  ├── client/             # 【公式準拠】ブラウザで動くJS (クライアントサイド)
//  │    └── useCafe.client.ts
//  ├── lib/                # サーバー側共通ロジック
//  │    ├── id-utils.ts    # ULID生成など
//  │    └── geohash.ts     # 地理計算ロジック
//  └── _sandbox/           # 【公式準拠】スクラップ＆ビルド用
//       └── tests/         # 01_google_auth.tsx 等
*/

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

/**
 * =============================================================================
 * 【 ALETHEIA - システム・エントリーポイント / index.tsx 】
 * =============================================================================
 * 役割：ルーティングの定義と、各コンポーネントの接合。
 */

/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
// 今後の実装に合わせて順次解除
// import { cafeRouter } from './routes/cafe.server'
import { sandboxApp } from './_sandbox/_router'

// Bindingsの型定義
type Bindings = {
  ALETHEIA_PROTO_DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// --- [Routes] ----------------------------------------------------------------

/**
 * Aletheia メイン機能（今後実装）
 * app.route('/api', cafeRouter)
 */

/**
 * 開発用サンドボックス
 * 実際のアドレス: /_sandbox/test00
 */
app.route('/_sandbox', sandboxApp)

// --- [Page Rendering] --------------------------------------------------------

app.get('/', (c) => {
  return c.text('ALETHEIA Prototype is running.')
})

export default app
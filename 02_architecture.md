# 02_Architecture (詳細設計詳細案)

## 1. システム構成・技術スタック（Cloudflare Native Stack）
本プロジェクトは、エッジコンピューティング（Cloudflare）の特性を最大限に活かし、低レイテンシかつスケーラブルな構成を採用する。

* **Frontend**: Hono JSX / Client-side Hydration
    * サーバーサイドレンダリング(SSR)を基本とし、動的UIのみクライアント側でハイドレーション（活性化）を行う。
* **Backend**: Hono (Cloudflare Workers)
    * TypeScriptによる型安全な開発。
* **Database**: Cloudflare D1 (SQLiteベース)
    * リレーショナルDBによる厳密なデータ整合性を確保。
* **Storage**: Cloudflare R2
    * S3互換オブジェクトストレージ。店舗画像やユーザーアセット用。

## 1.1 ソフトウェア・アーキテクチャ（Separation of Concerns）
130億人の規模に耐えうる拡張性と、不具合の所在を一瞬で特定できる「観測可能性」を両立するため、実行環境を物理的に分離する。

* **Service Layer (`*.server.ts`)**: 
    * 役割：D1操作、外部API連携、ビジネスロジック。
    * 制限：ブラウザに配信されるJSに含めてはならない。機密情報（DB Binding等）を扱う唯一の層。
* **Hook Layer (`*.client.ts`)**: 
    * 役割：Fetch通信、UIの状態管理（State）。
    * 制限：サーバー専用オブジェクト（D1Database等）に直接触れてはならない。必ずAPI経由で通信する。
* **View Layer (`*.ui.tsx`)**: 
    * 役割：Tailwind CSSを用いた純粋な見た目。
    * 制限：ロジックを一切含まず、Props（引数）を受け取って描画するのみとする。

---

## 2. データの進化プロセス（Data Evolution）
実装の確実性とスピードを両立するため、段階的なデータ移行戦略をとる。

### Phase 0: Static Discovery
* `public/reserve.json` をマスターデータとして参照し、UIプロトタイプを先行。

### Phase 1: Hybrid Auth & D1 Migration
* **D1完全移行**: JSONからリレーショナルDBへ。
* **DB Connection Test**: 本格的なコンポーネント化の前に、単一のAPIエンドポイントでSQLの疎通を100%保証する。

---

## 3. 認証・セッションプロトコル（Security Governance）
* **ローリング・セッション戦略**:
    * `SESSION_EXPIRY` 変数により、有効期限を動的に延長。
* **Google OAuth 2.0 連携**:
    * 初期100名の制限を「先行招待・有料枠」として活用。

---

## 4. UI/UXプロトコル（Trie-based Discovery）
* **1カラム・タップ・ファースト**: 
    * 5個の選択肢 × 3階層による階層型ナビゲーション。
* **URL設計**: 
    * 閲覧用: `/p/[id]` / 編集用: `/admin/[id]`
* **ルーティング・アイソレーション**:
    * `src/index.tsx` はルートの結合のみを行い、実体はドメインごとに分割する。

---

## 5. デバッグと疎通のガバナンス（Traceability Governance）

1. **実行境界の命名規則**:
    * ファイル名に `.server` または `.client` を付加し、インポート時に「実行場所」を視覚的に強制する。
2. **ログの署名ルール**:
    - サーバー側（D1/API）: `console.log("[Server:API] ...")` 
    - クライアント側（Fetch/Hook）: `console.log("[Client:Hook] ...")`
    これらにより、調査対象が「ターミナル」か「ブラウザコンソール」かを即座に判断する。
3. **API直叩き確認**:
    * 画面が更新されない不具合が発生した場合、コンポーネントの修正前に、APIエンドポイント（`/api/xxx`）にブラウザから直接アクセスし、生データ（JSON）の生存を確認する。
4. **Stripe Webhook と D1 の原子性（Atomicity）**:
    * 決済成功通知と在庫更新をトランザクションを用いて保護。
5. **Secret Management プロトコル**:
    * 秘匿情報は `wrangler secret put` による環境注入を絶対ルールとし、コードには一切記述しない。

---

## 6. 今後の実装方針（Component Migration）
現在の「シングルファイル(index.tsx)での疎通成功状態」から、以下の順序で安全に解体・部品化を進める。

1. `src/services/cafe.server.ts` へDBロジックを切り出し（APIでの動作確認）。
2. `src/components/Home.ui.tsx` へUI構造を切り出し（見た目の確認）。
3. `src/hooks/useCafe.client.ts` へFetchロジックを切り出し（ボタン動作の確認）。

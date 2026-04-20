# 02_Architecture: 詳細設計（v1.1）

## 1. システム構成・技術スタック（Cloudflare Native Stack）
本プロジェクトは、エッジコンピューティング（Cloudflare）の特性を最大限に活かし、低レイテンシかつスケーラブルな構成を採用する。

* **Frontend**: Hono JSX / Client-side Hydration
    * サーバーサイドレンダリング(SSR)を基本とし、動的UIのみクライアント側でハイドレーションを行うことで、高速な初期表示とインタラクティブ性を両立する。
* **Backend**: Hono (Cloudflare Workers)
    * TypeScriptによる型安全な開発。
* **Database**: Cloudflare D1 (SQLiteベース)
    * リレーショナルDBによる厳密なデータ整合性を確保。
* **Storage**: Cloudflare R2
    * S3互換オブジェクトストレージ。店舗アセットや将来的なユーザー投稿画像用。

### 1.1 ソフトウェア・アーキテクチャ（Separation of Concerns）
開発効率の向上と、不具合の所在を一瞬で特定できる「観測可能性」を両立するため、実行環境を物理的に分離する。

* **Service Layer (`*.server.ts`)**: 
    * 役割：D1操作、外部API連携、ビジネスロジック。
    * 制限：機密情報（DB Binding等）を扱う唯一の層であり、ブラウザ側へ配信されるJSに含まれてはならない。
* **Hook Layer (`*.client.ts`)**: 
    * 役割：Fetch通信、UIの状態管理（State）。
    * 制限：サーバー専用オブジェクト（D1Database等）に直接触れてはならず、必ずAPI経由で通信する。
* **View Layer (`*.ui.tsx`)**: 
    * 役割：Tailwind CSSを用いた純粋な見た目。
    * 制限：ロジックを一切含まず、Props（引数）を受け取って描画する。

---

## 2. データの進化プロセス（Data Evolution）
実装の確実性とスピードを両立するため、段階的な移行戦略をとる。

### Phase 0: Static Discovery
* `public/*.json` をマスターデータとして参照し、UIプロトタイプとデザインを先行。

### Phase 1: D1 Migration & Hybrid Auth
* **D1完全移行**: JSONからリレーショナルDBへ。`apply_seeds.sh` によるシード投入。
* **DB Connection Test**: コンポーネント化の前に、単一のAPIエンドポイントでSQLの疎通を100%保証する。

### Phase 2: Data Sublimation（データの昇華）
* ユーザーによる編集提案（`proposal_supports`）をD1へ蓄積し、外部API依存から自律データへと移行する。

---

## 3. 認証・セッションプロトコル（Security Governance）
* **ローリング・セッション戦略**:
    * `SESSION_EXPIRY` 変数により、有効期限を動的に延長し、開発・検証時の利便性とセキュリティを両立。
* **Google OAuth 2.0 連携**:
    * 初期100名の制限を逆手に取り、熱量の高い「先行招待・有料枠」として活用。

---

## 4. UI/UXプロトコル（Trie-based Discovery）
* **1カラム・タップ・ファースト**: 
    * 複雑な検索を避け、直感的なチップス選択による階層型ナビゲーションを採用。
* **URL設計**: 
    * 閲覧用: `/p/[service_id]` / 編集提案: `/edit/[service_id]`
* **ルーティング・アイソレーション**:
    * `src/index.tsx` はミドルウェア（認証等）の結合に特化し、各機能パスは `src/routes/` 下にカプセル化する。

---

## 5. デバッグと疎通のガバナンス（Traceability Governance）

1. **実行境界の命名規則**:
    * ファイル名に `.server` または `.client` を付加し、インポート時に実行場所を視覚的に強制する。
2. **ログの署名ルール**:
    - サーバー側: `console.log("[Server:API] ...")` 
    - クライアント側: `console.log("[Client:Hook] ...")`
3. **API直叩き確認**:
    * UIの不具合時、まずは `/api/xxx` に直接アクセスし、生データ（JSON）の生存を最初に確認する。
4. **Secret Management**:
    * APIキー等の秘匿情報は `wrangler secret put` で注入し、コードベースには一切記述しない。

---

## 6. 今後の実装方針（Component Migration）
「シングルファイルでの疎通成功」から、以下の順序で安全に解体・部品化を進める。

1. **`src/services/*.server.ts`**: DBクエリロジックの切り出し（API単体で動作確認）。
2. **`src/types/*.ts`**: Zodによるバリデーションスキーマの定義。
3. **`src/components/*.ui.tsx`**: UI構造の切り出し（見た目の確認）。
4. **`src/hooks/*.client.ts`**: Fetchロジックと状態管理の切り出し。
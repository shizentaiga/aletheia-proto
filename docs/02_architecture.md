# 02_Architecture (詳細設計詳細案)

## 1. システム構成・技術スタック（Cloudflare Native Stack）
本プロジェクトは、エッジコンピューティング（Cloudflare）の特性を最大限に活かし、低レイテンシかつスケーラブルな構成を採用する。

* **Frontend**: Hono JSX / Client-side Hydration
    * サーバーサイドレンダリング(SSR)を基本とし、チップス選択等の動的UIのみクライアント側でハイドレーション（活性化）を行う軽量構成。
* **Backend**: Hono (Cloudflare Workers)
    * TypeScriptによる型安全な開発。ミドルウェアを活用した認証・バリデーションの共通化。
* **Database**: Cloudflare D1 (SQLiteベース)
    * リレーショナルDBによる厳密なデータ整合性（予約・決済用）を確保。
* **Storage**: Cloudflare R2
    * S3互換オブジェクトストレージ。店舗画像やユーザーアセット用。
* **Secret Management**: `.dev.vars` (Local) / Cloudflare Secrets (Production)
    * SESSION_EXPIRY 等の環境変数による動的な挙動制御。

---

## 2. データの進化プロセス（Data Evolution）
実装の確実性とスピードを両立するため、段階的なデータ移行戦略をとる。

### Phase 0: Static Discovery
* `public/reserve.json` をマスターデータとして参照。
* UIのプロトタイプ検証と、チップス選択ロジック（5×3階層）のモックアップ作成に注力。

### Phase 1: Hybrid Auth & D1 Migration
* **D1完全移行**: JSONからリレーショナルDBへ。
* **初期スキーマ拡張**: 
    * `owner_google_id` (NULL許容): 将来の認証連携への接合部。
    * `refresh_token`: Google OAuthのリフレッシュトークン保存用。
    * `last_accessed_at`: ローリング・セッション（自動延命）判定用タイムスタンプ。

---

## 3. 認証・セッションプロトコル（Security Governance）
「インスタのような快適さ」と「開発の確実性」を両立するセッション設計。

* **ローリング・セッション戦略**:
    * `SESSION_EXPIRY` 変数により、最終アクセスから目標30日間の有効期限を動的に延長。
    * 開発環境では「1分/5分」の設定により、ログアウト・延命ロジックを時間圧縮して検証可能にする。
* **Google OAuth 2.0 連携**:
    * 初期100名の制限を「先行招待・有料枠」として戦略的に活用。
    * ステータス「Production」移行後に、大規模スケーラビリティを確保。

---

## 4. UI/UXプロトコル（Trie-based Discovery）
情報の海を「絞り込み」ではなく「辿り着き」で解決する設計。

* **1カラム・タップ・ファースト**: 
    * Honoのルーティングアルゴリズムを応用した階層型チップ選択。
    * 5個の選択肢 × 3階層 により、最小限のタップで125通りのエンドポイント（サービス）へ誘導。
* **URL設計（Flexible Routing）**: 
    * 閲覧用: `/p/[id]`（公開ページ）
    * 編集用: `/admin/[id]`（オーナー専用。OAuth認証必須）

---

## 5. 今後の技術的検討課題（Technical Next Actions）

1.  **Stripe Webhook と D1 の原子性（Atomicity）**:
    * 「決済成功通知」を受けてから「D1の在庫/予約枠」を更新するまでの一連の処理を、トランザクションを用いて保護する設計。
2.  **分散型ID生成ロジック**:
    * `/p/` 以降のIDは、推測困難かつ短縮可能な「Hashids」や「NanoID」の採用を検討（SEOおよびURLの美観のため）。
3.  **Cron Trigger による非同期演算**:
    * 1日1回のランキング集計バッチ。D1への負荷を考慮し、ピークタイムを避けた自動実行スケジュール。
4.  **マルチテナント決済（Stripe Connect）**:
    * ユーザー自身が決済主体となる「ルーター型決済代行」の法規制・技術要件の整理。
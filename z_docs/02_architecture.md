# 02_Architecture (詳細設計案)

## 1. システム構成・技術スタック
* **Frontend**: React (Hono JSX / Client-side Hydration)
* **Backend**: Hono (Cloudflare Workers)
* **Database**: Cloudflare D1 (SQLite)
* **Storage**: Cloudflare R2 (画像等のアセット用)

## 2. データの流れと保持
* **Phase 0**: `public/reserve.json` をマスターデータとして参照。
* **Phase 1**: D1へ完全移行。初期スキーマに `owner_google_id` (NULL許容) を定義し、将来のGoogle認証連携に備える。

## 3. UI/UXプロトコル
* **1カラム・タップ・ファースト**: カテゴリチップ選択による絞り込みを主導線とする。
* **ルーティング**: 閲覧用 (`/p/[id]`) と編集用を分離し、実装の確実性を優先。

## 4. 今後の検討課題（Next Actions）
1.  **D1移行タイミング**: 登録データが何件を超えた時点でJSONからDBへ切り替えるか。
2.  **決済・予約の具体フロー**: Stripe等の外部決済と、D1上の在庫（時間枠）更新をどう同期させるか。
3.  **バッチ処理の設計**: Cron Triggerを用いたランキング集計の具体的な演算タイミング。
4.  **固有ドメインの選定**: `/p/` 以降のID生成ロジック（UUIDか、ハッシュ値か）。
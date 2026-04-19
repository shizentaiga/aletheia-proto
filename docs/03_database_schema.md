# 03_Database_Design (データベース概要と設計仕様)

## 1. データの役割と設計思想
ALETHEIAのデータベースは、単なる記録場所ではなく、**「真理の追求」と「円滑な予約体験」を支えるインフラ**として設計されています。
Cloudflare D1の特性を活かし、高密度・低遅延なレスポンスを実現しつつ、運用時の「人間による直感的な修復可能性」を重視します。

* **インフラ**: SQLite (Cloudflare D1)
* **設計原則 (Zen)**: 
    - 状態変数を最小化し、`booked_by` の有無を唯一の真実とする。
    - 複雑な結合を避けるため、空間インデックス（Geohash）や論理削除を活用。
* **ID体系**: 分散環境での一意性と時系列ソートを両立するため **`ULID`** を採用。

---

## 2. 主要データの定義と実装仕様

### ① ユーザー情報 (Users)
事業資産としての顧客リストと権限管理を担います。
* **実装定義**:
    - `user_id` (PK/TEXT): 内部管理用ID (**ULID**)
    - `email` (TEXT, UNIQUE): 連絡先兼、一意識別子
    - `display_name` (TEXT): 表示名
    - `role` (TEXT): 権限 (`admin` / `owner` / `user`) ※CHECK制約あり
    - `plan_id` (FK/TEXT): サブスクリプションプランID (NOT NULL)
    - `deleted_at` (DATETIME): 論理削除フラグ

### ② サービス情報 (Services)
「誰が」「どこで」価値を提供しているかを管理するマスターデータです。
* **ビジネス上の意味**: 
    - `geohash_9` による前方一致検索で、ミリ秒単位の近傍探索を実現。
    - `version` カラムによる楽観的ロックで、同時編集時の衝突を回避。
* **実装定義**:
    - `service_id` (PK/TEXT): サービス固有ID (**ULID**)
    - `owner_id` (FK/TEXT): Users.user_id と紐付け (**RESTRICT**)
    - `geohash_9` (TEXT): **空間インデックス** (前方一致検索用)
    - `lat` / `lng` (REAL): 緯度・経度 (地図演算用)
    - `title` (TEXT) / `address` (TEXT)
    - `updated_by` (FK/TEXT): 最終更新者ID (監査用)
    - `deleted_at` (DATETIME): 論理削除フラグ

### ③ 予約・時間枠 (Slots)
サービス提供者の「時間」という在庫を、極限までシンプルな状態で管理します。
* **実装定義**:
    - `slot_id` (PK/TEXT): 枠固有ID (**ULID**)
    - `service_id` (FK/TEXT): Services.service_id と紐付け (**CASCADE**)
    - `start_at_unix` (INTEGER): 開始時刻 (UNIXタイムスタンプ)
    - `duration_minutes` (INTEGER): 枠の長さ (デフォルト60分)
    - `booked_by` (FK/TEXT, NULL許容): 予約した Users.user_id (**RESTRICT**)
    - `version` (INTEGER): 予約衝突回避用のカウンター
* **予約ロジック**: `booked_by IS NULL` を空き枠の唯一の条件とし、Update時の条件指定により早い者勝ちの整合性を担保する。

### ④ 改善提案と支持 (Governance)
「壊れても人間が直せる」ための、コミュニティによるデータ品質維持機構です。
* **実装定義**:
    - **Proposals**: どの項目の修正案（`proposed_value`）を誰が提案したか。
    - **Supports**: 提案に対する「賛成」の記名投票記録。
* **整合性**: `support_count` を直接持たず、別テーブルでの `COUNT()` 集計に寄せることで、同時更新の競合と二重投票を構造的に排除する。

---

## 3. 安全性と透明性
* **削除ポリシー (v1.5-Zen)**: 
    - ユーザー削除時、活動履歴や提案支持は連鎖削除（`CASCADE`）される。
    - ただし「進行中の予約（Slots）」がある場合のみ、物理削除を `RESTRICT` でブロックし、ビジネス上の事故を防ぐ。
* **パフォーマンス**: 
    - 有効な（`deleted_at IS NULL`）データのみを対象とした部分インデックス（Partial Index）を多用し、データ増大後も検索速度を維持する。

---

## 4. 検討課題（Next Actions）
1. **空間検索の検証**: D1における `LIKE 'geohash%'` のインデックス効力の再確認。
2. **Schema-Sync**: Zod (TypeScript層) と `schema.sql` (DB層) の定義を同期する自動化プロセスの構築。
3. **物理削除プロトコル**: 「忘れられる権利」に基づく退会処理の実装。特に `booked_by` に制約がある状態でのユーザー削除フロー。
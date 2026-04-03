# 03_Database_Design (データベース概要と設計仕様)

## 1. データの役割と設計思想
Aletheiaのデータベースは、単なる記録場所ではなく、**「信頼」と「偶然の出会い」を支えるインフラ**として設計されています。
応答速度を最優先し、複雑な結合を避けるため適度に非正規化を許容します。

* **インフラ**: SQLite (Cloudflare D1)
* **共通仕様**: 全テーブルに `created_at`, `updated_at` を標準装備。
* **ID体系**: 連番（AUTOINCREMENT）を廃止し、時系列ソート可能かつ推測困難な **`ULID`** を採用。

---

## 2. 主要データの定義と実装仕様

### ① ユーザー情報 (Users)
将来の完全自社認証移行と、事業資産としての顧客リストを管理します。
* **実装定義**:
    - `id` (PK/TEXT): 内部管理用ID (**ULID**)
    - `google_sub` (TEXT, UNIQUE): Google認証の一意識別子
    - `display_name` (TEXT): 表示名
    - `avatar_url` (TEXT): プロフィール画像URL (外部参照)
    - `role` (TEXT): 権限 (admin / owner / user)

### ② サービス情報 (Services)
「誰が」「どこで」価値を提供しているかを管理します。
* **ビジネス上の意味**: 
    - Geohashによる高速な近傍検索を実現。
    - `owner_id` により、Usersテーブルとリレーションを形成。
* **実装定義**:
    - `id` (PK/TEXT): サービス固有ID (**ULID**)
    - `owner_id` (FK/TEXT): Users.id と紐付け
    - `category_id` (INT): カテゴリ分類
    - `geohash` (TEXT): **空間インデックス** (前方一致検索用 6〜8桁)
    - `lat` / `lng` (REAL): 緯度・経度 (地図表示・距離計算用)
    - `title` (TEXT) / `description` (TEXT)
    - `external_url` (TEXT): 外部誘導先URL
    - `status` (TEXT): 公開状態 (draft / published / private)

### ③ 予約・時間枠 (Schedules)
サービス提供者の「時間」という在庫を管理します。
* **実装定義**:
    - `id` (PK/TEXT): 枠固有ID (**ULID**)
    - `service_id` (FK/TEXT): Services.id と紐付け
    - `start_datetime` / `end_datetime` (DATETIME)
    - `is_booked` (BOOLEAN): 予約済みフラグ
    - `reserved_by` (FK/TEXT, NULL許容): 予約した Users.id
    - `stripe_payment_id` (TEXT, NULL許容): 決済照合用ID

### ④ 活動ログ (Logs)
「共鳴」を導き出すための、非公開の行動履歴です。
* **実装定義**:
    - `id` (PK/TEXT): ログ固有ID
    - `user_id` (FK/TEXT): アクションを実行した Users.id
    - `service_id` (FK/TEXT): 対象サービスID
    - `action_type` (TEXT): view / click
    - `timestamp` (DATETIME): 発生時刻

---

## 3. 安全性と透明性
* **データの所有権**: ユーザー自身のデータは、いつでもCSV等でエクスポート可能な状態を維持します。
* **プライバシー**: 行動履歴は統計処理（近傍演算）にのみ使用され、個別の履歴が第三者に公開されることはありません。

---

## 4. 検討課題（Next Actions）
1. **空間検索のクエリ**: D1における `LIKE 'geohash%'` のインデックス効力と速度検証。
2. **スキーマ同期**: `src/schemas/` (Zod) と `schema.sql` の定義を厳格に一致させる。
3. **データ消去**: ユーザー退会時における「忘れられる権利」に基づく物理削除プロトコル。
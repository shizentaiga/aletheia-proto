/**
 * =============================================================================
 * 【 ALETHEIA - Database Schema (v1.6.0-Zen-Refined) 】
 * =============================================================================
 * 役割：情報の「種」から「資産」への成長を許容する、高密度地点データベース。
 * 特徴：不完全なデータ（座標なし等）の登録を許容し、ユーザーの熱量で補完する構造。
 * * ■ プロジェクト構造
 * -- src/
 * -- └── db/
 * --     ├── schema.sql            (テーブル定義：常に全削除・全作成)
 * --     ├── seed/
 * --     │   ├── _core.sql         (基盤：プラン、カテゴリ、システムadminなど)
 * --     │   ├── chains/           (大規模地点データ：ブランド別に管理)
 * --     │   │   ├── starbucks.sql (スタバ：約1,900店舗)
 * --     │   │   ├── mcdonalds.sql (マクドナルド：約3,000店舗)
 * --     │   │   └── doutor.sql    (ドトール：約1,000店舗)
 * --     │   └── development.sql    (開発用：テスト予約枠・活動メモなど)
 * --     └── apply_seeds.sh         (依存関係を考慮した一括流し込みスクリプト)
 * * ■ 実行コマンド
 * -----------------------------------------------------------------------------
 * [LOCAL]  npx wrangler d1 execute ALETHEIA_PROTO_DB --local  --file=./src/db/schema.sql
 * [REMOTE] npx wrangler d1 execute ALETHEIA_PROTO_DB --remote --file=./src/db/schema.sql 
 * -----------------------------------------------------------------------------
 * * ■ 設計思想：情報の「動的成長」モデル
 * 1. 「器」としての地点登録：座標やオーナーが不明でも、名前と住所があれば登録可能。
 * 2. 外部との疎結合：Google Place ID 等を保持し、独自データと公式データを共存させる。
 * 3. 民主的なクレンジング：提案（Proposals）と支持（Supports）による表記ゆれの自然淘汰。
 * 4. 個人の体験保護：地点が統合・変化しても、ユーザーの「活動メモ」は独立して維持。
 * =============================================================================
 */

-- 0. データベース設定
PRAGMA foreign_keys = OFF; -- 削除時の制約エラーを防ぐため一時オフ

-- 1. テーブルの初期化
-- 依存関係（子テーブル）から順に削除し、最後に親テーブルを消す
DROP TABLE IF EXISTS proposal_supports;      -- 親: service_proposals
DROP TABLE IF EXISTS service_proposals;     -- 親: services, users
DROP TABLE IF EXISTS user_activities;       -- 親: services, users
DROP TABLE IF EXISTS service_cafe_details;  -- 親: services
DROP TABLE IF EXISTS service_category_rel;  -- 親: services, categories
DROP TABLE IF EXISTS slots;                 -- 親: services, users
DROP TABLE IF EXISTS services;              -- 親: brands, users, access_plans
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;                 -- 親: access_plans
DROP TABLE IF EXISTS access_plans;          -- 全ての基盤（最後に削除）

PRAGMA foreign_keys = ON; -- 作成前にオンに戻す

-- 2. アクセスプラン
-- ユーザーの権限やリソース制限（お気に入り数、編集可否）を定義
CREATE TABLE access_plans (
    plan_id            TEXT PRIMARY KEY,
    display_name       TEXT NOT NULL,
    max_favorites      INTEGER DEFAULT 10,  -- お気に入り登録の上限
    max_memo_length    INTEGER DEFAULT 60,  -- 1地点あたりのメモ文字数
    can_propose_edits  BOOLEAN DEFAULT FALSE, -- 地点情報の修正提案ができるか
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. ユーザーテーブル
CREATE TABLE users (
    user_id        TEXT PRIMARY KEY,
    email          TEXT UNIQUE NOT NULL,
    display_name   TEXT,
    role           TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin', 'owner')),
    plan_id        TEXT DEFAULT 'free' NOT NULL,
    last_login_at  DATETIME,
    deleted_at     DATETIME,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES access_plans(plan_id) ON DELETE RESTRICT
);

-- 4. ブランド & カテゴリ
-- ブランドはチェーン店判定に使用。カテゴリは「カフェ」「喫茶店」等のタグ管理。
CREATE TABLE brands (
    brand_id     TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    is_chain     BOOLEAN DEFAULT TRUE,
    official_url TEXT
);

CREATE TABLE categories (
    category_id  TEXT PRIMARY KEY,
    display_name TEXT NOT NULL
);

-- 5. サービス・店舗テーブル（ALETHEIAの核）
-- 座標(lat/lng)をNULL許容にすることで、名前と住所のみの「先行登録」を実現。
CREATE TABLE services (
    service_id      TEXT PRIMARY KEY,
    brand_id        TEXT,
    -- 初期はオーナー不在（一般ユーザーの発見）を想定しNULLを許容
    owner_id        TEXT, 
    plan_id         TEXT DEFAULT 'free' NOT NULL,
    
    -- 外部ID連携：Google ID等を保持し、後の表記ゆれ統合や自動更新の「フック」にする
    ext_place_id    TEXT, -- Google Place ID など
    ext_source      TEXT, -- データ元（'google', 'user_manual' など）
    
    title           TEXT NOT NULL, -- 店名（表記ゆれがあっても一旦許容）
    address         TEXT NOT NULL, -- 住所
    
    -- 地理情報：後から高精度な座標を入力できるよう制約を排除
    geohash_9       TEXT, -- 検索・タイル管理用のハッシュコード
    lat             REAL, -- 緯度
    lng             REAL, -- 経度
    
    updated_by      TEXT, -- 最後に編集したユーザー
    version         INTEGER DEFAULT 1, -- 同時実行制御用のバージョン
    -- 検証ステータス：0(未検証), 1(座標確定), 2(オーナー確認済)
    verification_level INTEGER DEFAULT 0, 
    
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at      DATETIME, -- 論理削除用
    
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (plan_id)  REFERENCES access_plans(plan_id) ON DELETE RESTRICT
);

-- 地点とカテゴリの多対多リレーション
CREATE TABLE service_category_rel (
    service_id  TEXT,
    category_id TEXT,
    PRIMARY KEY (service_id, category_id),
    FOREIGN KEY (service_id)  REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- 6. カテゴリ特有詳細
-- 基本属性（店名・住所）以外の「カフェならでは」の属性を分離
CREATE TABLE service_cafe_details (
    service_id      TEXT PRIMARY KEY,
    has_wifi        BOOLEAN DEFAULT FALSE,
    has_power       BOOLEAN DEFAULT FALSE,
    seating_capacity INTEGER,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- 7. ユーザー活動テーブル（個人の体験を記録）
-- 地点情報が統合されても、ユーザーの「メモ」はここに紐付いて保護される
CREATE TABLE user_activities (
    activity_id      TEXT PRIMARY KEY,
    user_id          TEXT NOT NULL,
    service_id       TEXT NOT NULL,
    
    favorited_at     DATETIME, -- お気に入り登録日時
    visited_at       DATETIME, -- 最終訪問日時
    
    tentative_date   TEXT, -- 予定日（文字列で柔軟に保持）
    personal_memo    TEXT, -- 自分専用の非公開メモ
    
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, service_id), -- 1ユーザー1地点1活動を保証
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- 8. 改善提案テーブル
-- 表記ゆれの「マージ（統合）」や、座標の「後付け」をユーザーに依頼する仕組み
CREATE TABLE service_proposals (
    proposal_id      TEXT PRIMARY KEY,
    service_id       TEXT NOT NULL, -- 対象地点
    user_id          TEXT NOT NULL, -- 提案者
    field_name       TEXT NOT NULL, -- 'lat_lng', 'title', 'merge_with' 等
    proposed_value   TEXT NOT NULL, -- 修正後の値（統合時は相手のID）
    status           TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    resolved_by      TEXT, -- 承認/却下した管理者
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 8.5 提案支持テーブル
-- 民主的なデータクレンジング。一定以上の支持で自動承認する運用も可能
CREATE TABLE proposal_supports (
    proposal_id      TEXT NOT NULL,
    user_id          TEXT NOT NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (proposal_id, user_id),
    FOREIGN KEY (proposal_id) REFERENCES service_proposals(proposal_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE
);

-- 9. 予約可能枠 (Slots)
-- 早い者勝ち（Optimistic Lock）を実現するためのバージョン管理を含む
CREATE TABLE slots (
    slot_id          TEXT PRIMARY KEY,
    service_id       TEXT NOT NULL,
    start_at_unix    INTEGER NOT NULL, -- 検索効率のためUnixTimeで保持
    duration_minutes INTEGER DEFAULT 60,
    booked_by        TEXT, -- 予約者ID
    version          INTEGER DEFAULT 1, -- 競合検知用
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(service_id, start_at_unix),
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (booked_by)  REFERENCES users(user_id) ON DELETE RESTRICT
);

-- 10. パフォーマンス・インデックス
-- 座標(Geohash)が確定している地点のみを地図検索対象として高速化
CREATE INDEX idx_services_geo_lookup ON services(geohash_9) WHERE geohash_9 IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_slots_available ON slots(service_id, start_at_unix) WHERE booked_by IS NULL;
CREATE INDEX idx_user_activity_lookup ON user_activities(user_id, service_id);
CREATE INDEX idx_proposal_service_status ON service_proposals(service_id, status);

-- 11. 自動更新トリガー
-- アプリ層での実装漏れを防ぎ、updated_atを自動的に最新に保つ
CREATE TRIGGER IF NOT EXISTS trigger_services_updated_at
AFTER UPDATE ON services FOR EACH ROW 
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE services SET updated_at = CURRENT_TIMESTAMP WHERE service_id = NEW.service_id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_user_activities_updated_at
AFTER UPDATE ON user_activities FOR EACH ROW 
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE user_activities SET updated_at = CURRENT_TIMESTAMP WHERE activity_id = NEW.activity_id;
END;
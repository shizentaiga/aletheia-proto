/**
 * =============================================================================
 * 【 ALETHEIA - Database Schema (v1.7.0-Zen-Refined) 】
 * =============================================================================
 * 役割：情報の「種」から「資産」への成長を許容する、高密度地点データベース。
 * 特徴：不完全なデータ（座標なし等）の登録を許容し、ユーザーの熱量で補完する構造。
 * * ■ v1.7.0 変更点:
 * 1. 認証基盤の拡張：Google ID受容のため users テーブルを柔軟化。
 * 2. 役割・状態のマスタ化：CHECK制約を卒業し、ID(INT)管理のマスタテーブルを導入。
 * 3. 空間検索インフラ：日本全体の分類と検索の入り口として transport_nodes を追加。
 * 4. メンテナンス性：論理削除(deleted_at)と状態管理を統合し、移行に強い構造へ。
 * * ■ プロジェクト構造
 * -- src/
 * -- └── db/
 * --     ├── schema.sql            (テーブル定義：常に全削除・全作成)
 * --     ├── seed/
 * --     │   ├── _core.sql         (基盤：プラン、ロール、状態、カテゴリ等)
 * --     │   ├── chains/           (ブランド別地点データ)
 * --     │   └── development.sql   (開発・テスト用データ)
 * --     └── apply_seeds.sh         (依存関係を考慮した流し込み)
 * =============================================================================
 */

-- 0. データベース設定
PRAGMA foreign_keys = OFF; -- 削除時の制約エラーを防ぐため一時オフ

-- 1. テーブルの初期化
DROP TABLE IF EXISTS transport_nodes;
DROP TABLE IF EXISTS proposal_supports;
DROP TABLE IF EXISTS service_proposals;
DROP TABLE IF EXISTS user_activities;
DROP TABLE IF EXISTS service_cafe_details;
DROP TABLE IF EXISTS service_category_rel;
DROP TABLE IF EXISTS slots;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS role_definitions;
DROP TABLE IF EXISTS status_definitions;
DROP TABLE IF EXISTS access_plans;

PRAGMA foreign_keys = ON; -- 作成前にオンに戻す

-- 2. アクセスプラン & マスタ定義
CREATE TABLE access_plans (
    plan_id           TEXT PRIMARY KEY,
    display_name       TEXT NOT NULL,
    max_favorites      INTEGER DEFAULT 10,
    max_memo_length    INTEGER DEFAULT 60,
    can_propose_edits  BOOLEAN DEFAULT FALSE,
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 役割定義 (0:USER, 1:ADMIN, 2:OWNER等)
CREATE TABLE role_definitions (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- 状態定義 (提案の状態やユーザーの状態をID管理)
CREATE TABLE status_definitions (
    id      INTEGER PRIMARY KEY,
    context TEXT NOT NULL, -- 'PROPOSAL', 'USER', 'NODE' 等
    name    TEXT NOT NULL
);

-- 3. ユーザーテーブル (Googleログイン対応)
CREATE TABLE users (
    user_id        TEXT PRIMARY KEY,
    google_id      TEXT UNIQUE,       -- Google Auth ID
    email          TEXT UNIQUE,       -- 将来の他認証を考慮しNULL許容可
    display_name   TEXT,
    role_id        INTEGER DEFAULT 0 NOT NULL,
    status_id      INTEGER DEFAULT 0 NOT NULL, -- 0:ACTIVE, 1:DELETED等
    plan_id        TEXT DEFAULT 'free' NOT NULL,
    last_login_at  DATETIME,
    deleted_at     DATETIME,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES role_definitions(id),
    FOREIGN KEY (plan_id) REFERENCES access_plans(plan_id) ON DELETE RESTRICT
);

-- 4. 交通ノード (駅・バス停：日本全体を分類するデータベースの核)
CREATE TABLE transport_nodes (
    node_id        TEXT PRIMARY KEY,
    name           TEXT NOT NULL,       -- "小岩駅"
    type           TEXT NOT NULL,       -- 'station', 'bus_stop'
    line_name      TEXT,                -- '総武線'
    geohash_9      TEXT NOT NULL,
    lat            REAL NOT NULL,
    lng            REAL NOT NULL,
    address_prefix TEXT,                -- '東京都江戸川区'（絞り込み用）
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. ブランド & カテゴリ
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

-- 6. サービス・店舗テーブル
CREATE TABLE services (
    service_id      TEXT PRIMARY KEY,
    brand_id        TEXT,
    owner_id        TEXT, 
    plan_id         TEXT DEFAULT 'free' NOT NULL,
    
    ext_place_id    TEXT, -- Google Place ID等
    ext_source      TEXT,
    
    title           TEXT NOT NULL,
    address         TEXT NOT NULL,
    
    geohash_9       TEXT,
    lat             REAL,
    lng             REAL,
    
    updated_by      TEXT,
    version         INTEGER DEFAULT 1,
    verification_level INTEGER DEFAULT 0, 
    
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at      DATETIME,
    
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

-- 7. カテゴリ特有詳細 (カフェ等)
CREATE TABLE service_cafe_details (
    service_id       TEXT PRIMARY KEY,
    has_wifi         BOOLEAN DEFAULT FALSE,
    has_power        BOOLEAN DEFAULT FALSE,
    seating_capacity INTEGER,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- 8. ユーザー活動テーブル (お気に入り・メモ)
CREATE TABLE user_activities (
    activity_id      TEXT PRIMARY KEY,
    user_id          TEXT NOT NULL,
    service_id       TEXT NOT NULL,
    
    favorited_at     DATETIME,
    visited_at       DATETIME,
    
    tentative_date   TEXT,
    personal_memo    TEXT, -- 最大60文字想定（アプリ層でバリデーション）
    
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, service_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- 9. 改善提案テーブル
CREATE TABLE service_proposals (
    proposal_id      TEXT PRIMARY KEY,
    service_id       TEXT NOT NULL,
    user_id          TEXT NOT NULL,
    field_name       TEXT NOT NULL,
    proposed_value   TEXT NOT NULL,
    status_id        INTEGER DEFAULT 0 NOT NULL, -- status_definitions参照
    resolved_by      TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 提案支持テーブル
CREATE TABLE proposal_supports (
    proposal_id      TEXT NOT NULL,
    user_id          TEXT NOT NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (proposal_id, user_id),
    FOREIGN KEY (proposal_id) REFERENCES service_proposals(proposal_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE
);

-- 10. 予約可能枠 (Slots)
CREATE TABLE slots (
    slot_id          TEXT PRIMARY KEY,
    service_id       TEXT NOT NULL,
    start_at_unix    INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    booked_by        TEXT,
    version          INTEGER DEFAULT 1,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(service_id, start_at_unix),
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (booked_by)  REFERENCES users(user_id) ON DELETE RESTRICT
);

-- 11. パフォーマンス・インデックス
-- 地図検索：座標および削除フラグ
CREATE INDEX idx_services_geo ON services(geohash_9) WHERE deleted_at IS NULL;
-- ブランド絞り込み検索
CREATE INDEX idx_services_brand_geo ON services(brand_id, geohash_9) WHERE deleted_at IS NULL;
-- 重複登録防止
CREATE UNIQUE INDEX uidx_services_ext_place_id ON services(ext_place_id) WHERE ext_place_id IS NOT NULL;
-- 交通ノード検索
CREATE INDEX idx_nodes_geo ON transport_nodes(geohash_9);
CREATE INDEX idx_nodes_lookup ON transport_nodes(address_prefix, type);
-- 予約枠
CREATE INDEX idx_slots_available ON slots(service_id, start_at_unix) WHERE booked_by IS NULL;

-- 12. 自動更新トリガー
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
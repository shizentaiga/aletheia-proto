/**
-- src/
-- └── db/
--     ├── schema.sql            (テーブル定義：常に全削除・全作成)
--     ├── seed/
--     │   ├── _core.sql         (基盤：プラン、カテゴリ、システムadminなど)
--     │   ├── chains/
--     │   │   ├── starbucks.sql (スタバ：約1,900店舗)
--     │   │   ├── mcdonalds.sql (マクドナルド：約3,000店舗)
--     │   │   └── doutor.sql    (ドトール：約1,000店舗)
--     │   └── development.sql   (開発用：テスト予約枠など)
--     └── apply_seeds.sh        (一括流し込みスクリプト)
 */

/**
 * =============================================================================
 * ■ 実行コマンド
 * -----------------------------------------------------------------------------
 * [LOCAL]  npx wrangler d1 execute ALETHEIA_PROTO_DB --local  --file=./src/db/schema.sql
 * [REMOTE] npx wrangler d1 execute ALETHEIA_PROTO_DB --remote --file=./src/db/schema.sql
 * -----------------------------------------------------------------------------
 * =============================================================================
 */

/**
 * =============================================================================
 * 【 ALETHEIA - Database Schema (v1.5.0-Zen-Refined) 】
 * =============================================================================
 * 役割：高密度・低遅延、そして「人間が直感的に直せる」筋肉質な構造。
 * * 主な変更点 (v1.4.0 -> v1.5.0):
 * 1. 複雑性の排除：証跡保持(SET NULL)を廃止。ユーザー削除時は関連データも CASCADE。
 * 2. 開発体験の向上：user_activities を CASCADE に戻し、店舗物理削除を容易に。
 * 3. 整合性の維持：plan_id NOT NULL や CHECK 制約、booked_by RESTRICT は継続採用。
 * 4. 構造の純粋化：proposal_supports は PRIMARY KEY 構成に戻し、支持の重複を完全封鎖。
 * =============================================================================
 */

/** ⭐️注意事項
 * 予約（早い者勝ち）の実装には、以下の条件を必須とする。
--  UPDATE slots 
--  SET booked_by = ?, version = version + 1 
--  WHERE slot_id = ? AND booked_by IS NULL AND version = ?;
 */

-- 0. データベース設定
PRAGMA foreign_keys = ON;

-- 1. テーブルの初期化
DROP TABLE IF EXISTS proposal_supports;
DROP TABLE IF EXISTS service_proposals;
DROP TABLE IF EXISTS user_activities;
DROP TABLE IF EXISTS service_cafe_details;
DROP TABLE IF EXISTS service_category_rel;
DROP TABLE IF EXISTS slots;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS access_plans;
DROP TABLE IF EXISTS users;

-- 2. アクセスプラン
CREATE TABLE access_plans (
    plan_id            TEXT PRIMARY KEY,
    display_name       TEXT NOT NULL,
    max_favorites      INTEGER DEFAULT 10,
    max_memo_length    INTEGER DEFAULT 60,
    can_propose_edits  BOOLEAN DEFAULT FALSE,
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

-- 5. サービス・店舗テーブル
CREATE TABLE services (
    service_id      TEXT PRIMARY KEY,
    brand_id        TEXT,
    owner_id        TEXT NOT NULL,
    plan_id         TEXT DEFAULT 'free' NOT NULL,
    
    title           TEXT NOT NULL,
    address         TEXT NOT NULL,
    geohash_9       TEXT NOT NULL,
    lat             REAL NOT NULL,
    lng             REAL NOT NULL,
    
    updated_by      TEXT,
    version         INTEGER DEFAULT 1,
    verification_level INTEGER DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at      DATETIME,
    
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (plan_id)  REFERENCES access_plans(plan_id) ON DELETE RESTRICT
);

-- 多対多：カテゴリ対応
CREATE TABLE service_category_rel (
    service_id  TEXT,
    category_id TEXT,
    PRIMARY KEY (service_id, category_id),
    FOREIGN KEY (service_id)  REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- 6. カテゴリ特有詳細
CREATE TABLE service_cafe_details (
    service_id      TEXT PRIMARY KEY,
    has_wifi        BOOLEAN DEFAULT FALSE,
    has_power       BOOLEAN DEFAULT FALSE,
    seating_capacity INTEGER,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- 7. ユーザー活動テーブル
CREATE TABLE user_activities (
    activity_id      TEXT PRIMARY KEY,
    user_id          TEXT NOT NULL,
    service_id       TEXT NOT NULL,
    
    favorited_at     DATETIME,
    visited_at       DATETIME,
    
    tentative_date   TEXT, -- v1.2の精神に基づき、制約をアプリ層へ戻しシンプル化
    personal_memo    TEXT,
    
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, service_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- 8. 改善提案テーブル
CREATE TABLE service_proposals (
    proposal_id      TEXT PRIMARY KEY,
    service_id       TEXT NOT NULL,
    user_id          TEXT NOT NULL,         -- NOT NULLに戻し、型安全性を優先
    field_name       TEXT NOT NULL,
    proposed_value   TEXT NOT NULL,
    status           TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    resolved_by      TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 8.5 提案支持テーブル
CREATE TABLE proposal_supports (
    proposal_id      TEXT NOT NULL,
    user_id          TEXT NOT NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (proposal_id, user_id),     -- 複合主キーで一貫性を担保
    FOREIGN KEY (proposal_id) REFERENCES service_proposals(proposal_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE
);

-- 9. 予約可能枠 (Slots)
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
    -- 「予約が入っている」という事実を守るため、ここだけは RESTRICT を維持
    FOREIGN KEY (booked_by)  REFERENCES users(user_id) ON DELETE RESTRICT
);

-- 10. パフォーマンス・インデックス
CREATE INDEX idx_services_lookup ON services(geohash_9) WHERE deleted_at IS NULL;
CREATE INDEX idx_slots_available ON slots(service_id, start_at_unix) WHERE booked_by IS NULL;
CREATE INDEX idx_user_activity_lookup ON user_activities(user_id, service_id);
CREATE INDEX idx_proposal_service_status ON service_proposals(service_id, status);

-- 11. 自動更新トリガー
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
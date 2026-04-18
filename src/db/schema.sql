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
 * 【 ALETHEIA - Prototype Database Schema (v0.5.1) 】
 * =============================================================================
 * 役割：真理を露呈させるための、高密度・低遅延データ構造の定義。
 * 統合：Discovery(Cafe要件) + Trust(Booking不変性) + Audit(Payment証跡)
 * =============================================================================
 */

-- 0. データベース設定
PRAGMA foreign_keys = ON;

-- 1. テーブルの初期化 (依存関係を考慮した順序)
DROP TABLE IF EXISTS payment_gateway_logs;
DROP TABLE IF EXISTS slots;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS users;

-- 2. ユーザーテーブル (Users)
/**
 * 役割：個人のアイデンティティとガバナンスの管理。
 */
CREATE TABLE users (
    user_id       TEXT PRIMARY KEY,         -- ULID or Google Sub
    email         TEXT UNIQUE,              -- 連絡用・リピーター特定用
    display_name  TEXT,                     -- 表示名
    avatar_url    TEXT,                     -- プロフィール画像URL
    role          TEXT DEFAULT 'user',      -- admin / owner / user
    refresh_token TEXT,                     -- ローリングセッション用
    last_login_at DATETIME,                 -- 最終活動記録
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. サービス・店舗テーブル (Services)
/**
 * 役割：130億人を支える Discovery（探索）とコンテキスト保持の核心。
 */
CREATE TABLE services (
    service_id      TEXT PRIMARY KEY,       -- ULID
    owner_id        TEXT NOT NULL,          -- users.user_id (FK)
    status          TEXT DEFAULT 'draft'    -- 公開制御
        CHECK (status IN ('draft', 'published', 'private', 'archived')),
    geohash         TEXT NOT NULL,          -- 空間検索用ハッシュ (LIKE前方一致用)
    lat             REAL NOT NULL,          -- 緯度
    lng             REAL NOT NULL,          -- 経度
    address         TEXT,                   -- 物理住所
    title           TEXT NOT NULL,          -- 店舗名・サービス名
    description     TEXT,                   -- 詳細（Markdown想定）
    floor_info      TEXT,                   -- 物理文脈
    station_context TEXT,                   -- 相対文脈
    category_id     INTEGER,                -- 業態分類
    external_url    TEXT,                   -- 公式・予約URL
    price_range     TEXT,                   -- 予算目安
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 4. 予約・枠管理テーブル (Slots)
/**
 * 役割：時間の在庫管理と、予約時点の情報の不変性（Immutability）を保証。
 */
CREATE TABLE slots (
    slot_id         TEXT PRIMARY KEY,       -- ULID
    service_id      TEXT NOT NULL,          -- services.service_id (FK)
    customer_id     TEXT,                   -- users.user_id (FK)
    user_email      TEXT,                   -- 非会員予約用
    booking_status  TEXT DEFAULT 'pending'  -- ステータス管理
        CHECK (booking_status IN ('pending', 'booked', 'cancelled', 'refunded', 'no_show', 'error')),
    start_at_unix   INTEGER NOT NULL,       -- UnixTime
    end_at_unix     INTEGER NOT NULL,       -- 終了時刻
    
    -- 【誠実さの担保：不変性カラム】マスター変更の影響を受けない証跡
    actual_title    TEXT NOT NULL,          -- 予約当時のサービス名
    actual_price    TEXT,                   -- 予約当時の価格

    payment_intent_id TEXT UNIQUE,          -- 決済照合ID
    expires_at      INTEGER,                -- 自動解放期限
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(user_id)
);

-- 5. 決済監査ログテーブル (Payment Gateway Logs)
/**
 * 役割：外部決済プロバイダーからの生データを隔離保存し、トラブル時の検証を可能にする。
 */
CREATE TABLE payment_gateway_logs (
    log_id            TEXT PRIMARY KEY,     -- イベントID (Provider発行)
    provider          TEXT NOT NULL,
    event_type        TEXT NOT NULL,
    payload           TEXT NOT NULL,
    webhook_signature TEXT,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. パフォーマンス・インデックス
CREATE INDEX idx_services_geohash ON services(geohash);
CREATE INDEX idx_services_owner_id ON services(owner_id);
CREATE INDEX idx_slots_lookup ON slots (service_id, booking_status, start_at_unix);

-- 7. 自動更新トリガー (updated_at)
-- 💡 NEW.[table]_id を指定することで、更新ループを防ぎ、確実に当該行を更新します。
CREATE TRIGGER IF NOT EXISTS trigger_services_updated_at
AFTER UPDATE ON services FOR EACH ROW 
BEGIN
    UPDATE services SET updated_at = CURRENT_TIMESTAMP WHERE service_id = NEW.service_id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_slots_updated_at
AFTER UPDATE ON slots FOR EACH ROW 
BEGIN
    UPDATE slots SET updated_at = CURRENT_TIMESTAMP WHERE slot_id = NEW.slot_id;
END;

-- 8. 初期接続テスト用データ
INSERT INTO users (user_id, email, display_name, role) 
VALUES ('test_user_001', 'test@example.com', 'Aletheia Test Admin', 'admin');

INSERT INTO services (
    service_id, owner_id, status, geohash, lat, lng, title, floor_info, station_context, category_id
) VALUES (
    '01HRC_SAMPLE_CAFE_ID_001', 
    'test_user_001', 
    'published', 
    'xn76ghj', 
    35.6812, 139.7671, 
    '☕ Aletheia Prototype Cafe', 
    'B1F', 
    '🚩改札外 徒歩1分', 
    1
);
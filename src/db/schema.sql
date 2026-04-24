-- npx wrangler d1 execute ALETHEIA_PROTO_DB --file=./src/db/schema.sql --local

/**
 * =============================================================================
 * 【 ALETHEIA - Database Schema (v1.7.0-Zen-Refined) 】
 * =============================================================================
 * 役割：情報の「種」から「資産」への成長を許容する、高密度地点データベース。
 * 特徴：不完全なデータ（座標なし等）の登録を許容し、ユーザーの熱量で補完する構造。
 * -----------------------------------------------------------------------------
 * ■ プロジェクト構造
 * -- src/
 * -- └── db/
 * --     ├── schema.sql           (テーブル定義：常に全削除・全作成)
 * --     ├── seed/
 * --     │   ├── _core.sql         (基盤：プラン、ロール、状態、カテゴリ等)
 * --     │   ├── chains/            (ブランド別地点データ)
 * --     │   └── development.sql   (開発・テスト用データ)
 * --     └── apply_seeds.sh         (依存関係を考慮した流し込み)
 * =============================================================================
 */

-- =============================================================================
-- 0. データベース動作設定
-- =============================================================================
-- SQLiteにおいて、親子関係の不整合を防ぐ「外部キー制約」を明示的に有効化します。
PRAGMA foreign_keys = ON;

-- =============================================================================
-- 1. テーブルの初期化（クリーンアップ）
-- =============================================================================
-- 依存関係（外部キー）の深い「子」テーブルから順に削除し、スキーマの再構築を可能にします。
DROP TABLE IF EXISTS proposal_supports;
DROP TABLE IF EXISTS service_proposals;
DROP TABLE IF EXISTS user_activities;
DROP TABLE IF EXISTS service_cafe_details;
DROP TABLE IF EXISTS service_category_rel;
DROP TABLE IF EXISTS slots;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS transport_nodes;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS role_definitions;
DROP TABLE IF EXISTS status_definitions;
DROP TABLE IF EXISTS access_plans;

-- =============================================================================
-- 2. マスタ定義 & 権限設計
-- =============================================================================

-- 【アクセスプラン】利用上限（クォータ）の定義。将来のサブスクリプション設計の土台。
CREATE TABLE access_plans (
    plan_id           TEXT PRIMARY KEY,   -- 'free', 'pro' 等の識別子
    display_name      TEXT NOT NULL,      -- ユーザー向け名称
    max_favorites     INTEGER DEFAULT 10, -- お気に入り登録可能な上限
    max_memo_length   INTEGER DEFAULT 60, -- メモの最大文字数
    can_propose_edits BOOLEAN DEFAULT FALSE, -- 情報修正提案の権限
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 【役割定義】システム内の権限区分 (0:USER, 1:ADMIN等)
CREATE TABLE role_definitions (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- 【共通状態定義】「承認待ち」「有効」など、複数の文脈（Context）で状態値を共通管理。
CREATE TABLE status_definitions (
    id      INTEGER PRIMARY KEY,
    context TEXT NOT NULL, -- 'PROPOSAL', 'USER' 等の利用先
    name    TEXT NOT NULL  -- 'ACTIVE', 'PENDING' 等の状態名
);

-- =============================================================================
-- 3. ユーザー管理 (認証・属性)
-- =============================================================================

-- 【ユーザー】Googleログインをベースとした利用者情報。
CREATE TABLE users (
    user_id        TEXT PRIMARY KEY,
    google_id      TEXT UNIQUE,        -- Google Auth 連携用ID
    email          TEXT UNIQUE,        -- 連絡用メールアドレス
    display_name   TEXT,               -- アプリ内の表示名
    role_id        INTEGER DEFAULT 0 NOT NULL,   -- 権限レベル
    status_id      INTEGER DEFAULT 0 NOT NULL,   -- 0:ACTIVE 等
    plan_id        TEXT DEFAULT 'free' NOT NULL, -- 紐づくアクセスプラン
    last_login_at  DATETIME,
    deleted_at     DATETIME,           -- 退会日時（値があれば論理削除）
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES access_plans(plan_id) ON DELETE RESTRICT
);

-- =============================================================================
-- 4. 空間インデックス (交通・地域)
-- =============================================================================

-- 【交通ノード】駅・バス停データ。店舗が「どの駅の近くか」を判定するための基準点。
CREATE TABLE transport_nodes (
    node_id        TEXT PRIMARY KEY,
    name           TEXT NOT NULL,       -- 駅名等
    type           TEXT NOT NULL,       -- 'station', 'bus_stop'
    line_name      TEXT,                -- 路線名
    geohash_9      TEXT NOT NULL,       -- 空間検索用ハッシュ（9桁精度）
    lat            REAL NOT NULL,       -- 緯度
    lng            REAL NOT NULL,       -- 経度
    address_prefix TEXT,                -- '東京都江戸川区' 等の地域プレフィックス
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 5. 分類・ブランド管理
-- =============================================================================

-- 【ブランド】チェーン店や系列の管理。
CREATE TABLE brands (
    brand_id     TEXT PRIMARY KEY,
    name         TEXT NOT NULL,        -- ブランド名
    is_chain     BOOLEAN DEFAULT TRUE, -- チェーン判定
    official_url TEXT                  -- 公式サイトURL
);

-- 【カテゴリ】店舗の種類定義 (例: カフェ, コワーキング)
CREATE TABLE categories (
    category_id  TEXT PRIMARY KEY,
    display_name TEXT NOT NULL
);

-- =============================================================================
-- 6. コアデータ (店舗・サービス)
-- =============================================================================

-- 【サービス】ALETHEIAの主役。店舗の基本情報と、情報の信頼度を集中管理。
CREATE TABLE services (
    service_id         TEXT PRIMARY KEY,
    brand_id           TEXT,               -- 所属ブランドID
    owner_id           TEXT,               -- 施設管理者（BtoB連携用）
    plan_id            TEXT DEFAULT 'free' NOT NULL, -- 店舗側の掲載プラン
    
    ext_place_id       TEXT,               -- Google Place ID等の外部ソースID
    ext_source         TEXT,               -- データ取得元
    
    title              TEXT NOT NULL,      -- 店名
    address            TEXT NOT NULL,      -- 住所フルテキスト
    prefecture         TEXT,               -- 都道府県
    city               TEXT,               -- 市区町村
       
    -- ジオロケーション（地図・近傍検索の核心）
    geohash_9          TEXT,               -- 9桁ジオハッシュ
    lat                REAL,               -- 緯度
    lng                REAL,               -- 経度
    
    -- 🌟 設備・属性データ (拡張用JSON)
    -- Wi-Fi、電源、子供対応等の動的なフラグを key-value で格納。
    -- 例: {"wifi": true, "power": true, "kids": "welcomed"}
    attributes_json    TEXT DEFAULT '{}',

    updated_by         TEXT,               -- 最終更新ユーザー
    version            INTEGER DEFAULT 1,  -- 同時編集の競合防止用
    verification_level INTEGER DEFAULT 0,  -- 信頼度 (0:未確認, 1:訪問済等)
    
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at         DATETIME,           -- 論理削除用（時刻が入れば非表示）
    
    FOREIGN KEY (brand_id)   REFERENCES brands(brand_id)        ON DELETE SET NULL,
    FOREIGN KEY (owner_id)   REFERENCES users(user_id)          ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(user_id)          ON DELETE SET NULL,
    FOREIGN KEY (plan_id)    REFERENCES access_plans(plan_id)   ON DELETE RESTRICT
);

-- 【多対多紐付け】1店舗が複数のカテゴリ（例: カフェ ＋ 喫煙所）を持つための設計。
CREATE TABLE service_category_rel (
    service_id  TEXT,
    category_id TEXT,
    PRIMARY KEY (service_id, category_id),
    FOREIGN KEY (service_id)  REFERENCES services(service_id)  ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- =============================================================================
-- 7. カテゴリ別詳細情報
-- =============================================================================

-- 【カフェ詳細】カフェとしての基本設備。
CREATE TABLE service_cafe_details (
    service_id       TEXT PRIMARY KEY,
    has_wifi         BOOLEAN DEFAULT FALSE,
    has_power        BOOLEAN DEFAULT FALSE,
    seating_capacity INTEGER,               -- 座席数
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- =============================================================================
-- 8. ユーザーアクティビティ (パーソナルデータ)
-- =============================================================================

-- 【活動履歴】お気に入り、訪問記録、および個人用非公開メモ。
CREATE TABLE user_activities (
    activity_id      TEXT PRIMARY KEY,
    user_id          TEXT NOT NULL,
    service_id       TEXT NOT NULL,
    
    favorited_at     DATETIME, -- お気に入り登録日
    visited_at       DATETIME, -- 最終訪問日
    
    tentative_date   TEXT,     -- 「いつか行きたい」等の予定メモ
    personal_memo    TEXT,     -- 自分専用メモ（最大60文字）
    
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, service_id),
    FOREIGN KEY (user_id)    REFERENCES users(user_id)       ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- =============================================================================
-- 9. 改善提案 & クラウドソーシング
-- =============================================================================

-- 【情報修正提案】ユーザーによるDBの「共創」履歴。
CREATE TABLE service_proposals (
    proposal_id      TEXT PRIMARY KEY,
    service_id       TEXT NOT NULL,
    user_id          TEXT NOT NULL,     -- 提案者
    field_name       TEXT NOT NULL,     -- 項目名
    proposed_value   TEXT NOT NULL,     -- 修正案
    status_id        INTEGER DEFAULT 0 NOT NULL, -- 0:承認待ち 等
    resolved_by      TEXT,              -- 管理者による判断
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(user_id)       ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(user_id)      ON DELETE SET NULL
);

-- 【提案支持】他のユーザーによる「その情報は正しい」という裏付け。
CREATE TABLE proposal_supports (
    proposal_id      TEXT NOT NULL,
    user_id          TEXT NOT NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (proposal_id, user_id),
    FOREIGN KEY (proposal_id) REFERENCES service_proposals(proposal_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)      REFERENCES users(user_id)       ON DELETE CASCADE
);

-- =============================================================================
-- 10. 予約・マッチング (将来拡張用)
-- =============================================================================

-- 【スロット】時間枠の予約。将来的なBtoB機能のコア。
CREATE TABLE slots (
    slot_id          TEXT PRIMARY KEY,
    service_id       TEXT NOT NULL,
    start_at_unix    INTEGER NOT NULL,   -- UNIX時間（ソート・計算用）
    duration_minutes INTEGER DEFAULT 60, -- 枠の長さ
    booked_by        TEXT,               -- 予約者（NULLは空き）
    version          INTEGER DEFAULT 1,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(service_id, start_at_unix),
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (booked_by)  REFERENCES users(user_id)      ON DELETE RESTRICT
);

-- =============================================================================
-- 11. パフォーマンス・インデックス (検索最適化)
-- =============================================================================

-- 空間検索（ジオハッシュ）を最速化。論理削除済みは除外してインデックスサイズを節約。
CREATE INDEX idx_services_geo ON services(geohash_9) WHERE deleted_at IS NULL;
CREATE INDEX idx_services_brand_geo ON services(brand_id, geohash_9) WHERE deleted_at IS NULL;

-- 外部PlaceIDでの高速突合。
CREATE UNIQUE INDEX uidx_services_ext_place_id ON services(ext_place_id) WHERE ext_place_id IS NOT NULL;

-- 交通ノードの検索最適化。
CREATE INDEX idx_nodes_geo ON transport_nodes(geohash_9);
CREATE INDEX idx_nodes_lookup ON transport_nodes(address_prefix, type);

-- 予約枠の空き状況検索。
CREATE INDEX idx_slots_available ON slots(service_id, start_at_unix) WHERE booked_by IS NULL;
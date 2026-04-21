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

-- 0. データベース設定
-- 外部キー制約を有効化し、データ整合性を担保する
PRAGMA foreign_keys = ON;

-- 1. テーブルの初期化
-- 子（参照側）から順に削除することで、外部キー制約エラーを回避しクリーンな状態を作る
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

-- 2. アクセスプラン & マスタ定義
-- ユーザーが「できること」の物理的上限（クォータ）を定義。将来の収益化（有料プラン）の核となる。
CREATE TABLE access_plans (
    plan_id            TEXT PRIMARY KEY,   -- プラン識別子 ('free', 'pro' 等)
    display_name       TEXT NOT NULL,      -- ユーザーに表示する名称
    max_favorites      INTEGER DEFAULT 10, -- お気に入り登録の上限数
    max_memo_length    INTEGER DEFAULT 60, -- 1地点あたりのメモ最大文字数
    can_propose_edits  BOOLEAN DEFAULT FALSE, -- 店舗情報の修正提案ができるか
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 役割定義 (0:USER, 1:ADMIN, 2:OWNER等)
-- アプリ側でEnum管理するが、DB側でも名称を持たせることで可読性を向上。物理制約は設けない。
CREATE TABLE role_definitions (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- 状態定義 (contextによって 'PROPOSAL', 'USER' 等の状態を多目的に一括管理)
CREATE TABLE status_definitions (
    id      INTEGER PRIMARY KEY,
    context TEXT NOT NULL, -- 利用先区分 ('PROPOSAL', 'USER', 'NODE' 等)
    name    TEXT NOT NULL  -- 状態名 ('ACTIVE', 'PENDING' 等)
);

-- 3. ユーザーテーブル (Googleログイン対応)
-- 認証後のユーザー情報。Google IDを核としつつ、プランやロールと紐づく。
CREATE TABLE users (
    user_id        TEXT PRIMARY KEY,
    google_id      TEXT UNIQUE,       -- Google Authの一意識別子
    email          TEXT UNIQUE,       -- 連絡・通知用（将来の多要素認証を考慮）
    display_name   TEXT,              -- アプリ内での表示名
    role_id        INTEGER DEFAULT 0 NOT NULL, -- 権限レベル（role_definitionsに対応）
    status_id      INTEGER DEFAULT 0 NOT NULL, -- 0:ACTIVE, 1:DELETED等（論理状態）
    plan_id        TEXT DEFAULT 'free' NOT NULL, -- access_plansとの紐付け
    last_login_at  DATETIME,
    deleted_at     DATETIME,          -- 退会日時。存在すれば論理削除扱い
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES access_plans(plan_id) ON DELETE RESTRICT
);

-- 4. 交通ノード (駅・バス停：日本全体を分類・検索するための「空間的索引」)
-- 店舗が「どの駅の近くか」を判定し、検索を高速化するための基準点データ。
CREATE TABLE transport_nodes (
    node_id        TEXT PRIMARY KEY,
    name           TEXT NOT NULL,       -- 例: "小岩駅"
    type           TEXT NOT NULL,       -- 'station' (駅), 'bus_stop' (バス停)
    line_name      TEXT,                -- 例: '総武線'
    geohash_9      TEXT NOT NULL,       -- 空間検索用ハッシュ（座標を文字列化）
    lat            REAL NOT NULL,       -- 緯度 (Latitude): 北緯
    lng            REAL NOT NULL,       -- 経度 (Longitude): 東経
    address_prefix TEXT,                -- 例: '東京都江戸川区'（階層的な絞り込み用）
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. ブランド & カテゴリ
-- 店舗の「親」となる定義。チェーン店管理や、用途（カフェ等）による分類を行う。
CREATE TABLE brands (
    brand_id     TEXT PRIMARY KEY,
    name         TEXT NOT NULL,        -- ブランド名（例: "スターバックス"）
    is_chain     BOOLEAN DEFAULT TRUE, -- チェーン展開の有無
    official_url TEXT                  -- 公式Webサイト
);

CREATE TABLE categories (
    category_id  TEXT PRIMARY KEY,     -- 例: 'cafe', 'coworking'
    display_name TEXT NOT NULL         -- ユーザー画面での表示名
);

-- 6. サービス・店舗テーブル (ALETHEIAの主役データ)
-- 店舗の基本情報。不完全なデータも許容し、verificaton_levelで情報の信頼度を管理する。
CREATE TABLE services (
    service_id      TEXT PRIMARY KEY,
    brand_id        TEXT,              -- 所属ブランドID
    owner_id        TEXT,              -- 施設管理者（将来のBtoB連携用）
    plan_id         TEXT DEFAULT 'free' NOT NULL, -- 店舗自体の掲載プラン
    
    ext_place_id    TEXT, -- Google Place ID等、外部ソースとの突合用ID
    ext_source      TEXT, -- データ元 (例: 'google', 'user_submission')
    
    title           TEXT NOT NULL, -- 店舗・地点の名称
    address         TEXT NOT NULL, -- 住所（フルテキスト）
    prefecture      TEXT,          -- 都道府県 (例: '東京都')
    city            TEXT,          -- 市区町村 (例: '江戸川区') 
       
    -- 【空間検索・地図表示の核心】
    geohash_9       TEXT, -- 9桁ジオハッシュ（近傍店舗の高速検索用インデックス）
    lat             REAL, -- 緯度 (Latitude): 地球上の南北位置
    lng             REAL, -- 経度 (Longitude): 地球上の東西位置
    
    updated_by      TEXT,    -- 最終更新者（ユーザーID）
    version         INTEGER DEFAULT 1, -- 同時編集による競合を防ぐための版管理
    verification_level INTEGER DEFAULT 0, -- 情報の「磨かれ度」（0:未確認, 1:訪問済等）
    
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at      DATETIME, -- 論理削除日時
    
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (plan_id)  REFERENCES access_plans(plan_id) ON DELETE RESTRICT
);

-- 地点とカテゴリの多対多リレーション (例: カフェ かつ Wi-Fiスポット)
CREATE TABLE service_category_rel (
    service_id  TEXT,
    category_id TEXT,
    PRIMARY KEY (service_id, category_id),
    FOREIGN KEY (service_id)  REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- 7. カテゴリ特有詳細 (カフェ・ワークスペースとしての設備)
-- 検索軸（WHERE）よりは、詳細画面での「表示」に特化した付随情報。
CREATE TABLE service_cafe_details (
    service_id       TEXT PRIMARY KEY,
    has_wifi         BOOLEAN DEFAULT FALSE, -- Wi-Fi提供の有無
    has_power        BOOLEAN DEFAULT FALSE, -- コンセント利用の有無
    seating_capacity INTEGER,               -- およその座席数
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- 8. ユーザー活動テーブル (個人の「資産」としてのデータ)
-- お気に入り登録や、自分だけが参照できるメモ。
CREATE TABLE user_activities (
    activity_id      TEXT PRIMARY KEY,
    user_id          TEXT NOT NULL,
    service_id       TEXT NOT NULL,
    
    favorited_at     DATETIME, -- お気に入りに追加した日時
    visited_at       DATETIME, -- 最後に訪問した日時
    
    tentative_date   TEXT,     -- 「今度行きたい日」などの暫定的な日付メモ
    personal_memo    TEXT,     -- ユーザーだけが見れる非公開メモ（最大60文字）
    
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, service_id), -- 同じユーザーが1地点に複数の活動を作らない
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- 9. 改善提案テーブル (情報の「共創」を支えるインフラ)
-- ユーザーが店舗情報の誤りを指摘し、みんなでDBを育てていくための履歴。
CREATE TABLE service_proposals (
    proposal_id      TEXT PRIMARY KEY,
    service_id       TEXT NOT NULL,
    user_id          TEXT NOT NULL,     -- 提案者
    field_name       TEXT NOT NULL,     -- 修正したい項目（例: 'address'）
    proposed_value   TEXT NOT NULL,     -- 修正後の値
    status_id        INTEGER DEFAULT 0 NOT NULL, -- 状態（0:承認待ち, 1:承認済等）
    resolved_by      TEXT,              -- 承認/却下を判断した管理者ID
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 提案支持テーブル (クラウドソーシング的な「情報の正しさ」の補強)
-- 多くの人が「この提案は正しい」と支持することで、自動承認等の仕組みを検討可能。
CREATE TABLE proposal_supports (
    proposal_id      TEXT NOT NULL,
    user_id          TEXT NOT NULL, -- 支持したユーザー
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (proposal_id, user_id),
    FOREIGN KEY (proposal_id) REFERENCES service_proposals(proposal_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE
);

-- 10. 予約可能枠 (Slots: 将来的なBtoB機能の予約エンジン)
-- 特定の地点・時間帯の「予約枠」。
CREATE TABLE slots (
    slot_id          TEXT PRIMARY KEY,
    service_id       TEXT NOT NULL,
    start_at_unix    INTEGER NOT NULL,   -- 開始時刻（ソート・計算に適したUNIX時間）
    duration_minutes INTEGER DEFAULT 60, -- 枠の時間（分）
    booked_by        TEXT,               -- 予約したユーザーID（NULLなら空き）
    version          INTEGER DEFAULT 1,  -- 予約の同時更新を防ぐための制御用
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(service_id, start_at_unix), -- 同一店舗で同時刻の重複予約を防止
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (booked_by)  REFERENCES users(user_id) ON DELETE RESTRICT
);

-- 11. パフォーマンス・インデックス
-- 【検索の爆速化】頻繁に使われるWHERE句に対して、専用の索引を作成する。
CREATE INDEX idx_services_geo ON services(geohash_9) WHERE deleted_at IS NULL; -- 有効な店舗をジオハッシュで探す
CREATE INDEX idx_services_brand_geo ON services(brand_id, geohash_9) WHERE deleted_at IS NULL; -- 特定ブランドの近くの店舗を探す
CREATE UNIQUE INDEX uidx_services_ext_place_id ON services(ext_place_id) WHERE ext_place_id IS NOT NULL; -- 外部IDでの重複を防ぐ
CREATE INDEX idx_nodes_geo ON transport_nodes(geohash_9); -- 駅の空間検索
CREATE INDEX idx_nodes_lookup ON transport_nodes(address_prefix, type); -- 「東京都」の「駅」を即座にリストアップ
CREATE INDEX idx_slots_available ON slots(service_id, start_at_unix) WHERE booked_by IS NULL; -- 空き予約枠のみを抽出

-- 12. 自動更新トリガー
-- データ更新時に 'updated_at' カラムを自動で現在時刻に書き換え、プログラム側の負担を減らす。
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
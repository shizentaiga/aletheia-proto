/**
 * =============================================================
 * 【  ( ) - データベース物理設計 / schema.sql】
 * =============================================================
 * ■ 実行コマンド・プロトコル
 * -------------------------------------------------------------
 * [ローカル反映] npx wrangler d1 execute  -db --local --file=./schema.sql
 * [本番環境反映] npx wrangler d1 execute  -db --remote --file=./schema.sql
 * * ■ 運用上の注意
 * 1. 破壊的変更: DROP TABLE を含んでいるため、実行すると既存データは消去されます。
 * 2. 開発フェーズ: 現在はプロトタイプ期のため、構造変更のたびにこのファイルを実行してリセットします。
 * 3. 本番移行後: 本番稼働後は DROP TABLE をコメントアウトし、ALTER TABLE による移行計画を立てること。
 * -------------------------------------------------------------
 */

-- =============================================================
-- 1. テーブルの初期化 (リセット・プロトコル)
-- =============================================================
DROP TABLE IF EXISTS Services;
DROP TABLE IF EXISTS Users;

-- =============================================================
-- 2. ユーザーテーブル (Users)
-- =============================================================
/**
 * 役割：Google認証と連携した、システム利用者のアイデンティティ管理。
 */
CREATE TABLE Users (
    -- id: Googleの固有ID (sub) または内部生成の ULID
    id TEXT PRIMARY KEY,

    -- email: 連絡用およびアカウント復旧用
    email TEXT,

    -- display_name: サービス内で表示される名前（実名・ビジネスネームの選択は運用に委ねる）
    display_name TEXT,

    -- avatar_url: Googleプロフィール画像等のURL
    avatar_url TEXT,

    -- role: 権限管理 ('admin': 管理者, 'user': 一般, 'owner': 店舗主)
    role TEXT DEFAULT 'user',

    -- refresh_token: セッション延命用の鍵（OAuth2 ローリングセッション用）
    refresh_token TEXT,

    -- last_login_at: ガバナンス維持のための最終活動記録
    last_login_at DATETIME,

    -- created_at: アカウント作成日時
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- 3. サービス・店舗テーブル (Services)
-- =============================================================
/**
 * 役割：130億人を支える Discovery（探索）の核心データ。
 */
CREATE TABLE Services (
    -- id: ULIDを採用。時系列ソートが可能で、かつ推測困難な26文字の識別子。
    id TEXT PRIMARY KEY,

    -- owner_id: 登録・管理者（Users.id）へのリレーション
    owner_id TEXT NOT NULL,

    -- status: 公開制御 ('draft', 'published', 'private', 'archived')
    status TEXT DEFAULT 'draft',

    -- geohash: 空間検索の要。前方一致検索(LIKE)を高速化するためインデックスを付与。
    geohash TEXT NOT NULL,

    -- lat / lng: 緯度・経度。地図表示や正確な距離計算に使用。
    lat REAL NOT NULL,
    lng REAL NOT NULL,

    -- address: 物理的な住所、または施設名
    address TEXT,

    -- title: 店舗名・サービス名（高密度リストの主軸）
    title TEXT NOT NULL,

    -- description: サービスの魅力や詳細を伝えるテキスト（Markdown想定）
    description TEXT,

    -- floor_info: 「B1F」「🚩改札内」など、物理的な到達難易度を示す重要コンテキスト。
    floor_info TEXT,

    -- station_context: 「徒歩1分」など、駅との関係性。
    station_context TEXT,

    -- category_id: 業態分類（1:カフェ, 2:ワークスペース 等）
    category_id INTEGER,

    -- external_url: 予約・公式サイト等への外部リンク
    external_url TEXT,

    -- price_range: 「¥500〜」等の価格目安
    price_range TEXT,

    -- created_at / updated_at: データの鮮度管理
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id) REFERENCES Users(id)
);

-- =============================================================
-- 4. パフォーマンス・インデックス
-- =============================================================
/**
 * 130億人のデータから「今、ここ」の近傍を瞬時に抽出するための要。
 * geohash 列に対する前方一致検索(LIKE 'xn76%') を劇的に高速化します。
 */
CREATE INDEX idx_services_geohash ON Services(geohash);

-- =============================================================
-- 5. 最小構成テストデータ (接続確認用)
-- =============================================================
-- まずユーザーを作成
INSERT INTO Users (id, email, display_name, role) 
VALUES ('test_user_001', 'test@example.com', '接続テスト用ユーザー', 'admin');

-- そのユーザーに関連付けた店舗を作成（Geohash: xn76 は東京周辺）
INSERT INTO Services (
    id, owner_id, status, geohash, lat, lng, title, floor_info, station_context, category_id
) VALUES (
    '01HRC_SAMPLE_CAFE_ID_001', 
    'test_user_001', 
    'published', 
    'xn76ghj', 
    35.6812, 139.7671, 
    '  Test Cafe (東京駅前)', 
    'B1F', 
    '🚩改札外 徒歩1分', 
    1
);
# プロジェクト構成定義 (package.jsonなど)

このファイルは、プロジェクトの「設計図」や「道具箱のリスト」のようなものです。
JSON形式の本番ファイルにはコメントが書けないため、ここで各項目の役割を整理します。

・package.json
```json
{
  // プロジェクトの名前です。
  "name": "23_my-hono-project",

  // 比較的新しいJavaScriptの書き方（ES Modules）を使うための指定です。
  "type": "module",

  // 「合言葉」の設定です。npm run [名前] で実行できます。
  "scripts": {
    // 自分のPC上で開発用サーバーを立ち上げ、動作確認をします。
    "dev": "wrangler dev",
    // 完成したコードをCloudflareに公開（デプロイ）します。
    // --minify は、コードを圧縮して読み込みを速くする魔法のオプションです。
    "deploy": "wrangler deploy --minify"
  },

  // 開発中にだけ必要なツール（本番の動作には直接関係ないもの）です。
  "devDependencies": {
    // Cloudflare Workersで正しくプログラミングするための「辞書」のようなものです。
    "@cloudflare/workers-types": "^4.20260329.1",
    // Cloudflareとやり取りするためのメインツール（魔法の杖）です。
    "wrangler": "^3.107.0"
  },

  // アプリが動くために「必須」となる部品（ライブラリ）です。
  "dependencies": {
    // Googleログインなどの認証機能を簡単に組み込むための追加パーツです。
    "@hono/oauth-providers": "^0.8.5",
    // 今回のプロジェクトの土台となる軽量なWebフレームワークです。
    "hono": "^4.12.9"
  }
}
```


・wrangler.json
```
{
  // プロジェクト名
  "name": "aletheia-app",

  // メインプログラムの場所（TypeScript/JSXを使用）
  "main": "src/index.tsx",

  // 機能の互換性維持のための日付
  "compatibility_date": "2024-04-01",

  // 静的ファイル（画像・CSSなど）の設定
  "assets": {
    "directory": "./public",
    "binding": "ASSETS"
  },

  // 【重要】D1データベースの紐付け
  // 複数のデータベースを持つ可能性があるため、[ ]（配列）の中に書きます
  "d1_databases": [
    {
      // プログラム（Hono）内で「c.env.DB」として呼び出すための名前
      "binding": "DB",
      // Cloudflare側で管理しているデータベースの実名
      "database_name": "aletheia-db",
      // 固有のID（wrangler d1 create で発行されたもの）
      "database_id": "xxxx-xxxx-xxxx"
    }
  ]
}
```
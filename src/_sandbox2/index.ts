import { Hono } from 'hono'

// 【部品の読み込み】 テスト用の各機能を別のファイルから連れてきます
import { test01 } from './test01_google-auth'  // Googleログインのテスト機能
import { test02 } from './test02_db-access'   // データベース読み書きのテスト機能

export const sandboxApp = new Hono()

// 【ルート（住所）の設定】 
// ブラウザでアクセスする際の「URLの末尾」と「実行する機能」を紐付けます

// アクセス先： http://localhost:8787/sandbox/test01
// 役割： Googleアカウントでログインできるか確認するページ
sandboxApp.route('/test01', test01)

// アクセス先： http://localhost:8787/sandbox/test02
// 役割： 保存したデータ（D1）が正しく表示されるか確認するページ
sandboxApp.route('/test02', test02)


/* ---------------------------------------------------------
   【新しいテストを追加する際の手順】
   1. 上段に `import { test03 } from './test03_filename'` を書き足す
   2. 下段に `sandboxApp.route('/test03', test03)` を書き足す
   これで http://localhost:8787/sandbox/test03 が使えるようになります。
   --------------------------------------------------------- */
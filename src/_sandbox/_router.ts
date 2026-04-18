/**
 * =============================================================================
 * 【 ALETHEIA - 開発実験場 (Sandbox) / _sandbox/_router.ts 】
 * =============================================================================
 * ■ 役割と運用思想
 * -----------------------------------------------------------------------------
 * 1. 隔離環境: 本番ロジックを汚さず、新機能や外部連携を単体検証。
 * 2. 資産継承: 成功したコードは src/db/repositories/ 等へ昇格させる。
 * -----------------------------------------------------------------------------
 */

import { Hono } from 'hono'
import { trimTrailingSlash } from 'hono/trailing-slash'
import { html } from 'hono/html'

// [1. テストモジュールのインポート]
import { test00 } from './test00_hello'
import { test01 } from './test01_google-auth'  // 認証基盤（Google OAuth）
import { test02 } from './test02_db'    // データ基盤（D1 Database）
import { test03 } from './test03_cafe'         // 機能試作（v1: 基礎検索）
import { test03_2 } from './test03-2_cafe'     // 機能試作（v2: リスト表示）
import { test03_3 } from './test03-3_cafe'     // 機能試作（v3: 詳細・UI連携）

type Bindings = {
  ALETHEIA_PROTO_DB: D1Database
}

export const sandboxApp = new Hono<{ Bindings: Bindings }>()

// [2. ミドルウェア]
sandboxApp.use('*', trimTrailingSlash())

// [3. ルーティング登録]
// http://localhost:8787/_sandbox/test00 でアクセス可能
sandboxApp.route('/test00', test00)
sandboxApp.route('/test01', test01) // 認証
sandboxApp.route('/test02', test02) // DBアクセス
sandboxApp.route('/test03', test03) // カフェ(基本)
sandboxApp.route('/test03-2', test03_2) // カフェ(リスト強化)
sandboxApp.route('/test03-3', test03_3) // カフェ(統合検証)


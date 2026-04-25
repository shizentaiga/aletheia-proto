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
import { test03 } from './test03_cafe'  // 機能試作（v1: 基礎検索）
import { test04 } from './test04_address'
import { test05 } from './test05_cdn'
import { test06 } from './test06_next100'
import { test07 } from './test07_hpg'
import { test81 } from './test81_cr'

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
sandboxApp.route('/test04', test04)
sandboxApp.route('/test05', test05)
sandboxApp.route('/test06', test06)
sandboxApp.route('/test07', test07)
sandboxApp.route('/test81', test81)


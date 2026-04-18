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

type Bindings = {
  ALETHEIA_PROTO_DB: D1Database
}

export const sandboxApp = new Hono<{ Bindings: Bindings }>()

// [2. ミドルウェア]
sandboxApp.use('*', trimTrailingSlash())

// [3. ルーティング登録]
// http://localhost:8787/_sandbox/test00 でアクセス可能
sandboxApp.route('/test00', test00)


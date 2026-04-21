import { Hono } from 'hono'
import { html } from 'hono/html'

/**
 * [Test00: Hello World]
 * 役割：サンドボックスのルーティングが正常にマウントされているかを検証する。
 */
export const test04 = new Hono()

test04.get('/', (c) => {
  return c.html(html`
    <p>test04です。住所取得のアルゴリズムを検証します。</p>
  `)
})
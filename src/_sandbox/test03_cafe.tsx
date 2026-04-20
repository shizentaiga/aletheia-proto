import { Hono } from 'hono'
import { html } from 'hono/html'

/**
 * [Test00: Hello World]
 * 役割：サンドボックスのルーティングが正常にマウントされているかを検証する。
 */
export const test03 = new Hono()

test03.get('/', (c) => {
  return c.html(html`
    <p>test03です。</p>
  `)
})
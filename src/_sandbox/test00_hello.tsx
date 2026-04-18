import { Hono } from 'hono'
import { html } from 'hono/html'

/**
 * [Test00: Hello World]
 * 役割：サンドボックスのルーティングが正常にマウントされているかを検証する。
 */
export const test00 = new Hono()

test00.get('/', (c) => {
  return c.html(html`
    <div style="border: 2px solid #333; padding: 20px; border-radius: 8px;">
      <h2 style="margin-top: 0;">🧪 Test00: Hello External File</h2>
      <p>外部ファイルからのマウントに成功しました。</p>
      <p style="font-size: 0.8rem; color: #666;">
        Path: <code>src/_sandbox/test00_hello.tsx</code>
      </p>
    </div>
  `)
})
import { Hono } from 'hono'
import { html } from 'hono/html'

export const test09 = new Hono()

test09.get('/', (c) => {
  return c.html(html`
    <p>testです。</p>
  `)
})
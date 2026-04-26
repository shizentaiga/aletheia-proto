import { Hono } from 'hono'
import { html } from 'hono/html'

export const test07 = new Hono()

test07.get('/', (c) => {
  return c.html(html`
    <p>testです。</p>
  `)
})
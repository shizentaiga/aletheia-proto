/** @jsxImportSource hono/jsx */
import { jsxRenderer } from 'hono/jsx-renderer'

const SITE_CONFIG = {
  SITE_NAME: 'ALETHEIA',
  LANG: 'ja',
} as const

const GLOBAL_STYLES = `
  /* 余計なマージンやデフォルトのヘッダー色をリセット */
  body { 
    margin: 0; 
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #fff;
    color: #111;
  }
  * { box-sizing: border-box; }
`

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: { title?: string }): Response | Promise<Response>
  }
}

export const renderer = jsxRenderer(({ children, title }) => {
  const pageTitle = title 
    ? `${title} | ${SITE_CONFIG.SITE_NAME}` 
    : SITE_CONFIG.SITE_NAME

  return (
    <html lang={SITE_CONFIG.LANG}>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle}</title>
        <style>{GLOBAL_STYLES}</style>
      </head>
      <body>
        {/* ここにあった <header> と <footer> を削除しました */}
        {children}
      </body>
    </html>
  )
})
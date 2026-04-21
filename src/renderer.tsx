/** @jsxImportSource hono/jsx */
import { jsxRenderer } from 'hono/jsx-renderer'

// ==========================================================
// 1. 設定値・固定テキスト (Config & Strings)
// ==========================================================
const SITE_CONFIG = {
  SITE_NAME: 'ALETHEIA',
  LANG: 'ja',
  COPYRIGHT: `© ${new Date().getFullYear()} ALETHEIA Project`,
} as const

// ==========================================================
// 2. デザイン資産 (Global Styles)
// ==========================================================
const GLOBAL_STYLES = `
  body { 
    font-family: sans-serif; 
    margin: 0; 
    background: #f4f7f6; 
    color: #333; 
  }
  header { 
    background: #1a202c; 
    color: white; 
    padding: 1rem; 
    text-align: center; 
  }
  header h1 {
    margin: 0;
    font-size: 1.5rem;
    letter-spacing: 0.1rem;
  }
  main { 
    padding: 20px; 
    max-width: 800px; 
    margin: 0 auto; 
  }
  footer { 
    text-align: center; 
    font-size: 0.8rem; 
    color: #666; 
    margin-top: 40px; 
    padding: 20px; 
  }
`

// ==========================================================
// 3. 型定義の拡張 (Type Definitions)
// ==========================================================
declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: { title?: string }): Response | Promise<Response>
  }
}

// ==========================================================
// 4. レンダラー本体 (Renderer Logic)
// ==========================================================
export const renderer = jsxRenderer(({ children, title }) => {
  // ページタイトルの動的生成
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
        <header>
          <h1>{SITE_CONFIG.SITE_NAME}</h1>
        </header>
        
        <main>
          {children}
        </main>
        
        <footer>
          {SITE_CONFIG.COPYRIGHT}
        </footer>
      </body>
    </html>
  )
})
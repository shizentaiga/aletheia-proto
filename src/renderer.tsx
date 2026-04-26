/**
【全ページ共通のマスターテンプレート】
各ページで c.render() が呼ばれると、この関数が自動的に実行されます。
*/

/** @jsxImportSource hono/jsx */
import { jsxRenderer } from 'hono/jsx-renderer'

// --- サイト全体で共有する定数定義 ---
const SITE_CONFIG = {
  SITE_NAME: 'ALETHEIA',
  LANG: 'ja',
} as const

// --- 全ページ共通の基本スタイル ---
const GLOBAL_STYLES = `
  body { 
    margin: 0; 
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #fff;
    color: #111;
  }
  * { box-sizing: border-box; }
  .htmx-indicator {
    opacity: 0;
    transition: opacity 200ms ease-in;
  }
  .htmx-request .htmx-indicator {
    opacity: 1;
  }
  .htmx-request.htmx-indicator {
    opacity: 1;
  }
`

/**
 * TypeScript 用の型拡張
 * 💡 修正ポイント: 
 * 他のファイル（api_handlers.ts等）からインポートなしで型を認識させるため、
 * declare module の記述を最適化しています。
 */
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
        <script 
          src="https://unpkg.com/htmx.org@1.9.12" 
          crossorigin="anonymous"
        ></script>
        <style>{GLOBAL_STYLES}</style>
      </head>
      <body>
        {children}
        {/* グローバル・ローディングインジケーター */}
        <div id="loading-spinner" class="htmx-indicator" style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          zIndex: 9999
        }}>
          読み込み中...
        </div>
      </body>
    </html>
  )
})
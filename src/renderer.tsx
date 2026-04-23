/** @jsxImportSource hono/jsx */
import { jsxRenderer } from 'hono/jsx-renderer'

const SITE_CONFIG = {
  SITE_NAME: 'ALETHEIA',
  LANG: 'ja',
} as const

const GLOBAL_STYLES = `
  body { 
    margin: 0; 
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #fff;
    color: #111;
  }
  * { box-sizing: border-box; }

  /* HTMX 読み込み中のスタイル定義 */
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
        
        {/* HTMX 本体の読み込み */}
        <script 
          src="https://unpkg.com/htmx.org@1.9.12" 
          integrity="sha384-ujb9WjVHfuAd7B3Wqo9GcRjUaf6i6Gi87v17V7Xpxv1/+fybkyGZG6SAsf11z9X3" 
          crossorigin="anonymous"
        ></script>

        <style>{GLOBAL_STYLES}</style>
      </head>
      <body>
        {children}

        {/* 「もっと見る」などのリクエスト中に表示する
             グローバルなローディングインジケーター（必要に応じて）
        */}
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
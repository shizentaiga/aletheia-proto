/**
【全ページ共通のマスターテンプレート】
各ページで c.render() が呼ばれると、この関数が自動的に実行されます。
ヘッダーの読み込みや共通スタイルなどの「共通の土台」をここで一括管理し、
引数の children をメインコンテンツとして埋め込みます。
*/

/** @jsxImportSource hono/jsx */
import { jsxRenderer } from 'hono/jsx-renderer'

// サイト全体で共有する定数定義
const SITE_CONFIG = {
  SITE_NAME: 'ALETHEIA',
  LANG: 'ja',
} as const

// 全ページ共通の基本スタイル。各コンポーネントのスタイルと競合しないよう基本設定に留める
const GLOBAL_STYLES = `
  body { 
    margin: 0; 
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #fff;
    color: #111;
  }
  * { box-sizing: border-box; }

  /* * HTMX インジケーター制御
   * リクエスト中（.htmx-request）のみ、対象要素の opacity を 1 にする
   */
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
 * c.render(content, { title: '...' }) のように、
 * 第2引数で title を渡せるように定義しています。
 */
declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: { title?: string }): Response | Promise<Response>
  }
}

export const renderer = jsxRenderer(({ children, title }) => {
  // タイトルが指定されている場合は「ページ名 | サイト名」とする
  const pageTitle = title 
    ? `${title} | ${SITE_CONFIG.SITE_NAME}` 
    : SITE_CONFIG.SITE_NAME

  return (
    <html lang={SITE_CONFIG.LANG}>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle}</title>
        
        {/* HTMX 本体の読み込み 
          💡 注意: integrity 属性を外したことで、現在は SRI チェックなしで読み込まれます。
          バージョンを変更する際は、公式のハッシュ値と一致させるか、このまま運用します。
        */}
        <script 
          src="https://unpkg.com/htmx.org@1.9.12" 
          crossorigin="anonymous"
        ></script>

        <style>{GLOBAL_STYLES}</style>
      </head>
      <body>
        {/* 各ページのメインコンテンツがここに入る */}
        {children}

        {/* グローバル・ローディングインジケーター
          💡 活用方法:
          各コンポーネント内の HTMX 要素（button等）に 
          hx-indicator="#loading-spinner" を付与すると、
          通信中だけ画面右下に「読み込み中...」が表示されます。
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
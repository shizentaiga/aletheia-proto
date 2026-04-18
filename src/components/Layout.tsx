/** @jsxImportSource hono/jsx */

/**
 * 【Layoutコンポーネント：全ページ共通の外装】
 * この部品は、HTMLの基本構造（頭と体）を定義します。
 * ページを増やしても、このLayoutを使えばデザインの統一感を保てます。
 */
export const Layout = ({ children }: { children: any }) => (
  <html lang="ja">
    <head>
      <meta charset="UTF-8" />
      {/* スマホ表示を最適化するための設定です */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>  Protocol</title>
      
      {/* 【デザインの核】 public/style.css を読み込みます。
          見た目を変えたい時は、このプログラムではなく .css 側を修正します。 */}
      <link rel="stylesheet" href="/style.css" />
    </head>

    <body class="container">
      {/* --- ヘッダーエリア ---
          サイトロゴ（ ）やキャッチコピーを配置。
          .identity や .year-badge は style.css で装飾されています。
      */}
      <header>
        <div class="identity">
          <h1> </h1>
          <p>つながりは偶然から</p>
        </div>
        <div class="year-badge">2026</div>
      </header>

      {/* --- メインコンテンツエリア ---
          {children} の部分に、DevCore や Hero などの「中身」が自動的に流し込まれます。
      */}
      <main>{children}</main>

      {/* --- フッターエリア ---
          著作権表示などを記載。
      */}
      <footer>
        &copy; 2026   Protocol
      </footer>
    </body>
  </html>
)
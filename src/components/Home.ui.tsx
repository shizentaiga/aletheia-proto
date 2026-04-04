/**
 * =============================================================================
 * 【Aletheia - ホーム画面レイアウト / Home.ui.tsx】
 * =============================================================================
 * ■ 役割: ホーム画面の HTML 構造と Tailwind CSS によるスタイリングを定義。
 * ■ 実行環境: Isomorphic (SSR時にサーバーで実行、またはブラウザで表示)
 * -----------------------------------------------------------------------------
 * 💡 設計のポイント:
 * 1. サーバーサイドのロジックを一切含まず、純粋な JSX(TSX) として構成。
 * 2. ID属性（search-btn等）を固定し、外部のスクリプトから操作可能にする。
 * 3. 疎通確認用の「ブリッジ・スクリプト」を内包し、着火を確実にする。
 * -----------------------------------------------------------------------------
 */

/** @jsxImportSource hono/jsx */

type HomeProps = {
  title: string;
};

export const HomeUI = (props: HomeProps) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{props.title}</title>
        {/* Tailwind CSS: プロトタイプ期は CDN を利用 */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      
      <body className="bg-gray-50 p-8 text-gray-900">
        <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>📍</span> {props.title}
          </h1>
          
          <div className="flex gap-2 mb-6">
            <input 
              id="search-input"
              name="geohash"
              type="text" 
              defaultValue="xn76"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Geohashを入力 (例: xn76)"
            />
            <button 
              id="search-btn"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
            >
              検索
            </button>
          </div>

          <div id="result-area" className="space-y-2 text-sm">
            {/* 動的コンテンツの挿入ポイント */}
            <p className="text-gray-400 text-center py-4 border-2 border-dashed border-gray-50 rounded-lg">
              検索ボタンを押すと、D1データベースからデータを取得します
            </p>
          </div>
        </div>

        {/* 【ブリッジ・スクリプト】
          将来的に src/hooks/cafe.client.ts へ移行するまでの暫定措置。
          UIコンポーネント自体に「動きの種」を同梱しておくことで、
          ファイル分割後も確実にボタンを機能させます。
        */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            const btn = document.getElementById('search-btn');
            const input = document.getElementById('search-input');
            const area = document.getElementById('result-area');

            if (!btn || !input || !area) return;

            btn.onclick = async () => {
              const query = input.value;
              console.log("[Client:Action] 検索実行:", query);
              
              area.innerHTML = '<div class="text-center py-4 text-blue-500 animate-pulse">通信中...</div>';
              
              try {
                const res = await fetch('/api/search?q=' + encodeURIComponent(query));
                if (!res.ok) throw new Error('Network response was not ok');
                
                const data = await res.json();
                
                if (data.length === 0) {
                  area.innerHTML = '<p class="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">該当なし</p>';
                  return;
                }

                area.innerHTML = data.map(item => \`
                  <div class="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div class="font-bold text-gray-800">\${item.title}</div>
                    <div class="text-xs text-gray-500 mt-1">\${item.station_context || ''}</div>
                  </div>
                \`).join('');
                
              } catch (e) {
                console.error("[Client:Error]", e);
                area.innerHTML = '<p class="text-red-500 p-3 text-center">通信エラーが発生しました</p>';
              }
            };
          })();
        `}} />
      </body>
    </html>
  );
};
/**
 * ==========================================================
 * 【test03-3: 履歴スタック & 駅ナカ判定 実装版】
 * ==========================================================
 * ■ アクセスURL
 * - 本番/ローカル: /sandbox/test03-3
 * * ■ 新機能
 * 1. 履歴の自動スタック: localStorageを使用して「最近見た駅」を保存。
 * 2. 駅ナカ判定: 東京駅などの複雑な場所で [Inside/Outside] を表示。
 * 3. 疑似検索窓: 入力に応じて駅候補を出すフロントエンド・ロジックの準備。
 * ==========================================================
 */

import { Hono } from 'hono'
import { html } from 'hono/html'

export const test03_3 = new Hono()

// 駅データの定義（本来はDBから取得）
const STATIONS = [
  { id: 'koiwa', name: '小岩駅', area: '江戸川区', type: 'Normal' },
  { id: 'tokyo', name: '東京駅', area: '千代田区', type: 'Complex' },
  { id: 'tabata', name: '田端駅', area: '北区', type: 'Normal' }
]

// サンプル店舗データ（東京駅の Inside/Outside 属性付き）
const CAFE_SAMPLES: Record<string, any[]> = {
  tokyo: [
    { name: "ブルディガラ", isInside: true, level: "B1F", memo: "グランスタ内・改札内" },
    { name: "スターバックス", isInside: false, level: "B1F", memo: "ヤエチカ・改札外" },
    { name: "トラヤあんスタンド", isInside: false, level: "2F", memo: "北町酒場・改札外" },
  ]
}

test03_3.get('/', (c) => {
  const stationId = c.req.query('station')
  const stationName = STATIONS.find(s => s.id === stationId)?.name || "駅を選択"

  return c.html(
    html`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>  Search Prototype</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          // 【履歴スタック・ロジック】
          function updateHistory(id, name) {
            if(!id) return;
            let history = JSON.parse(localStorage.getItem(' _history') || '[]');
            // 重複削除して先頭に追加
            history = history.filter(item => item.id !== id);
            history.unshift({id, name});
            // 最大5件に制限
            localStorage.setItem(' _history', JSON.stringify(history.slice(0, 5)));
          }

          // ページ読み込み時に履歴を表示
          window.onload = () => {
            const params = new URLSearchParams(window.location.search);
            const currentId = params.get('station');
            const currentName = "${stationName}";
            
            if(currentId && currentName !== "駅を選択") {
              updateHistory(currentId, currentName);
            }

            const history = JSON.parse(localStorage.getItem(' _history') || '[]');
            const historyArea = document.getElementById('history-area');
            if(history.length > 0) {
              historyArea.innerHTML = history.map(item => 
                \`<a href="?station=\${item.id}" class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">\${item.name}</a>\`
              ).join('');
            }
          }

          // 【現在地取得ロジック（疑似）】
          function getGeo() {
            const btn = document.getElementById('geo-btn');
            btn.innerText = "取得中...";
            // 実際は navigator.geolocation.getCurrentPosition を使用
            setTimeout(() => {
              btn.innerText = "📍 小岩駅が近くに見つかりました";
              btn.classList.add('bg-green-500', 'text-white');
            }, 1000);
          }
        </script>
      </head>
      <body class="bg-gray-50 text-gray-900 font-sans antialiased pb-10">
        <div class="max-w-md mx-auto min-h-screen bg-white shadow-sm">
          
          <div class="p-6 bg-gradient-to-b from-blue-600 to-blue-700 text-white">
            <h1 class="text-2xl font-black tracking-tighter mb-4"> </h1>
            
            <div class="relative mb-4 text-gray-800">
              <input type="text" placeholder="駅名、場所を検索..." class="w-full p-4 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <span class="absolute right-4 top-4 text-gray-300">🔍</span>
            </div>

            <button id="geo-btn" onclick="getGeo()" class="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl text-sm font-bold transition-all">
              📍 現在地から探す
            </button>
          </div>

          <div class="p-4 bg-white border-b">
            <p class="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">最近チェックした駅</p>
            <div id="history-area" class="flex flex-wrap gap-2 text-gray-400 text-xs italic">
              履歴はありません
            </div>
          </div>

          <div class="p-4">
            <h2 class="text-sm font-bold text-gray-400 mb-4 flex justify-between items-center">
              <span>${stationName} の結果</span>
              ${stationId ? html`<a href="/sandbox/test03-3" class="text-blue-500 text-[10px]">クリア</a>` : ''}
            </h2>

            <div class="space-y-3">
              ${stationId === 'tokyo' ? CAFE_SAMPLES.tokyo.map(cafe => html`
                <div class="flex items-center p-3 border rounded-xl hover:border-blue-300 transition-all cursor-pointer">
                  <div class="w-12 flex-none">
                    <span class="text-[9px] px-1.5 py-0.5 rounded-sm font-bold ${cafe.isInside ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}">
                      ${cafe.isInside ? '駅ナカ' : '駅ソト'}
                    </span>
                    <div class="text-[10px] text-gray-400 mt-1 font-mono text-center">${cafe.level}</div>
                  </div>
                  <div class="ml-3 flex-grow min-w-0">
                    <div class="font-bold text-sm text-gray-800">${cafe.name}</div>
                    <p class="text-[10px] text-gray-400 truncate">${cafe.memo}</p>
                  </div>
                  <div class="text-blue-500 text-sm">→</div>
                </div>
              `) : html`<p class="text-center py-10 text-gray-300 text-sm italic">駅を選択してリストを表示してください</p>`}
            </div>
          </div>

          <div class="m-4 p-4 bg-yellow-50 border border-yellow-100 rounded-2xl">
            <p class="text-[11px] text-yellow-700 leading-relaxed">
              ⚠️ <strong>ご注意：</strong> 履歴やお気に入りは、このブラウザを閉じると消える場合があります。永続的に保存するには、<a href="#" class="font-bold underline text-blue-600">ログイン</a>をおすすめします。
            </p>
          </div>

        </div>
      </body>
      </html>
    `
  )
})
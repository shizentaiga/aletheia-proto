/**
 * ==========================================================
 * 【test03-2: マルチ駅・高密度リスト プロトタイプ】
 * ==========================================================
 * ■ アクセスURL
 * - 本番/ローカル共に末尾にクエリパラメータをつけて切り替え可能
 * - 例: ?station=koiwa / ?station=tokyo / ?station=tabata
 * ==========================================================
 */

import { Hono } from 'hono'
import { html } from 'hono/html'

export const test03_2 = new Hono()

// ==========================================
// 【データ構造】駅ごとのコンテキストを含んだマスターデータ
// ==========================================
const MASTER_DATA: Record<string, any[]> = {
  koiwa: [
    { name: "白鳥", dist: 1, dir: "⬇️南", open: "08:00", close: "20:00", genre: "喫茶", memo: "駅前、2階席あり" },
    { name: "木の実", dist: 5, dir: "⬆️北", open: "09:00", close: "18:00", genre: "喫茶", memo: "レトロ、タマゴサンド" },
    { name: "Cafe one sheep", dist: 6, dir: "⬇️南", open: "11:00", close: "22:00", genre: "カフェ", memo: "夜間営業、癒やし" },
    { name: "御豆屋", dist: 3, dir: "⬆️北", open: "10:00", close: "19:00", genre: "コーヒ", memo: "テイクアウト中心" },
    { name: "Sui coffee", dist: 8, dir: "⬆️北", open: "10:00", close: "19:00", genre: "焙煎", memo: "こだわり豆" },
    { name: "モナリザ", dist: 4, dir: "⬆️北", open: "08:30", close: "19:00", genre: "喫茶", memo: "昭和の純喫茶" },
    { name: "パスカル 本店", dist: 7, dir: "⬆️北", open: "10:00", close: "20:00", genre: "菓子", memo: "ケーキ屋さんのカフェ" },
    { name: "ラ・タミエール", dist: 2, dir: "⬇️南", open: "10:00", close: "20:00", genre: "パン", memo: "イートインあり" },
    { name: "サンマルク小岩", dist: 2, dir: "⬇️南", open: "07:00", close: "22:00", genre: "チェ", memo: "安定のチェーン" },
    { name: "星乃珈琲店 小岩", dist: 3, dir: "⬇️南", open: "08:00", close: "21:00", genre: "チェ", memo: "ゆったりソファ" },
    // ... 20件規模まで想定（以下略）
  ],
  tokyo: [
    { name: "ブルディガラ", dist: 1, dir: "🎫内", level: "B1F", open: "07:00", close: "22:00", genre: "パン", memo: "グランスタ東京内" },
    { name: "豆一豆", dist: 2, dir: "🎫内", level: "1F", open: "08:00", close: "21:00", genre: "和菓", memo: "あんぱん専門店" },
    { name: "千疋屋", dist: 3, dir: "🚪外", level: "1F", open: "09:00", close: "20:00", genre: "フル", memo: "一番街、フルーツ" },
    { name: "トラヤあんスタンド", dist: 2, dir: "🚪外", level: "2F", open: "10:00", close: "20:00", genre: "甘味", memo: "北町酒場近く" },
    { name: "スターバックス", dist: 1, dir: "🚪外", level: "B1F", open: "06:30", close: "22:30", genre: "チェ", memo: "ヤエチカ、激混み" },
    { name: "プロント", dist: 4, dir: "🚪外", level: "B1F", open: "07:00", close: "23:00", genre: "バル", memo: "日本橋口方面" },
    { name: "一保堂茶舗", dist: 8, dir: "🚪外", level: "1F", open: "11:00", close: "19:00", genre: "日本茶", memo: "丸の内、静か" },
    // ... 30件規模まで想定
  ],
  tabata: [
    { name: "ガスト 田端", dist: 1, dir: "⬇️南", open: "07:00", close: "23:30", genre: "ファ", memo: "南口、階段上がってすぐ" },
    { name: "プロント 田端", dist: 1, dir: "⬆️北", open: "07:00", close: "22:00", genre: "チェ", memo: "アトレヴィ田端内" },
    { name: "スターバックス", dist: 1, dir: "⬆️北", open: "07:00", close: "22:00", genre: "チェ", memo: "北口、改札横" },
  ]
}

test03_2.get('/', (c) => {
  // クエリパラメータから駅を取得。指定がなければ 'koiwa'
  const stationId = c.req.query('station') || 'koiwa'
  const cafes = MASTER_DATA[stationId] || []
  const sortedCafes = [...cafes].sort((a, b) => a.dist - b.dist)

  const stationNames: Record<string, string> = { koiwa: "小岩駅", tokyo: "東京駅", tabata: "田端駅" }

  return c.html(
    html`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Aletheia Cafe List</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style> .truncate-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } </style>
      </head>
      <body class="bg-gray-100 text-gray-900 font-sans">
        <div class="max-w-md mx-auto min-h-screen bg-white shadow-xl">
          
          <nav class="flex border-b text-center bg-gray-50">
            ${Object.keys(stationNames).map(id => html`
              <a href="?station=${id}" class="flex-1 py-3 text-xs font-bold ${stationId === id ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-400'}">
                ${stationNames[id]}
              </a>
            `)}
          </nav>

          <header class="p-4 bg-white border-b">
            <h1 class="text-xl font-black text-gray-800">${stationNames[stationId]} <span class="text-gray-300 font-light ml-1">/ Context</span></h1>
          </header>

          <main class="divide-y divide-gray-50">
            ${sortedCafes.map(cafe => html`
              <div class="flex items-center p-3 hover:bg-blue-50 transition-colors">
                <div class="w-14 flex-none text-center leading-tight">
                  <div class="text-xs font-bold text-blue-600">${cafe.dist}<span class="text-[8px] font-normal ml-0.5">min</span></div>
                  <div class="text-[10px] text-gray-400 mt-1">${cafe.dir}</div>
                </div>

                <div class="flex-grow min-w-0 px-2">
                  <div class="flex items-center gap-1">
                    ${cafe.level ? html`<span class="text-[8px] px-1 bg-black text-white rounded-sm font-mono">${cafe.level}</span>` : ''}
                    <h2 class="font-bold text-sm truncate-text text-gray-800">${cafe.name}</h2>
                  </div>
                  <p class="text-[9px] text-gray-400 truncate-text mt-0.5">${cafe.memo}</p>
                </div>

                <div class="w-14 flex-none text-right border-l pl-2">
                  <p class="text-[9px] font-mono text-gray-600">${cafe.open}</p>
                  <div class="h-[1px] bg-gray-100 w-full my-0.5"></div>
                  <p class="text-[9px] font-mono text-gray-300">${cafe.close}</p>
                </div>
              </div>
            `)}
          </main>

          <footer class="p-8 text-center bg-gray-50 text-[10px] text-gray-300 tracking-tighter">
            <p>ALETHEIA ARCHITECTURE PROTOTYPE v0.3</p>
            <p class="mt-1">Filtering Logic: Nearest-First by Metric</p>
          </footer>
        </div>
      </body>
      </html>
    `
  )
})
/**
 * ==========================================================
 * 【test03: カフェ一覧表示プロトタイプ】
 * ==========================================================
 * ■ アクセスURL
 * - 本番: https:// -proto.tshizen2506.workers.dev/sandbox/test03
 * - ローカル: http://localhost:8787/sandbox/test03
 * * ■ 反映コマンド
 * - npx wrangler deploy (本番反映)
 * * ■ 役割
 * - DBを使わず、CAFE_LIST配列にデータを直書きして高速に一覧を表示。
 * - UIの視認性、徒歩圏内フィルタリングの必要性を検証するためのMVP。
 * ==========================================================
 */

import { Hono } from 'hono'
import { html } from 'hono/html'

export const test03 = new Hono()

// ==========================================
// 【シードデータ】まずはここに直書きして視認性をチェック
// 慣れてきたらこの配列を増やすだけで、一覧が自動更新されます。
// ==========================================
const CAFE_LIST = [
  { name: "木の実", genre: "喫茶店", score: "3.45", dist: "徒歩5分", memo: "昭和レトロ、タマゴサンド" },
  { name: "白鳥", genre: "喫茶店", score: "3.37", dist: "徒歩1分", memo: "駅前、喫煙可" },
  { name: "御豆屋", genre: "コーヒースタンド", score: "3.23", dist: "徒歩3分", memo: "テイクアウト中心" },
  { name: "Cafe one sheep", genre: "カフェ", score: "3.21", dist: "徒歩6分", memo: "おしゃれ、癒やし系" },
  // 【ここに「自分の知っている店」をどんどん追記してください】
]

// ==========================================
// メイン画面（一覧表示）
// ==========================================
test03.get('/', (c) => {
  return c.html(
    html`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>  Cafe List Test</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50 text-gray-900 p-4">
        <div class="max-w-md mx-auto">
          <header class="mb-6">
            <h1 class="text-2xl font-bold border-l-4 border-blue-600 pl-3">  Cafe List</h1>
            <p class="text-sm text-gray-500 mt-1">小岩駅周辺 プロトタイプ v0.1</p>
          </header>

          <div class="space-y-3">
            ${CAFE_LIST.map(cafe => html`
              <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div class="flex justify-between items-start">
                  <div>
                    <h2 class="font-bold text-lg">${cafe.name}</h2>
                    <p class="text-xs text-blue-600 font-semibold">${cafe.genre}</p>
                  </div>
                  <div class="text-right">
                    <span class="text-sm font-mono bg-yellow-100 px-2 py-1 rounded">⭐ ${cafe.score}</span>
                    <p class="text-xs text-gray-400 mt-2">${cafe.dist}</p>
                  </div>
                </div>
                <p class="text-sm text-gray-600 mt-2 italic">"${cafe.memo}"</p>
              </div>
            `)}
          </div>

          <footer class="mt-10 pt-6 border-t text-center text-xs text-gray-400">
            <p>※データは現在ハードコードされています</p>
            <a href="/sandbox/" class="text-blue-500 underline mt-2 inline-block">開発メニューに戻る</a>
          </footer>
        </div>
      </body>
      </html>
    `
  )
})
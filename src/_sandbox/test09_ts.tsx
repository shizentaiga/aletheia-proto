/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { html, raw } from 'hono/html'
import { PREFECTURE_MASTER, UI_TEXT } from '../lib/constants'
import { getSearchScripts } from '../components/SearchScripts'

export const test09 = new Hono()

test09.get('/', (c) => {
  // 都道府県を「地方」の直下に並べる構造
  const PREF_ONLY_MASTER = {
    region: {
      options: Object.fromEntries(
        Object.entries(PREFECTURE_MASTER)
          .filter(([key]) => !isNaN(Number(key)))
          .map(([_, name]) => [name, { value: name, sub: null }])
      )
    },
    category: { options: {} }
  }

  const scriptContent = getSearchScripts(PREF_ONLY_MASTER, UI_TEXT, PREFECTURE_MASTER)

  return c.html(html`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
      <style>
        /* 一覧を常に見やすくするためのスタイル */
        .drilldown-item { 
          padding: 16px; 
          border-bottom: 1px solid #eee; 
          cursor: pointer; 
          display: flex; 
          justify-content: space-between;
          align-items: center;
          background: white;
        }
        #drilldown-region { 
          border: 1px solid #ddd; 
          border-radius: 8px; 
          margin-top: 8px; 
          max-height: 500px; 
          overflow-y: auto; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        /* JSの toggleDrilldown で display: block になる */
      </style>
    </head>
    <body style="font-family: sans-serif; padding: 20px; background: #f2f2f7;">
      
      <form id="search-form">
        <div onclick="toggleDrilldown('region')" style="padding:16px; background:#007AFF; color:white; border-radius:8px; cursor:pointer; text-align:center; font-weight:bold;">
          📍 <span id="current-region-text">都道府県を選択してください</span>
        </div>

        <div id="drilldown-region" style="display: none;"></div>
        
        <input type="hidden" id="hidden-region">
        <div id="active-filters"></div>
      </form>

      <script>${raw(scriptContent)}</script>
    </body>
    </html>
  `)
})
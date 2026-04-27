/**
 * [test07] ドリルダウン最終版（3階層・DB連携）
 * 📁 File Path: src/_sandbox/test07_drilldown.tsx
 */

/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { html, raw } from 'hono/html'
import { UI_TEXT, PREFECTURE_MASTER, SEARCH_MASTER, AREA_CONFIG } from '../lib/constants'
import { getCityStats } from '../db/cafe_queries'

type Bindings = { ALETHEIA_PROTO_DB: D1Database }
export const test07 = new Hono<{ Bindings: Bindings }>()

/**
 * 1. 【API】市区町村取得
 */
test07.get('/api/cities/:pref', async (c) => {
  const db = c.env?.ALETHEIA_PROTO_DB;
  const pref = c.req.param('pref');
  if (!db) return c.json({ success: false, data: [] });
  const stats = await getCityStats(db, pref);
  return c.json({ success: true, data: stats });
});

/**
 * 2. 【メイン表示】
 */
test07.get('/', (c) => {
  const detectedId = "Tokyo";
  const theme = AREA_CONFIG.STYLES;

  return c.html(html`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
      <title>Drilldown Test - ALETHEIA</title>
      <style>
        #area-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 1000; transform: translateX(100%); transition: transform 0.2s ease; display: flex; flex-direction: column; visibility: hidden; font-family: sans-serif; }
        #area-overlay.is-open { transform: translateX(0); visibility: visible; }
        .nav-header { height: 54px; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; border-bottom: 0.5px solid ${theme.BORDER_GRAY}; }
        .back-btn { min-width: 48px; height: 48px; color: ${theme.PRIMARY_BLUE}; font-size: 24px; border: none; background: none; cursor: pointer; }
        .header-title { font-weight: 600; font-size: 17px; }
        .menu-list { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        .list-item { padding: 14px 16px; border-bottom: 0.5px solid ${theme.BORDER_GRAY}; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .list-item:active { background: #f2f2f7; }
        .layer-slide-in { animation: areaSlideIn 0.2s forwards; }
        @keyframes areaSlideIn { from { transform: translateX(15%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        body.area-open { overflow: hidden; }
      </style>
    </head>
    <body style="background:#f2f2f7; padding:20px;">

      <div style="display:flex; flex-direction:column; gap:10px; margin-top:40px;">
        <button onclick="openAreaSelect()" style="padding:16px; border-radius:12px; border:none; background:white; font-weight:bold; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          パターンA：現在地なし
        </button>
        <button onclick="openAreaSelect('${detectedId}')" style="padding:16px; border-radius:12px; border:none; background:white; font-weight:bold; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          パターンB：現在地あり (${detectedId})
        </button>
      </div>

      <div id="area-overlay">
        <div class="nav-header">
          <button class="back-btn" id="back-action">×</button>
          <div class="header-title" id="header-title">エリアを選択</div>
          <div style="width:48px"></div>
        </div>
        <div class="menu-list" id="area-content"></div>
      </div>

      <script>
        (function() {
          const SEARCH_OPTIONS = ${raw(JSON.stringify(SEARCH_MASTER.region.options))};
          const PREF_MASTER = ${raw(JSON.stringify(PREFECTURE_MASTER))};
          const overlay = document.getElementById('area-overlay');
          const content = document.getElementById('area-content');
          const title = document.getElementById('header-title');
          const backBtn = document.getElementById('back-action');
          let stack = [];

          // 1. 初期表示（Level 1: 地方）
          const buildLevel1 = () => {
            return Object.entries(SEARCH_OPTIONS)
              .filter(([label]) => label !== "${UI_TEXT.ALL_COUNTRY}")
              .map(([label]) => \`
                <div class="list-item" onclick="goNextLevel('\${label}', 'region')">
                  <span>\${label}</span><span>＞</span>
                </div>
              \`).join('');
          };

          window.openAreaSelect = function(key = null) {
            location.hash = 'area';
            overlay.classList.add('is-open');
            document.body.classList.add('area-open');
            
            stack = [{ html: buildLevel1(), title: "エリアを選択" }];
            
            if (key && PREF_MASTER[key]) {
              // 現在地がある場合は自動で1段階潜る
              goNextLevel(PREF_MASTER[key], 'prefecture', true);
            } else {
              render();
            }
          };

          // 2. 階層移動ロジック (本番のアルゴリズムを注入)
          window.goNextLevel = async function(label, currentType, isAuto = false) {
            if (currentType === 'region') {
              // Level 2: 都道府県リストを表示
              const prefs = SEARCH_OPTIONS[label].sub || [];
              const html = prefs.map(p => {
                const pName = (typeof p === 'string') ? p : p.label;
                return \`
                  <div class="list-item" onclick="goNextLevel('\${pName}', 'prefecture')">
                    <span>\${pName}</span><span>＞</span>
                  </div>
                \`;
              }).join('');
              stack.push({ html, title: label });
            } 
            else if (currentType === 'prefecture') {
              // Level 3: 市区町村をDBから取得
              content.innerHTML = '<div style="padding:40px; text-align:center;">読み込み中...</div>';
              
              try {
                // 相対パスでAPIを叩く
                const res = await fetch(\`./api/cities/\${encodeURIComponent(label)}\`).then(r => r.json());
                
                const cityHtml = \`<div class="list-item" onclick="finalize('\${label} 全体')"><b>\${label} 全体</b></div>\` + 
                  (res.data.length > 0 ? res.data.map(c => \`
                    <div class="list-item" onclick="finalize('\${label} \${c.name}')">
                      <span>\${c.name}</span><span style="color:#8e8e93; font-size:14px;">\${c.count}</span>
                    </div>
                  \`).join('') : '<div class="list-item" style="color:#ccc">店舗データがありません</div>');
                
                const nextState = { html: cityHtml, title: label };
                if (isAuto) stack.push(nextState); else stack.push(nextState); 
              } catch (e) {
                stack.push({ html: '<div class="list-item">取得に失敗しました: ' + e + '</div>', title: label });
              }
            }
            render();
          };

          function render() {
            const curr = stack[stack.length - 1];
            if (!curr) return;
            content.innerHTML = curr.html;
            title.innerText = curr.title;
            backBtn.innerText = stack.length > 1 ? "＜" : "×";
            
            // アニメーションの再トリガー
            content.classList.remove('layer-slide-in');
            void content.offsetWidth; 
            content.classList.add('layer-slide-in');
          }

          window.finalize = (val) => { 
            alert("選択完了: " + val); 
            history.back(); 
          };

          backBtn.onclick = (e) => {
            e.stopPropagation();
            stack.length > 1 ? (stack.pop(), render()) : history.back();
          };

          window.addEventListener('popstate', () => {
            if (!location.hash.includes('area')) {
              overlay.classList.remove('is-open');
              document.body.classList.remove('area-open');
            }
          });
        })();
      </script>
    </body>
    </html>
  `);
});
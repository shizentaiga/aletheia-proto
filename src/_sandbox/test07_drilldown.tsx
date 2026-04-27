/**
 * [test07] ドリルダウンの改善（Master Data Sync版）
 * 📁 File Path: src/_sandbox/test07_drilldown.tsx
 */

/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { html, raw } from 'hono/html'
// constants.ts から AREA_CONFIG も含めてインポート
import { 
  UI_TEXT, 
  PREFECTURE_MASTER, 
  SEARCH_MASTER,
  AREA_CONFIG 
} from '../lib/constants'

export const test07 = new Hono()

/**
 * 1. 【外部定数】
 * 意図：constants.ts 側の AREA_CONFIG を使用。
 * test07固有の追加設定が必要な場合のみ、ここでスプレッド展開して定義。
 */
const CONFIG = AREA_CONFIG;

/**
 * 2. 【DBデータ生成】src/db/areaQueries.ts 相当
 * 意図：SEARCH_MASTER から地方リストを生成。
 */
const generateLevel1Html = () => {
  return Object.entries(SEARCH_MASTER.region.options)
    .filter(([label]) => label !== UI_TEXT.ALL_COUNTRY)
    .map(([label, data]) => `
      <div class="list-item" onclick="goNextLevel('${data.value}', '${label}')">
        <span>${label}</span><span>＞</span>
      </div>
    `).join('');
};

/**
 * 3. 【スタイル定義】src/components/AreaSearchOverlay.tsx 相当
 */
const AreaStyles = (theme: typeof CONFIG.STYLES) => html`
<style>
  #area-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: white; z-index: 1000; transform: translateX(100%);
    transition: transform 0.2s cubic-bezier(0.33, 1, 0.68, 1);
    display: flex; flex-direction: column; visibility: hidden;
  }
  #area-overlay.is-open { transform: translateX(0); visibility: visible; }
  .nav-header { height: 54px; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; border-bottom: 0.5px solid ${theme.BORDER_GRAY}; }
  .back-btn { min-width: 48px; height: 48px; color: ${theme.PRIMARY_BLUE}; font-size: 24px; border: none; background: none; cursor: pointer; }
  .header-title { font-weight: 600; font-size: 17px; }
  .menu-list { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
  .list-item { padding: 14px 16px; border-bottom: 0.5px solid ${theme.BORDER_GRAY}; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
  .list-item:active { background: #f2f2f7; }
  .layer-slide-in { animation: areaSlideIn 0.2s forwards; }
  @keyframes areaSlideIn { from { transform: translateX(30%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  body.area-open { overflow: hidden; }
</style>
`;

/**
 * 4. 【UI構造】src/components/AreaSearchOverlay.tsx 相当
 */
const AreaOverlayUI = (defaultTitle: string) => html`
  <div id="area-overlay">
    <div class="nav-header">
      <button class="back-btn" id="back-action">×</button>
      <div class="header-title" id="header-title">${defaultTitle}</div>
      <div style="width:48px"></div>
    </div>
    <div class="menu-list" id="area-content"></div>
  </div>
`;

/**
 * 5. 【制御ロジック】src/components/AreaSearchOverlay.tsx 相当
 */
const AreaScripts = (level1Html: string, theme: typeof CONFIG.STYLES) => html`
<template id="level1-template" style="display:none;">${raw(level1Html)}</template>

<script>
  (function() {
    const templateEl = document.getElementById('level1-template');
    const INJECTED_LEVEL1 = templateEl ? templateEl.innerHTML : '';
    
    const SEARCH_OPTIONS = ${raw(JSON.stringify(SEARCH_MASTER.region.options))};
    const PREF_MASTER = ${raw(JSON.stringify(PREFECTURE_MASTER))};

    const overlay = document.getElementById('area-overlay');
    const content = document.getElementById('area-content');
    const title = document.getElementById('header-title');
    const backBtn = document.getElementById('back-action');
    let currentStack = [];

    window.openAreaSelect = function(initialKey = null) {
      if (overlay.classList.contains('is-open')) return;

      location.hash = 'area';
      overlay.classList.add('is-open');
      document.body.classList.add('area-open');
      
      currentStack = [{ html: INJECTED_LEVEL1, title: "${SEARCH_MASTER.region.title}" }];

      const prefName = initialKey ? PREF_MASTER[initialKey] : null;
      if (prefName) {
        for (const [regionLabel, opt] of Object.entries(SEARCH_OPTIONS)) {
          if (opt.sub && opt.sub.includes(prefName)) {
            currentStack.push({ 
              html: generateSubListHtml(opt.sub, prefName), 
              title: regionLabel 
            });
            break;
          }
        }
      }
      renderLevel();
    };

    window.goNextLevel = function(val, label) {
      const option = Object.values(SEARCH_OPTIONS).find(o => o.value === val);
      if (option && option.sub) {
        currentStack.push({ html: generateSubListHtml(option.sub), title: label });
        renderLevel();
      }
    };

    function generateSubHtml(prefs, highlight = null) {
      return prefs.map(p => {
        const isSelected = p === highlight;
        const style = isSelected ? 'color:${theme.PRIMARY_BLUE}; font-weight:bold;' : '';
        return \`<div class="list-item" onclick="finalizeArea('\${p}')">
          <span style="\${style}">\${p}\${isSelected ? ' (現在地)' : ''}</span>
        </div>\`;
      }).join('');
    }

    function renderLevel() {
      const current = currentStack[currentStack.length - 1];
      if (!current) return;
      content.innerHTML = current.html; 
      title.innerText = current.title;
      backBtn.innerText = currentStack.length > 1 ? "＜" : "×";
      
      content.classList.remove('layer-slide-in');
      void content.offsetWidth;
      content.classList.add('layer-slide-in');
    }

    backBtn.onclick = () => {
      if (currentStack.length > 1) { currentStack.pop(); renderLevel(); } 
      else { closeAreaSelect(); }
    };

    function closeAreaSelect() { if(location.hash === '#area') history.back(); }

    window.addEventListener('popstate', () => {
      if (!location.hash.includes('area')) {
        overlay.classList.remove('is-open');
        document.body.classList.remove('area-open');
        currentStack = [];
      }
    });

    window.finalizeArea = (res) => { alert("決定: " + res); closeAreaSelect(); };
    function generateSubListHtml(prefs, highlight) { return generateSubHtml(prefs, highlight); }
  })();
</script>
`;

/**
 * 6. 【メインハンドラー】
 */
test07.get('/', (c) => {
  const level1Data = generateLevel1Html();
  const detectedId = "Tokyo"; 

  return c.html(html`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Master Sync Final - ALETHEIA</title>
      ${AreaStyles(CONFIG.STYLES)}
    </head>
    <body style="background: #f2f2f7; font-family: sans-serif; padding: 20px;">
      
      <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 50px;">
        <button onclick="openAreaSelect()" style="padding: 16px; border-radius: 8px; border: 1px solid #ccc;">
          パターンA：初期値なし
        </button>

        <button onclick="openAreaSelect('${detectedId}')" style="padding: 16px; border-radius: 8px; border: 1px solid #ccc; background: white;">
          パターンB：現在地解決 (${detectedId})
        </button>
      </div>

      ${AreaOverlayUI(SEARCH_MASTER.region.title)}
      ${AreaScripts(level1Data, CONFIG.STYLES)}

    </body>
    </html>
  `);
});
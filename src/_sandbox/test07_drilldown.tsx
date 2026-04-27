import { Hono } from 'hono'
import { html, raw } from 'hono/html'

export const test07 = new Hono()

/**
 * =============================================================================
 * 【配置先：src/constants/areaConfig.ts】
 * 役割：システム全体で共有するエリア設定。
 * =============================================================================
 */
const AREA_CONFIG = {
  IDS: { TOKYO: '13' },
  LABELS: { TOKYO: '東京都', DEFAULT_TITLE: 'エリアを選択' },
  STYLES: { PRIMARY_BLUE: '#007AFF', BORDER_GRAY: '#e5e5ea' }
} as const;

/**
 * =============================================================================
 * 【配置先：src/pages/Top/TopStyles.tsx または独立したCSSファイル】
 * 役割：エリア選択オーバーレイ専用のスタイル定義。
 * =============================================================================
 */
const AreaStyles = () => html`
<style>
  #area-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: white; z-index: 1000; transform: translateX(100%);
    transition: transform 0.2s cubic-bezier(0.33, 1, 0.68, 1);
    display: flex; flex-direction: column; visibility: hidden;
  }
  #area-overlay.is-open { transform: translateX(0); visibility: visible; }
  .nav-header { height: 54px; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; border-bottom: 0.5px solid ${AREA_CONFIG.STYLES.BORDER_GRAY}; }
  .back-btn { min-width: 48px; height: 48px; color: ${AREA_CONFIG.STYLES.PRIMARY_BLUE}; font-size: 24px; border: none; background: none; cursor: pointer; }
  .header-title { font-weight: 600; font-size: 17px; }
  .menu-list { flex: 1; overflow-y: auto; }
  .list-item { padding: 14px 16px; border-bottom: 0.5px solid ${AREA_CONFIG.STYLES.BORDER_GRAY}; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
  .list-item:active { background: #f2f2f7; }
  .layer-slide-in { animation: areaSlideIn 0.2s forwards; }
  @keyframes areaSlideIn { from { transform: translateX(30%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
</style>
`;

/**
 * =============================================================================
 * 【配置先：src/pages/Top/AreaOverlay.tsx】
 * 役割：オーバーレイのHTML構造。TopPage.tsx の末尾付近で呼び出す。
 * =============================================================================
 */
const AreaOverlayUI = () => html`
  <div id="area-overlay">
    <div class="nav-header">
      <button class="back-btn" id="back-action">×</button>
      <div class="header-title" id="header-title">${AREA_CONFIG.LABELS.DEFAULT_TITLE}</div>
      <div style="width:48px"></div>
    </div>
    <div class="menu-list" id="area-content"></div>
  </div>
`;

/**
 * =============================================================================
 * 【配置先：src/pages/Top/AreaScripts.tsx】
 * 役割：クライアントサイドの動的制御ロジック。
 * 引数の level1Html は、サーバー側（api_handlers等）で生成したHTMLを渡す。
 * =============================================================================
 */
const AreaScripts = (level1Html: string) => html`
<template id="level1-template">${raw(level1Html)}</template>

<script>
  (function() {
    const templateEl = document.getElementById('level1-template');
    const MOCK_LEVEL1 = templateEl.innerHTML;
    
    // 【本番実装時の注意】
    // MOCK_DATA は api_handlers.tsx で定義したAPI endpoint (/api/areas?id=xxx 等) 
    // から fetch する形に書き換えることで、完全な動的化が可能。
    const MOCK_DATA = {
      '13': \`
        <div class="list-item" onclick="finalizeArea('東京都（全域）')"><span style="color:#007AFF; font-weight:600;">東京都（全域）</span></div>
        <div class="list-item" onclick="finalizeArea('新宿区')"><span>新宿区</span></div>
      \`
    };

    const overlay = document.getElementById('area-overlay');
    const content = document.getElementById('area-content');
    const title = document.getElementById('header-title');
    const backBtn = document.getElementById('back-action');
    let currentStack = [];

    // モーダル起動用（外部から window.openAreaSelect() で叩く）
    window.openAreaSelect = function(initialId = null, initialLabel = null) {
      location.hash = 'area';
      overlay.classList.add('is-open');
      
      // スタックの底に「地方リスト」を敷く
      currentStack = [{ html: MOCK_LEVEL1, title: "${AREA_CONFIG.LABELS.DEFAULT_TITLE}" }];

      // 初期値（CDN由来等）がある場合は2層目まで自動展開
      if (initialId && MOCK_DATA[initialId]) {
        currentStack.push({ html: MOCK_DATA[initialId], title: initialLabel });
      }
      
      renderLevel();
    };

    // リスト内クリック時の遷移用
    window.goNextLevel = function(id, label) {
      const nextHtml = MOCK_DATA[id] || \`<div class="list-item"><span>\${label} のデータはありません</span></div>\`;
      currentStack.push({ html: nextHtml, title: label });
      renderLevel();
    };

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
      if (currentStack.length > 1) {
        currentStack.pop();
        renderLevel();
      } else {
        closeAreaSelect();
      }
    };

    function closeAreaSelect() {
      if(location.hash === '#area') history.back();
    }

    window.addEventListener('popstate', () => {
      if (!location.hash.includes('area')) overlay.classList.remove('is-open');
    });

    window.finalizeArea = (result) => {
      // 検索結果の反映ロジック（URL遷移など）をここに記述
      alert("決定: " + result);
      closeAreaSelect();
    };
  })();
</script>
`;

/**
 * =============================================================================
 * 【配置先：src/handlers/api_handlers.tsx または TopPage.tsx の get ルート】
 * 役割：最終的なページの組み立てと、初期データの注入。
 * =============================================================================
 */
test07.get('/', (c) => {
  // DBから取得した「地方リスト」のHTML。実際には map() 等で生成。
  const level1Data = `
    <div class="list-item" onclick="goNextLevel('13', '東京都')">
      <span>関東</span><span>＞</span>
    </div>
  `;

  return c.html(html`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Modular Area Test - Guide版</title>
      ${AreaStyles()}
    </head>
    <body style="background: #f2f2f7;">
      
      <div style="padding: 50px; display: flex; flex-direction: column; gap: 20px;">
        <button onclick="openAreaSelect()" style="padding: 16px;">
          パターンA：初期値なし
        </button>

        <button onclick="openAreaSelect('${AREA_CONFIG.IDS.TOKYO}', '${AREA_CONFIG.LABELS.TOKYO}')" style="padding: 16px;">
          パターンB：初期値あり
        </button>
      </div>

      ${AreaOverlayUI()}
      ${AreaScripts(level1Data)}

    </body>
    </html>
  `);
});
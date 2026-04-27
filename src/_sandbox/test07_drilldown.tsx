/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { html, raw } from 'hono/html'

export const test07 = new Hono()

/**
 * 1. 【外部定数】src/constants/areaConfig.ts 相当
 * 意図：ハードコードを排除し、デザインシステムとIDを一本化
 */
const AREA_CONFIG = {
  IDS: { TOKYO: '13', OSAKA: '27' },
  LABELS: { TOKYO: '東京都', OSAKA: '大阪府', DEFAULT_TITLE: 'エリアを選択' },
  STYLES: { PRIMARY_BLUE: '#007AFF', BORDER_GRAY: '#e5e5ea' }
} as const;

/**
 * 2. 【DBデータ生成】src/db/cafe_queries.ts 相当のロジック
 * 意図：サーバーサイドで組み立てたHTMLが、壊れずにクライアントへ渡るか検証
 */
const generateLevel1Html = (data: {id: string, name: string}[]) => {
  return data.map(item => `
    <div class="list-item" onclick="goNextLevel('${item.id}', '${item.name}')">
      <span>${item.name}</span><span>＞</span>
    </div>
  `).join('');
};

/**
 * 3. 【スタイル定義】
 * 意図：外部テーマ変数への依存。body固定用クラスの追加。
 */
const AreaStyles = (theme: typeof AREA_CONFIG.STYLES) => html`
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
  body.area-open { overflow: hidden; } /* 背後スクロール防止 */
</style>
`;

/**
 * 4. 【UI構造】
 * 意図：初期タイトルの外部変数化。
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
 * 5. 【制御ロジック】
 * 意図：ConfigおよびDB由来データの完全な動的受け入れ。
 */
const AreaScripts = (level1Html: string, config: typeof AREA_CONFIG) => html`
<template id="level1-template" style="display:none;">${raw(level1Html)}</template>

<script>
  (function() {
    const templateEl = document.getElementById('level1-template');
    const INJECTED_LEVEL1 = templateEl ? templateEl.innerHTML : '';
    
    // API経由で取得する想定の階層データ（キーも外部定義に依存）
    const DYNAMIC_MAP = {
      [String('${config.IDS.TOKYO}')]: \`
        <div class="list-item" onclick="finalizeArea('${config.LABELS.TOKYO}（全域）')"><span>${config.LABELS.TOKYO}（全域）</span></div>
        <div class="list-item" onclick="finalizeArea('新宿区')"><span>新宿区</span></div>
      \`,
      [String('${config.IDS.OSAKA}')]: \`
        <div class="list-item" onclick="finalizeArea('${config.LABELS.OSAKA}（全域）')"><span>${config.LABELS.OSAKA}（全域）</span></div>
      \`
    };

    const overlay = document.getElementById('area-overlay');
    const content = document.getElementById('area-content');
    const title = document.getElementById('header-title');
    const backBtn = document.getElementById('back-action');
    let currentStack = [];

    window.openAreaSelect = function(initialId = null, initialLabel = null) {
      if (overlay.classList.contains('is-open')) return; // 二重起動防止

      location.hash = 'area';
      overlay.classList.add('is-open');
      document.body.classList.add('area-open');
      
      // スタックの底を外部注入HTMLで構築
      currentStack = [{ html: INJECTED_LEVEL1, title: "${config.LABELS.DEFAULT_TITLE}" }];

      // 初期値連動（CDN/ヘッダー由来）
      const sid = initialId ? String(initialId) : null;
      if (sid && DYNAMIC_MAP[sid]) {
        currentStack.push({ html: DYNAMIC_MAP[sid], title: initialLabel });
      }
      
      renderLevel();
    };

    window.goNextLevel = function(id, label) {
      const sid = String(id);
      const nextHtml = DYNAMIC_MAP[sid] || \`<div class="list-item"><span>\${label} の詳細は未実装です</span></div>\`;
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
      if (!location.hash.includes('area')) {
        overlay.classList.remove('is-open');
        document.body.classList.remove('area-open');
        currentStack = []; // スタッククリア
      }
    });

    window.finalizeArea = (result) => {
      alert("決定: " + result);
      closeAreaSelect();
    };
  })();
</script>
`;

/**
 * 6. 【メインハンドラー】
 * 意図：外部変数・外部ロジックの流し込みテスト。
 */
test07.get('/', (c) => {
  // DBから動的に生成した想定のデータ
  const regionsFromDB = [
    { id: AREA_CONFIG.IDS.TOKYO, name: AREA_CONFIG.LABELS.TOKYO },
    { id: AREA_CONFIG.IDS.OSAKA, name: AREA_CONFIG.LABELS.OSAKA }
  ];
  const level1Data = generateLevel1Html(regionsFromDB);

  // 外部(CDN等)から取得した想定の変数
  const detectedId = AREA_CONFIG.IDS.TOKYO;
  const detectedLabel = AREA_CONFIG.LABELS.TOKYO;

  return c.html(html`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Modular Area Test - Enterprise版</title>
      ${AreaStyles(AREA_CONFIG.STYLES)}
    </head>
    <body style="background: #f2f2f7; font-family: sans-serif;">
      
      <div style="padding: 50px; display: flex; flex-direction: column; gap: 20px;">
        <button onclick="openAreaSelect()" style="padding: 16px; border-radius: 8px; border: 1px solid #ccc;">
          パターンA：初期値なし（外部HTML注入をテスト）
        </button>

        <button onclick="openAreaSelect('${detectedId}', '${detectedLabel}')" style="padding: 16px; border-radius: 8px; border: 1px solid #ccc; background: white;">
          パターンB：初期値あり（外部変数連動をテスト）
        </button>
      </div>

      ${AreaOverlayUI(AREA_CONFIG.LABELS.DEFAULT_TITLE)}
      ${AreaScripts(level1Data, AREA_CONFIG)}

    </body>
    </html>
  `);
});
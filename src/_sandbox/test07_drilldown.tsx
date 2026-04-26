import { Hono } from 'hono'
import { html } from 'hono/html'

export const test07 = new Hono()

// --- 将来の外部ファイル化を見据えた定数管理 ---

const areaStyles = html`
<style>
    :root {
        --primary-blue: #007AFF;
        --border-gray: #e5e5ea;
        --z-index-base: 1000;
        --transition: transform 0.2s cubic-bezier(0.33, 1, 0.68, 1);
    }
    body {
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        margin: 0;
        background: #f2f2f7;
        touch-action: pan-y;
        overscroll-behavior-x: none;
    }
    .open-trigger {
        margin: 100px auto;
        display: block;
        padding: 16px 32px;
        background: var(--primary-blue);
        color: white;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 17px;
    }
    #area-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        z-index: var(--z-index-base);
        transform: translateX(100%);
        transition: var(--transition);
        display: flex;
        flex-direction: column;
        visibility: hidden;
    }
    #area-overlay.is-open {
        transform: translateX(0);
        visibility: visible;
    }
    .nav-header {
        height: 54px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 8px;
        border-bottom: 0.5px solid var(--border-gray);
        flex-shrink: 0;
    }
    .back-btn {
        min-width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        color: var(--primary-blue);
        cursor: pointer;
        font-size: 16px;
        border: none;
        background: none;
    }
    .header-title { font-weight: 600; font-size: 17px; }
    .menu-list {
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }
    .list-item {
        padding: 14px 16px;
        min-height: 48px;
        border-bottom: 0.5px solid var(--border-gray);
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
    }
    .list-item:active { background: #f2f2f7; }
    .sticky-footer {
        padding: 16px;
        border-top: 0.5px solid var(--border-gray);
        background: white;
    }
    .confirm-btn {
        width: 100%;
        padding: 14px;
        background: var(--primary-blue);
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        font-size: 16px;
    }
    .layer-slide-in { animation: slideIn 0.2s forwards; }
    @keyframes slideIn {
        from { transform: translateX(30%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
</style>
`;

const areaScripts = html`
<script>
    const MOCK_FRAGMENTS = {
        level1: \`
            <div class="list-item" onclick="fetchNextLevel('13', '東京都')"><span>関東</span><span>＞</span></div>
            <div class="list-item" onclick="fetchNextLevel('27', '大阪府')"><span>関西</span><span>＞</span></div>
        \`,
        level2_13: \`
            <div class="list-item" onclick="finalize('東京都（全域）')"><span style="color:var(--primary-blue); font-weight:600;">東京都（全域）</span></div>
            <div class="list-item" onclick="fetchNextLevel('13113', '渋谷区')"><span>渋谷区</span><span>＞</span></div>
            <div class="list-item" onclick="fetchNextLevel('13115', '杉並区')"><span>杉並区</span><span>＞</span></div>
        \`
    };

    const overlay = document.getElementById('area-overlay');
    const content = document.getElementById('area-content');
    const title = document.getElementById('header-title');
    const backBtn = document.getElementById('back-action');
    let currentStack = [];

    function openAreaSelect() {
        location.hash = 'area';
        overlay.classList.add('is-open');
        renderInitialLevel();
    }

    function closeAreaSelect() {
        history.replaceState(null, '', location.pathname + location.search);
        overlay.classList.remove('is-open');
        currentStack = [];
    }

    window.addEventListener('popstate', () => {
        if (!location.hash.includes('area') && overlay.classList.contains('is-open')) {
            overlay.classList.remove('is-open');
        }
    });

    backBtn.onclick = () => {
        if (currentStack.length > 1) {
            currentStack.pop();
            const prev = currentStack[currentStack.length - 1];
            renderLevel(prev.html, prev.title, false);
        } else {
            closeAreaSelect();
        }
    };

    function renderInitialLevel() {
        renderLevel(MOCK_FRAGMENTS.level1, "エリアを選択", true);
    }

    function fetchNextLevel(id, label) {
        const mockHtml = MOCK_FRAGMENTS[\`level2_\${id}\`] || \`<div class="list-item" onclick="finalize('\${label}')"><span>\${label} の市区町村リスト...</span></div>\`;
        renderLevel(mockHtml, label, true);
    }

    function renderLevel(html, label, isForward) {
        if (isForward) currentStack.push({ html, title: label });
        content.scrollTo(0, 0);
        title.innerText = label;
        content.innerHTML = html;
        content.classList.remove('layer-slide-in');
        void content.offsetWidth;
        content.classList.add('layer-slide-in');
        backBtn.innerText = currentStack.length > 1 ? "＜ 戻る" : "× 閉じる";
    }

    function finalize(result) {
        alert("決定しました: " + result);
        closeAreaSelect();
    }
</script>
`;

// --- メインルーティング ---

test07.get('/', (c) => {
    return c.html(html`
        <!DOCTYPE html>
        <html lang="ja">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>ALETHEIA Area Selection MVP - Ver 0.8</title>
            ${areaStyles}
        </head>
        <body>

            <button class="open-trigger" onclick="openAreaSelect()">エリアから探す</button>

            <div id="area-overlay">
                <div class="nav-header">
                    <button class="back-btn" id="back-action">× 閉じる</button>
                    <div class="header-title" id="header-title">エリアを選択</div>
                    <div style="width:48px"></div>
                </div>
                
                <div class="menu-list" id="area-content">
                    </div>

                <div class="sticky-footer">
                    <button class="confirm-btn" onclick="closeAreaSelect()">現在の条件で決定</button>
                </div>
            </div>

            ${areaScripts}
        </body>
        </html>
    `)
})
/**
 * 検索画面のフロントエンドロジック（JavaScript）を担当するコンポーネント
 * ドリルダウンメニューの制御、マスターデータの保持、HTMXのトリガー実行などを行う
 * 📁 File Path: src/components/SearchLogic.tsx
 */

/** @jsxImportSource hono/jsx */
import { SEARCH_MASTER, UI_TEXT, PREFECTURE_MASTER } from '../lib/constants'

export const SearchLogic = () => (
  <script dangerouslySetInnerHTML={{ __html: `
    /**
     * 1. 定数の注入
     */
    const MASTER_DATA = ${JSON.stringify(SEARCH_MASTER)};
    const UI_CONST = ${JSON.stringify(UI_TEXT)};
    const PREF_MAP = ${JSON.stringify(PREFECTURE_MASTER)};

    /**
     * 2. ドリルダウン制御
     */
    function closeAllDrilldowns() {
      document.querySelectorAll('[id^="drilldown-"]').forEach(el => {
        el.style.display = 'none';
      });
      document.removeEventListener('click', closeAllDrilldowns);
    }

    window.toggleDrilldown = function(mode) {
      if (window.event) window.event.stopPropagation();
      const container = document.getElementById('drilldown-' + mode);
      const isAlreadyOpen = container.style.display === 'block';

      closeAllDrilldowns();

      if (!isAlreadyOpen) {
        renderDrilldownMenu(mode, container);
        container.style.display = 'block';
        container.style.maxHeight = '400px';
        container.style.overflowY = 'auto';
        
        setTimeout(() => {
          document.addEventListener('click', closeAllDrilldowns, { once: true });
        }, 0);
      }
    };

    function renderDrilldownMenu(mode, container) {
      const modeData = MASTER_DATA[mode];
      container.onclick = (e) => e.stopPropagation();

      container.innerHTML = Object.keys(modeData.options).map(function(key) {
        const data = modeData.options[key];
        const hasSub = !!data.sub;
        
        let html = '<div class="menu-item-group">';
        html += '<div class="drilldown-item" onclick="handleItemClick(this, \\'' + mode + '\\', \\'' + key + '\\')">';
        html += '<span>' + key + '</span>';
        if (hasSub) html += '<span class="arrow">▶</span>';
        html += '</div>';
        
        if (hasSub) {
          html += '<div class="sub-menu">';
          const allLabel = key + UI_CONST.AREA_ALL_SUFFIX;
          html += '<div class="sub-item" style="color: #4285F4; font-weight: bold;" onclick="finalizeSelection(\\'' + mode + '\\', \\'' + data.value + '\\', \\'' + key + '\\')">' + allLabel + '</div>';
          html += data.sub.map(function(item) {
            return '<div class="sub-item" onclick="finalizeSelection(\\'' + mode + '\\', \\'' + item + '\\', \\'' + item + '\\')">' + item + '</div>';
          }).join('');
          html += '</div>';
        }
        html += '</div>';
        return html;
      }).join('');
    }

    window.handleItemClick = function(el, mode, key) {
      if (window.event) window.event.stopPropagation();
      const data = MASTER_DATA[mode].options[key];
      if (data.sub) {
        const subMenu = el.nextElementSibling;
        const arrow = el.querySelector('.arrow');
        const isShowing = subMenu.classList.contains('show');
        
        document.querySelectorAll('.sub-menu').forEach(m => m.classList.remove('show'));
        document.querySelectorAll('.arrow').forEach(a => a.classList.remove('open'));

        if (!isShowing) {
          subMenu.classList.add('show');
          arrow.classList.add('open');
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else {
        finalizeSelection(mode, data.value, key);
      }
    };

    /**
     * 3. 選択の確定ロジック
     */
    window.finalizeSelection = function(mode, val, label) {
      const isReset = (val === '' || label === UI_CONST.ALL_COUNTRY || label === UI_CONST.RESET_LABEL);
      const hiddenInput = document.getElementById('hidden-' + mode);
      const labelElement = document.getElementById('current-' + mode + '-text');
      const form = document.getElementById('search-form');

      if (hiddenInput) hiddenInput.value = val;
      
      if (labelElement) {
        const displayLabel = (mode === 'region' && PREF_MAP[val]) ? PREF_MAP[val] : label;
        labelElement.innerText = isReset ? UI_CONST.RESET_LABEL : displayLabel;
      }

      if (form) {
        form.setAttribute('data-current-' + mode, val);
      }
      
      updateFilterChips();
      closeAllDrilldowns();
      
      if (window.htmx) {
        window.htmx.trigger(form, 'submit');
      }
    };

    /**
     * 🌟 新設：フィルター解除ロジック
     */
    window.removeFilter = function(mode) {
      // 値を空にして確定ロジックを呼ぶことで、UIリセットと再検索を同時に行う
      window.finalizeSelection(mode, '', UI_CONST.RESET_LABEL);
    };

    /**
     * 4. 初期化・同期ロジック (HTML属性駆動 + 日本語変換)
     */
    window.syncUIFromData = function() {
      const form = document.getElementById('search-form');
      if (!form) return;

      const modes = ['region', 'category'];

      modes.forEach(mode => {
        const val = form.getAttribute('data-current-' + mode) || '';
        const input = document.getElementById('hidden-' + mode);
        const label = document.getElementById('current-' + mode + '-text');

        if (input) input.value = val;

        if (label) {
          if (!val || val === 'unknown') {
            label.innerText = UI_CONST.RESET_LABEL;
          } else {
            const displayName = (mode === 'region' && PREF_MAP[val]) ? PREF_MAP[val] : val;
            label.innerText = displayName;
          }
        }
      });

      updateFilterChips();
    };

    function updateFilterChips() {
      const chipArea = document.getElementById('active-filters');
      if (!chipArea) return;

      const rInput = document.getElementById('hidden-region');
      const rVal = rInput ? rInput.value : '';
      
      const cInput = document.getElementById('hidden-category');
      const cVal = cInput ? cInput.value : '';

      let html = '';
      
      // 🌟 地域チップに解除イベントと✕マークを追加
      if (rVal && rVal !== 'unknown' && rVal !== '') {
        const rLabel = PREF_MAP[rVal] || rVal;
        html += '<span class="filter-chip" onclick="removeFilter(\\'region\\')">' + 
                '📍 ' + rLabel + '<span style="margin-left:6px; opacity:0.5;">✕</span></span>';
      }
      
      // 🌟 カテゴリチップに解除イベントと✕マークを追加
      if (cVal && cVal !== 'unknown' && cVal !== '') {
        html += '<span class="filter-chip" style="margin-left:4px;" onclick="removeFilter(\\'category\\')">' + 
                '✨ ' + cVal + '<span style="margin-left:6px; opacity:0.5;">✕</span></span>';
      }
      chipArea.innerHTML = html;
    }
  `}} />
);
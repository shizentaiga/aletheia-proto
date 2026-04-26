/**
 * 検索画面のフロントエンドロジック（JavaScript）を担当するコンポーネント
 * 📁 File Path: src/components/SearchLogic.tsx
 */

/** @jsxImportSource hono/jsx */
import { SEARCH_MASTER, UI_TEXT, PREFECTURE_MASTER } from '../lib/constants'

export const SearchLogic = () => (
  <script dangerouslySetInnerHTML={{ __html: `
    /**
     * 1. 定数の注入（サーバーサイドの定数をJSに引き継ぎ）
     */
    const MASTER_DATA = ${JSON.stringify(SEARCH_MASTER)};
    const UI_CONST = ${JSON.stringify(UI_TEXT)};
    const PREF_MAP = ${JSON.stringify(PREFECTURE_MASTER)};

    /**
     * 1-2. エリア統計データの取得とマージ
     * APIから「店舗がある市区町村」を取得し、メニューに(件数)を反映する
     */
    async function refreshAreaStats() {
      try {
        const res = await fetch('/api/area-stats');
        const json = await res.json();
        if (!json.success) return;

        // 都道府県ごとに市区町村をまとめる
        const statsByPref = json.data.reduce((acc, item) => {
          if (!acc[item.prefecture]) acc[item.prefecture] = [];
          acc[item.prefecture].push({ label: item.city, count: item.count });
          return acc;
        }, {});

        // 取得したデータを MASTER_DATA に流し込む
        Object.keys(statsByPref).forEach(pref => {
          if (!MASTER_DATA.region.options[pref]) {
            MASTER_DATA.region.options[pref] = { value: pref, sub: [] };
          }
          // 表示ラベルを「市区町村 (件数)」に整形
          MASTER_DATA.region.options[pref].sub = statsByPref[pref].map(s => s.label + ' (' + s.count + ')');
        });

        // データ反映後にエリア選択メニューを再描画
        const regionContainer = document.getElementById('drilldown-region');
        if (regionContainer) {
          renderDrilldownMenu('region', regionContainer);
        }

        if (window.syncUIFromData) window.syncUIFromData();
      } catch (e) {
        console.error('Failed to load dynamic area stats', e);
      }
    }

    refreshAreaStats();

    /**
     * IDやコードから日本語名を取得する（例: "tokyo" -> "東京都"）
     */
    function getLabelFromValue(mode, val) {
      if (!val || val === 'unknown') return UI_CONST.RESET_LABEL;
      const options = MASTER_DATA[mode].options;
      const foundKey = Object.keys(options).find(key => options[key].value === val);
      if (foundKey) return foundKey;
      if (mode === 'region' && PREF_MAP[val]) return PREF_MAP[val];
      return val;
    }

    /**
     * 2. ドリルダウンメニューの開閉制御
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
        renderDrilldownMenu(mode, container); // 開く瞬間に中身を生成
        container.style.display = 'block';
        container.style.maxHeight = '400px';
        container.style.overflowY = 'auto';
        
        setTimeout(() => {
          document.addEventListener('click', closeAllDrilldowns, { once: true });
        }, 0);
      }
    };

    /**
     * メニューのHTMLを生成する（地方 > 都道府県 > 市区町村の階層化）
     */
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
          const allLabel = key + UI_CONST.AREA_ALL_SUFFIX; // 例: 「関東全体」
          html += '<div class="sub-item" style="color: #4285F4; font-weight: bold;" onclick="finalizeSelection(\\'' + mode + '\\', \\'' + data.value + '\\', \\'' + key + '\\')">' + allLabel + '</div>';
          
          html += data.sub.map(function(item) {
            // 都道府県名（例: 東京都）の場合は、さらに市区町村へ掘り下げる設定
            const isPrefecture = mode === 'region' && (PREF_MAP[item] || /.*[都道府県道]$/.test(item));
            
            if (isPrefecture) {
              return '<div class="drilldown-item sub-item" style="padding-left: 2rem;" onclick="handlePrefectureClick(this, \\'' + item + '\\')">' + 
                     '<span>' + item + '</span><span class="arrow">▶</span></div>' +
                     '<div class="sub-menu" id="sub-' + item + '"></div>';
            }

            // 市区町村名（例: 新宿区 (5)）から検索用の値を取得
            const val = item.split(' (')[0];
            return '<div class="sub-item" onclick="finalizeSelection(\\'' + mode + '\\', \\'' + val + '\\', \\'' + item + '\\')">' + item + '</div>';
          }).join('');
          html += '</div>';
        }
        html += '</div>';
        return html;
      }).join('');
    }

    /**
     * 都道府県クリック時に、その下の市区町村リストを表示
     */
    window.handlePrefectureClick = function(el, prefName) {
      if (window.event) window.event.stopPropagation();
      const subMenu = el.nextElementSibling;
      const arrow = el.querySelector('.arrow');
      const isShowing = subMenu.classList.contains('show');
      
      // 他の開いている県メニューを閉じる
      el.parentElement.querySelectorAll('.sub-menu').forEach(m => { if(m !== subMenu) m.classList.remove('show') });
      el.parentElement.querySelectorAll('.arrow').forEach(a => { if(a !== arrow) a.classList.remove('open') });
      
      if (!isShowing) {
        const prefData = MASTER_DATA.region.options[prefName];
        if (prefData && prefData.sub && prefData.sub.length > 0) {
          // 市区町村リストのHTMLを注入
          subMenu.innerHTML = prefData.sub.map(function(cityWithCount) {
            const cityVal = cityWithCount.split(' (')[0];
            return '<div class="sub-item" style="padding-left: 3rem;" onclick="finalizeSelection(\\'region\\', \\'' + cityVal + '\\', \\'' + cityWithCount + '\\')">' + cityWithCount + '</div>';
          }).join('');
        } else {
          subMenu.innerHTML = '<div class="sub-item" style="padding-left: 3rem; color: #ccc;">店舗データなし</div>';
        }
        subMenu.classList.add('show');
        arrow.classList.add('open');
      } else {
        subMenu.classList.remove('show');
        arrow.classList.remove('open');
      }
    };

    /**
     * 通常の項目（サブメニューがないもの）がクリックされた時の処理
     */
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
     * 3. 検索条件の確定とHTMX実行
     */
    window.finalizeSelection = function(mode, val, label) {
      const hiddenInput = document.getElementById('hidden-' + mode);
      const labelElement = document.getElementById('current-' + mode + '-text');
      const form = document.getElementById('search-form');

      if (hiddenInput) hiddenInput.value = val;
      if (labelElement) {
        labelElement.innerText = label || getLabelFromValue(mode, val);
      }
      if (form) {
        form.setAttribute('data-current-' + mode, val);
      }
      
      updateFilterChips(); // チップ（📍東京 ✕）の更新
      closeAllDrilldowns();
      
      // HTMX経由でフォームを自動送信し、検索結果を更新
      if (window.htmx) {
        window.htmx.trigger(form, 'submit');
      }
    };

    /**
     * フィルター解除（「指定なし」に戻す）
     */
    window.removeFilter = function(mode) {
      window.finalizeSelection(mode, '', UI_CONST.RESET_LABEL);
    };

    /**
     * フォームの状態に合わせてUI（表示文字など）を同期
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
          label.innerText = getLabelFromValue(mode, val);
        }
      });
      updateFilterChips();
    };

    /**
     * 選択中の条件を「チップ」として表示
     */
    function updateFilterChips() {
      const chipArea = document.getElementById('active-filters');
      if (!chipArea) return;
      const rVal = document.getElementById('hidden-region')?.value || '';
      const cVal = document.getElementById('hidden-category')?.value || '';

      let html = '';
      if (rVal && rVal !== 'unknown' && rVal !== '') {
        const rLabel = getLabelFromValue('region', rVal);
        html += '<span class="filter-chip" onclick="removeFilter(\\'region\\')">📍 ' + rLabel + '<span style="margin-left:6px; opacity:0.5;">✕</span></span>';
      }
      if (cVal && cVal !== 'unknown' && cVal !== '') {
        const cLabel = getLabelFromValue('category', cVal);
        html += '<span class="filter-chip" style="margin-left:4px;" onclick="removeFilter(\\'category\\')">✨ ' + cLabel + '<span style="margin-left:6px; opacity:0.5;">✕</span></span>';
      }
      chipArea.innerHTML = html;
    }
  `}} />
);
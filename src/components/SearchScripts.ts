/**
 * 検索画面のフロントエンドロジック（JavaScript本体）
 * 📁 File Path: src/components/SearchScripts.ts
 * * 【主な役割】
 * 1. エリア・カテゴリの多階層ドリルダウンメニューの動的生成と制御。
 * 2. API（/api/area-stats）から取得した統計データを既存の階層構造へ動的に注入。
 * 3. 選択値の隠しフォームへの反映、フィルターチップ表示、およびHTMXによる自動検索。
 * 4. メニューの開閉管理、再帰的な階層展開、およびブラウザ状態とのUI同期。
 */

export const getSearchScripts = (masterData: any, uiText: any, prefMap: any) => `
  /**
   * 1. サーバーサイドから渡された定数の初期化
   */
  const MASTER_DATA = ${JSON.stringify(masterData)}; // エリア・カテゴリの階層データ
  const UI_CONST = ${JSON.stringify(uiText)};         // 表示用テキスト定数
  const PREF_MAP = ${JSON.stringify(prefMap)};       // 都道府県変換マップ

  /**
   * 1-2. エリア統計データ（店舗数など）の取得と既存構造へのマージ
   */
  async function refreshAreaStats() {
    try {
      // APIから動的な統計データを取得
      const res = await fetch('/api/area-stats');
      const json = await res.json();
      if (!json.success) return;

      // 都道府県ごとに市区町村データをグルーピング
      const statsByPref = json.data.reduce((acc, item) => {
        if (!acc[item.prefecture]) acc[item.prefecture] = [];
        acc[item.prefecture].push({ label: item.city, count: item.count });
        return acc;
      }, {});

      // 既存の地方階層の中に、取得した市区町村データを「第3階層」として注入
      Object.keys(statsByPref).forEach(pref => {
        for (const regionKey in MASTER_DATA.region.options) {
          const region = MASTER_DATA.region.options[regionKey];
          if (!region.sub || !Array.isArray(region.sub)) continue;

          // 地方配下の都道府県リストから該当する県を探す
          const prefIndex = region.sub.findIndex(item => 
            (typeof item === 'string' ? item : item.label) === pref
          );

          if (prefIndex !== -1) {
            // 都道府県を、市区町村の配列(sub)を持つリッチなオブジェクトに変換
            const updatedObj = {
              label: pref,
              value: pref,
              sub: statsByPref[pref].map(s => s.label + ' (' + s.count + ')')
            };
            region.sub[prefIndex] = updatedObj;
            // トップレベルからも参照できるようにして検索ロジックと同期
            MASTER_DATA.region.options[pref] = updatedObj;
          }
        }
      });

      // UIの再描画
      const regionContainer = document.getElementById('drilldown-region');
      if (regionContainer) renderDrilldownMenu('region', regionContainer);
      if (window.syncUIFromData) window.syncUIFromData();
    } catch (e) {
      console.error('Failed to load dynamic area stats', e);
    }
  }

  // 実行：統計データの動的反映を開始
  refreshAreaStats();

  /**
   * 値(value)から画面表示用のラベル名を取得する
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
   * すべてのドリルダウンメニューを閉じる
   */
  function closeAllDrilldowns() {
    document.querySelectorAll('[id^="drilldown-"]').forEach(el => el.style.display = 'none');
    document.removeEventListener('click', closeAllDrilldowns);
  }

  /**
   * メニューの開閉切り替え
   */
  window.toggleDrilldown = function(mode) {
    const e = window.event;
    if (e) e.stopPropagation(); // イベントのバブリングを防止
    
    const container = document.getElementById('drilldown-' + mode);
    const isAlreadyOpen = container.style.display === 'block';

    closeAllDrilldowns();
    if (isAlreadyOpen) return;

    renderDrilldownMenu(mode, container);
    container.style.display = 'block';
    container.style.maxHeight = '400px';
    container.style.overflowY = 'auto';
    
    // 他の場所をクリックした時に閉じるためのイベントリスナー
    setTimeout(() => {
      document.addEventListener('click', closeAllDrilldowns, { once: true });
    }, 0);
  };

  /**
   * メニューHTMLの生成（再帰的な階層構造に対応）
   */
  function renderDrilldownMenu(mode, container) {
    const modeData = MASTER_DATA[mode];
    container.onclick = (e) => e.stopPropagation();

    container.innerHTML = Object.keys(modeData.options)
      .filter(key => {
        if (mode !== 'region') return true;
        // 北海道は大エリアとしてそのまま表示し、他の県名はトップレベルから除外する
        if (key === '北海道') return true; 
        return !PREF_MAP[key] && !/.*[都道府県道]$/.test(key);
      })
      .map(key => {
        const data = modeData.options[key];
        const hasSub = !!data.sub;
        
        let html = '<div class="menu-item-group">';
        // 第1階層（地方・大カテゴリ）
        html += '<div class="drilldown-item" onclick="handleItemClick(this, \\'' + mode + '\\', \\'' + key + '\\')">';
        html += '<span>' + key + '</span>';
        if (hasSub) html += '<span class="arrow">▶</span>';
        html += '</div>';
        
        if (hasSub) {
          html += '<div class="sub-menu">';
          // 「すべての〜」という一括選択オプション
          const allLabel = key + UI_CONST.AREA_ALL_SUFFIX;
          html += '<div class="sub-item" style="color: #4285F4; font-weight: bold;" onclick="finalizeSelection(\\'' + mode + '\\', \\'' + data.value + '\\', \\'' + key + '\\')">' + allLabel + '</div>';
          
          // 第2階層（都道府県など）
          html += data.sub.map(item => {
            const label = typeof item === 'string' ? item : (item.label || item.value);
            const isPref = mode === 'region' && (PREF_MAP[label] || /.*[都道府県道]$/.test(label));
            
            if (isPref) {
              // さらに子階層を持つ都道府県の場合
              return '<div class="drilldown-item sub-item" style="padding-left: 2rem;" onclick="handlePrefectureClick(this, \\'' + label + '\\')">' + 
                     '<span>' + label + '</span><span class="arrow">▶</span></div>' +
                     '<div class="sub-menu" id="sub-' + label + '"></div>';
            }
            // 最終的な選択肢（市区町村や中カテゴリ）
            const val = label.split(' (')[0];
            return '<div class="sub-item" onclick="finalizeSelection(\\'' + mode + '\\', \\'' + val + '\\', \\'' + label + '\\')">' + label + '</div>';
          }).join('');
          html += '</div>';
        }
        html += '</div>';
        return html;
      }).join('');
  }

  /**
   * 都道府県をクリックした際に市区町村（第3階層）を展開する
   */
  window.handlePrefectureClick = function(el, prefName) {
    const e = window.event;
    if (e) e.stopPropagation();

    const subMenu = el.nextElementSibling;
    const arrow = el.querySelector('.arrow');
    const isShowing = subMenu.classList.contains('show');
    
    // 同階層の他の開いているメニューを閉じる
    el.parentElement.querySelectorAll('.sub-menu').forEach(m => { if(m !== subMenu) m.classList.remove('show') });
    el.parentElement.querySelectorAll('.arrow').forEach(a => { if(a !== arrow) a.classList.remove('open') });
    
    if (isShowing) {
      subMenu.classList.remove('show');
      arrow.classList.remove('open');
      return;
    }

    // 動的にマージされた市区町村データを表示
    const prefData = MASTER_DATA.region.options[prefName];
    if (prefData && prefData.sub && prefData.sub.length > 0) {
      const allInPrefLabel = prefName + UI_CONST.AREA_ALL_SUFFIX;
      let html = '<div class="sub-item" style="padding-left: 3rem; color: #4285F4; font-weight: bold;" ' +
                 'onclick="finalizeSelection(\\'region\\', \\'' + prefName + '\\', \\'' + allInPrefLabel + '\\')">' + 
                 allInPrefLabel + '</div>';
      
      html += prefData.sub.map(city => {
        const label = typeof city === 'string' ? city : city.label;
        const val = label.split(' (')[0];
        return '<div class="sub-item" style="padding-left: 3rem;" onclick="finalizeSelection(\\'region\\', \\'' + val + '\\', \\'' + label + '\\')">' + label + '</div>';
      }).join('');
      subMenu.innerHTML = html;
    } else {
      subMenu.innerHTML = '<div class="sub-item" style="padding-left: 3rem; color: #ccc;">店舗データなし</div>';
    }
    subMenu.classList.add('show');
    arrow.classList.add('open');
  };

  /**
   * メニュー項目のクリック処理（サブメニュー展開または確定）
   */
  window.handleItemClick = function(el, mode, key) {
    const e = window.event;
    if (e) e.stopPropagation();

    const data = MASTER_DATA[mode].options[key];
    if (!data.sub) {
      // 子要素がなければ即時確定
      finalizeSelection(mode, data.value, key);
      return;
    }

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
  };

  /**
   * 選択を確定し、隠しフォームへの反映とHTMX検索を実行する
   */
  window.finalizeSelection = function(mode, val, label) {
    const hiddenInput = document.getElementById('hidden-' + mode);
    const labelElement = document.getElementById('current-' + mode + '-text');
    const form = document.getElementById('search-form');

    if (hiddenInput) hiddenInput.value = val;
    if (labelElement) labelElement.innerText = label || getLabelFromValue(mode, val);
    if (form) form.setAttribute('data-current-' + mode, val);
    
    updateFilterChips();
    closeAllDrilldowns();
    
    // HTMXが有効な場合、自動的に検索を実行
    if (window.htmx) window.htmx.trigger(form, 'submit');
  };

  /**
   * フィルター解除
   */
  window.removeFilter = function(mode) {
    window.finalizeSelection(mode, '', UI_CONST.RESET_LABEL);
  };

  /**
   * データ（属性値）から現在のUIラベルや値を同期する
   */
  window.syncUIFromData = function() {
    const form = document.getElementById('search-form');
    if (!form) return;
    ['region', 'category'].forEach(mode => {
      const val = form.getAttribute('data-current-' + mode) || '';
      const input = document.getElementById('hidden-' + mode);
      const label = document.getElementById('current-' + mode + '-text');
      if (input) input.value = val;
      if (label) label.innerText = getLabelFromValue(mode, val);
    });
    updateFilterChips();
  };

  /**
   * 選択中のフィルタをチップ（タグ）形式で画面に表示する
   */
  function updateFilterChips() {
    const chipArea = document.getElementById('active-filters');
    if (!chipArea) return;
    const rVal = document.getElementById('hidden-region')?.value;
    const cVal = document.getElementById('hidden-category')?.value;

    let html = '';
    if (rVal && rVal !== 'unknown') {
      const rLabel = getLabelFromValue('region', rVal);
      html += '<span class="filter-chip" onclick="removeFilter(\\'region\\')">📍 ' + rLabel + '<span style="margin-left:6px; opacity:0.5;">✕</span></span>';
    }
    if (cVal && cVal !== 'unknown') {
      const cLabel = getLabelFromValue('category', cVal);
      html += '<span class="filter-chip" style="margin-left:4px;" onclick="removeFilter(\\'category\\')">✨ ' + cLabel + '<span style="margin-left:6px; opacity:0.5;">✕</span></span>';
    }
    chipArea.innerHTML = html;
  }
`;
/**
 * 検索画面のフロントエンドロジック（JavaScript）を担当するコンポーネント
 * 📁 File Path: src/components/SearchLogic.tsx
 */

/** @jsxImportSource hono/jsx */
import { SEARCH_MASTER, UI_TEXT, PREFECTURE_MASTER } from '../lib/constants'

export const SearchLogic = () => (
  <script dangerouslySetInnerHTML={{ __html: `
    /**
     * 1. サーバーサイド定数のクライアントサイドへの注入
     */
    const MASTER_DATA = ${JSON.stringify(SEARCH_MASTER)}; // エリア・カテゴリの構造データ
    const UI_CONST = ${JSON.stringify(UI_TEXT)};         // ボタン等の表示テキスト
    const PREF_MAP = ${JSON.stringify(PREFECTURE_MASTER)}; // 都道府県コード・名称変換マップ

    /**
     * 1-2. エリア統計データの取得と構造へのマージ
     * APIから届く「県ごとの市区町村数」を、MASTER_DATAの適切な階層に注入します。
     */
    async function refreshAreaStats() {
      try {
        const res = await fetch('/api/area-stats');
        const json = await res.json();
        if (!json.success) return;

        // 【STEP 1】APIデータを都道府県単位でグルーピング
        // 例: { "東京都": [{label: "新宿区", count: 10}, ...], ... }
        const statsByPref = json.data.reduce((acc, item) => {
          if (!acc[item.prefecture]) acc[item.prefecture] = [];
          acc[item.prefecture].push({ label: item.city, count: item.count });
          return acc;
        }, {});

        // 【STEP 2】既存の「地方 > 都道府県」構造に市区町村リストを注入
        Object.keys(statsByPref).forEach(pref => {
          for (const regionKey in MASTER_DATA.region.options) {
            const region = MASTER_DATA.region.options[regionKey];
            if (!region.sub || !Array.isArray(region.sub)) continue;

            // 地方内の sub 配列から、該当する都道府県（文字列）のインデックスを探す
            const prefIndex = region.sub.findIndex(item => 
              (typeof item === 'string' ? item : item.label) === pref
            );

            if (prefIndex !== -1) {
              // 文字列だった都道府県を、市区町村リスト(sub)を持つオブジェクトへアップグレード
              const updatedObj = {
                label: pref,
                value: pref,
                sub: statsByPref[pref].map(s => s.label + ' (' + s.count + ')')
              };
              // 地方階層のデータを更新
              region.sub[prefIndex] = updatedObj;
              // getLabelFromValue等が直接参照できるようトップレベルにも紐付け
              MASTER_DATA.region.options[pref] = updatedObj;
            }
          }
        });

        // データ更新後、現在開いているメニューがあれば再描画
        const regionContainer = document.getElementById('drilldown-region');
        if (regionContainer) renderDrilldownMenu('region', regionContainer);

        // URLパラメータ等とUI表示（東京都など）を同期
        if (window.syncUIFromData) window.syncUIFromData();
      } catch (e) {
        console.error('Failed to load dynamic area stats', e);
      }
    }

    // 初期実行：ページ読み込み時に統計データを取得
    refreshAreaStats();

    /**
     * 値（value）から表示用のラベルを取得するユーティリティ
     */
    function getLabelFromValue(mode, val) {
      if (!val || val === 'unknown') return UI_CONST.RESET_LABEL;
      const options = MASTER_DATA[mode].options;
      // options内から value が一致するキーを探す
      const foundKey = Object.keys(options).find(key => options[key].value === val);
      if (foundKey) return foundKey;
      // 見つからない場合は県名マップを確認
      if (mode === 'region' && PREF_MAP[val]) return PREF_MAP[val];
      return val;
    }

    /**
     * 2. ドリルダウンメニューの開閉管理
     */
    function closeAllDrilldowns() {
      document.querySelectorAll('[id^="drilldown-"]').forEach(el => el.style.display = 'none');
      document.removeEventListener('click', closeAllDrilldowns);
    }

    window.toggleDrilldown = function(mode) {
      const e = window.event;
      if (e) e.stopPropagation(); // バブリング防止
      
      const container = document.getElementById('drilldown-' + mode);
      const isAlreadyOpen = container.style.display === 'block';

      closeAllDrilldowns();
      if (isAlreadyOpen) return; // 既に開いていれば閉じるだけで終了

      renderDrilldownMenu(mode, container);
      container.style.display = 'block';
      container.style.maxHeight = '400px';
      container.style.overflowY = 'auto';
      
      // コンテナ外クリックで閉じる設定
      setTimeout(() => {
        document.addEventListener('click', closeAllDrilldowns, { once: true });
      }, 0);
    };

    /**
     * メニューのHTML生成（第1・第2階層）
     */
    function renderDrilldownMenu(mode, container) {
      const modeData = MASTER_DATA[mode];
      container.onclick = (e) => e.stopPropagation();

      container.innerHTML = Object.keys(modeData.options)
        .filter(key => {
          // 地方メニューの場合、都道府県名がトップレベルに表示されないようフィルタリング
          if (mode !== 'region') return true;
          // 🌟 【不具合修正】：北海道は「地方」として扱うため除外せず表示
          if (key === '北海道') return true; 
          return !PREF_MAP[key] && !/.*[都道府県道]$/.test(key);
        })
        .map(key => {
          const data = modeData.options[key];
          const hasSub = !!data.sub;
          
          let html = '<div class="menu-item-group">';
          // 第1階層（地方 / カテゴリ大区分）
          html += '<div class="drilldown-item" onclick="handleItemClick(this, \\'' + mode + '\\', \\'' + key + '\\')">';
          html += '<span>' + key + '</span>';
          if (hasSub) html += '<span class="arrow">▶</span>';
          html += '</div>';
          
          if (hasSub) {
            html += '<div class="sub-menu">';
            // 「すべて」を選択するオプション
            const allLabel = key + UI_CONST.AREA_ALL_SUFFIX;
            html += '<div class="sub-item" style="color: #4285F4; font-weight: bold;" onclick="finalizeSelection(\\'' + mode + '\\', \\'' + data.value + '\\', \\'' + key + '\\')">' + allLabel + '</div>';
            
            // 第2階層の生成（都道府県など）
            html += data.sub.map(item => {
              const label = typeof item === 'string' ? item : (item.label || item.value);
              const isPref = mode === 'region' && (PREF_MAP[label] || /.*[都道府県道]$/.test(label));
              
              if (isPref) {
                // 都道府県の場合はさらに第3階層（市区町村）へ続く
                return '<div class="drilldown-item sub-item" style="padding-left: 2rem;" onclick="handlePrefectureClick(this, \\'' + label + '\\')">' + 
                       '<span>' + label + '</span><span class="arrow">▶</span></div>' +
                       '<div class="sub-menu" id="sub-' + label + '"></div>';
              }
              // 子要素がない場合は最終選択肢として描画
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
     * 都道府県クリック時の処理（第3階層：市区町村の展開）
     */
    window.handlePrefectureClick = function(el, prefName) {
      const e = window.event;
      if (e) e.stopPropagation();

      const subMenu = el.nextElementSibling;
      const arrow = el.querySelector('.arrow');
      const isShowing = subMenu.classList.contains('show');
      
      // 同階層の他の県メニューを閉じる
      el.parentElement.querySelectorAll('.sub-menu').forEach(m => { if(m !== subMenu) m.classList.remove('show') });
      el.parentElement.querySelectorAll('.arrow').forEach(a => { if(a !== arrow) a.classList.remove('open') });
      
      if (isShowing) {
        subMenu.classList.remove('show');
        arrow.classList.remove('open');
        return;
      }

      // オブジェクト化された県データから市区町村リストを取得して描画
      const prefData = MASTER_DATA.region.options[prefName];
      if (prefData && prefData.sub && prefData.sub.length > 0) {
        const allInPrefLabel = prefName + UI_CONST.AREA_ALL_SUFFIX;
        let html = '<div class="sub-item" style="padding-left: 3rem; color: #4285F4; font-weight: bold;" ' +
                   'onclick="finalizeSelection(\\'region\\', \\'' + prefName + '\\', \\'' + allInPrefLabel + '\\')">' + 
                   allInPrefLabel + '</div>';
        
        html += prefData.sub.map(city => {
          const label = typeof city === 'string' ? city : city.label;
          const val = label.split(' (')[0]; // "新宿区 (10)" -> "新宿区"
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
     * 第1階層アイテム（地方等）クリック時の開閉制御
     */
    window.handleItemClick = function(el, mode, key) {
      const e = window.event;
      if (e) e.stopPropagation();

      const data = MASTER_DATA[mode].options[key];
      if (!data.sub) {
        // 子要素がない場合は即時確定
        finalizeSelection(mode, data.value, key);
        return;
      }

      const subMenu = el.nextElementSibling;
      const arrow = el.querySelector('.arrow');
      const isShowing = subMenu.classList.contains('show');
      
      // 全てのメニューを一旦閉じる
      document.querySelectorAll('.sub-menu').forEach(m => m.classList.remove('show'));
      document.querySelectorAll('.arrow').forEach(a => a.classList.remove('open'));

      if (!isShowing) {
        subMenu.classList.add('show');
        arrow.classList.add('open');
        // スマホ等で見やすいよう位置を調整
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    /**
     * 3. 検索条件の確定と反映
     */
    window.finalizeSelection = function(mode, val, label) {
      const hiddenInput = document.getElementById('hidden-' + mode);
      const labelElement = document.getElementById('current-' + mode + '-text');
      const form = document.getElementById('search-form');

      // 隠しフィールドへ値をセットし、画面上のラベルを更新
      if (hiddenInput) hiddenInput.value = val;
      if (labelElement) labelElement.innerText = label || getLabelFromValue(mode, val);
      if (form) form.setAttribute('data-current-' + mode, val);
      
      updateFilterChips(); // 選択チップ（📍タグ等）を更新
      closeAllDrilldowns(); // メニューを閉じる
      
      // HTMXによる非同期検索を実行
      if (window.htmx) window.htmx.trigger(form, 'submit');
    };

    /**
     * 選択解除処理
     */
    window.removeFilter = function(mode) {
      window.finalizeSelection(mode, '', UI_CONST.RESET_LABEL);
    };

    /**
     * フォームの状態とUI表示を同期させる
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
     * 選択中のフィルタをチップ形式で表示
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
  `}} />
);
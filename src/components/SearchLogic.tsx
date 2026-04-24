/**
 * 検索画面のフロントエンドロジック（JavaScript）を担当するコンポーネント
 * ドリルダウンメニューの制御、マスターデータの保持、HTMXのトリガー実行などを行う
 * 📁 File Path: src/components/SearchLogic.tsx
 */

/** @jsxImportSource hono/jsx */
export const SearchLogic = () => (
  <script dangerouslySetInnerHTML={{ __html: `
    /**
     * 1. 検索仕様（マスターデータ）
     */
    const MASTER_DATA = {
      'region': {
        'title': 'エリアを選択',
        'options': {
          '全国': { value: '', sub: null },
          '関東': { value: 'kanto', sub: ['東京都', '神奈川県', '千葉県', '埼玉県'] },
          '関西': { value: 'kansai', sub: ['大阪府', '京都府', '兵庫県'] }
        }
      },
      'category': {
        'title': '特徴を選択',
        'options': {
          '指定なし': { value: '', sub: null },
          'Wi-Fiあり': { value: 'wifi', sub: null },
          '電源あり': { value: 'power', sub: null },
          '禁煙': { value: 'no-smoking', sub: null }
        }
      }
    };

    /**
     * 2. すべてのドリルダウンを一括で閉じる（受動的クローズ）
     */
    function closeAllDrilldowns() {
      document.querySelectorAll('[id^="drilldown-"]').forEach(el => {
        el.style.display = 'none';
      });
      // 💡 閉じた後はドキュメントの監視を解除してリソースを解放
      document.removeEventListener('click', closeAllDrilldowns);
    }

    /**
     * 3. ドリルダウンメニューの表示切り替え（能動的開閉）
     */
    window.toggleDrilldown = function(mode) {
      // 💡 重要：トリガー（エリア/特徴）のクリックが document に伝わって
      // 即座に closeAllDrilldowns が発火するのを防ぐ
      if (window.event) window.event.stopPropagation();

      const container = document.getElementById('drilldown-' + mode);
      const isAlreadyOpen = container.style.display === 'block';

      // 一旦すべてを掃除してリセット
      closeAllDrilldowns();

      if (!isAlreadyOpen) {
        renderDrilldownMenu(mode, container);
        container.style.display = 'block';
        
        // 💡 どこをクリックしても閉じるように、一回限りの監視を開始
        // setTimeout(0) で現在のクリックイベント処理が終わった後にリスナーを登録
        setTimeout(() => {
          document.addEventListener('click', closeAllDrilldowns, { once: true });
        }, 0);
      }
    };

    /**
     * 4. メニュー項目の動的生成
     */
    function renderDrilldownMenu(mode, container) {
      const modeData = MASTER_DATA[mode];
      
      // 💡 パネル本体をクリックしても「外側クリック」と判定されないよう伝播をガード
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
          html += '<div class="sub-item" style="color: #4285F4; font-weight: bold;" onclick="finalizeSelection(\\'' + mode + '\\', \\'' + data.value + '\\', \\'' + key + '\\')">' + key + '全体</div>';
          html += data.sub.map(function(item) {
            return '<div class="sub-item" onclick="finalizeSelection(\\'' + mode + '\\', \\'' + item + '\\', \\'' + item + '\\')">' + item + '</div>';
          }).join('');
          html += '</div>';
        }
        html += '</div>';
        return html;
      }).join('');
    }

    /**
     * 5. 階層アイテムのクリックハンドリング
     */
    window.handleItemClick = function(el, mode, key) {
      // 💡 階層操作時のクリックが親に伝わって閉じないようにする
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
        }
      } else {
        finalizeSelection(mode, data.value, key);
      }
    };

    /**
     * 6. 選択の確定
     */
    window.finalizeSelection = function(mode, val, label) {
      const displayLabel = (val === '' || label === '全国') ? '指定なし' : label;
      
      document.getElementById('hidden-' + mode).value = val;
      document.getElementById('current-' + mode + '-text').innerText = displayLabel;
      
      updateFilterChips();
      
      // 💡 選択確定時に全メニューを掃除
      closeAllDrilldowns();
      
      const form = document.querySelector('form');
      if (window.htmx) {
        window.htmx.trigger(form, 'submit');
      }
    };

    /**
     * 7. チップ更新
     */
    function updateFilterChips() {
      const chipArea = document.getElementById('active-filters');
      const rVal = document.getElementById('hidden-region').value;
      const rLabel = document.getElementById('current-region-text').innerText;
      const cVal = document.getElementById('hidden-category').value;
      const cLabel = document.getElementById('current-category-text').innerText;

      let html = '';
      if (rVal && rVal !== '') html += '<span class="filter-chip">📍 ' + rLabel + '</span>';
      if (cVal && cVal !== '') html += '<span class="filter-chip" style="margin-left:4px;">✨ ' + cLabel + '</span>';
      chipArea.innerHTML = html;
    }
  `}} />
);
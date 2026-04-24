/** @jsxImportSource hono/jsx */

/**
 * 検索画面のフロントエンドロジック（JavaScript）を担当するコンポーネント
 * ドリルダウンメニューの制御、マスターデータの保持、HTMXのトリガー実行などを行う
 */
export const SearchLogic = () => (
  <script dangerouslySetInnerHTML={{ __html: `
    /**
     * 1. 検索仕様（マスターデータ）の定義
     * 将来的には lib/constants.ts から注入する形への変更を推奨
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
     * 2. ドリルダウンメニューの表示切り替え
     * @param {string} mode - 'region' または 'category'
     */
    window.toggleDrilldown = function(mode) {
      const container = document.getElementById('drilldown-' + mode);
      const otherMode = mode === 'region' ? 'category' : 'region';
      
      // 反対側のメニューが開いていれば閉じる
      document.getElementById('drilldown-' + otherMode).style.display = 'none';

      if (container.style.display === 'block') {
        container.style.display = 'none';
      } else {
        renderDrilldownMenu(mode, container);
        container.style.display = 'block';
      }
    };

    /**
     * 3. メニュー項目の動的生成
     */
    function renderDrilldownMenu(mode, container) {
      const modeData = MASTER_DATA[mode];
      
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
          // 親カテゴリ全体の選択肢（例：関東全体）
          html += '<div class="sub-item" style="color: #4285F4; font-weight: bold;" onclick="finalizeSelection(\\'' + mode + '\\', \\'' + data.value + '\\', \\'' + key + '\\')">' + key + '全体</div>';
          // 子カテゴリ（例：東京都、神奈川県...）
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
     * 4. 階層アイテムのクリックハンドリング
     */
    window.handleItemClick = function(el, mode, key) {
      const data = MASTER_DATA[mode].options[key];
      if (data.sub) {
        const subMenu = el.nextElementSibling;
        const arrow = el.querySelector('.arrow');
        const isShowing = subMenu.classList.contains('show');
        
        // 他の開いているサブメニューをリセット
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
     * 5. 選択の確定とHTMXリクエストの実行
     */
    window.finalizeSelection = function(mode, val, label) {
      const displayLabel = (val === '' || label === '全国') ? '指定なし' : label;
      
      // 隠しフィールドに値をセットし、画面上のテキストを更新
      document.getElementById('hidden-' + mode).value = val;
      document.getElementById('current-' + mode + '-text').innerText = displayLabel;
      
      updateFilterChips();
      
      // メニューを閉じる
      document.getElementById('drilldown-' + mode).style.display = 'none';
      
      // 検索フォームをHTMXで自動送信
      const form = document.querySelector('form');
      if (window.htmx) {
        window.htmx.trigger(form, 'submit');
      }
    };

    /**
     * 6. 選択済み条件のチップ（バッジ）表示更新
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
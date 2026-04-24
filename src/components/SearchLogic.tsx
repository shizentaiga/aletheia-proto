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
     * 47都道府県フルセット：地方区分によるドリルダウン形式
     */
    const MASTER_DATA = {
      'region': {
        'title': 'エリアを選択',
        'options': {
          '全国': { value: '', sub: null },
          '北海道': { value: 'hokkaido', sub: ['北海道'] },
          '東北': { value: 'tohoku', sub: ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'] },
          '関東': { value: 'kanto', sub: ['東京都', '神奈川県', '千葉県', '埼玉県', '茨城県', '栃木県', '群馬県'] },
          '中部': { value: 'chubu', sub: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'] },
          '近畿': { value: 'kinki', sub: ['大阪府', '京都府', '兵庫県', '奈良県', '滋賀県', '和歌山県', '三重県'] },
          '中国': { value: 'chugoku', sub: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'] },
          '四国': { value: 'shikoku', sub: ['徳島県', '香川県', '愛媛県', '高知県'] },
          '九州・沖縄': { value: 'kyushu', sub: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'] }
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
     * 2. すべてのドリルダウンを一括で閉じる
     */
    function closeAllDrilldowns() {
      document.querySelectorAll('[id^="drilldown-"]').forEach(el => {
        el.style.display = 'none';
      });
      document.removeEventListener('click', closeAllDrilldowns);
    }

    /**
     * 3. ドリルダウンメニューの表示切り替え
     */
    window.toggleDrilldown = function(mode) {
      if (window.event) window.event.stopPropagation();

      const container = document.getElementById('drilldown-' + mode);
      const isAlreadyOpen = container.style.display === 'block';

      closeAllDrilldowns();

      if (!isAlreadyOpen) {
        renderDrilldownMenu(mode, container);
        container.style.display = 'block';
        
        // 💡 47都道府県対応：パネルが長い場合に備え、最大高さとスクロールを動的に保証
        container.style.maxHeight = '400px';
        container.style.overflowY = 'auto';
        
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
          // 💡 「○○地方全体」の選択肢
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
          
          // 💡 サブメニュー展開時にスクロール位置を調整（見切れ防止）
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
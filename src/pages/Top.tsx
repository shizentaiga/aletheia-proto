/**
 * =============================================================================
 * 【 ALETHEIA - メインポータル・ビュー / Top.tsx 】
 * =============================================================================
 * 役割：実データ（店名・住所）に基づき、ノイズを排したリストを構築します。
 * 📁 File Path: src/pages/Top.tsx
 * =============================================================================
 */


//  📁 File Path: src/pages/Top.tsx
// 1. 外部依存・基本ライブラリ (Core dependencies)
/** @jsxImportSource hono/jsx */
import { STYLES, SPACE } from '../styles/theme'
import type { Cafe } from '../db/queries'

// 2. サブ・コンポーネント
import { DebugMonitor } from '../components/DebugMonitor'
import { HeaderArea } from '../components/HeaderArea'
import { SearchSection } from '../components/SearchSection'
import { CafeCard } from '../components/CafeCard'

// 3. ページ専用設定
export const PAGE_DESIGN = {
  SECTION_TITLE: { FONT_SIZE: '0.9rem', COLOR: '#111', WEIGHT: 700 },
  COUNTER: { COLOR: '#999', WEIGHT: 400 },
  FOOTER: { FONT_SIZE: '0.75rem', COLOR: '#ccc', LETTER_SPACING: '1px' },
  MORE_BTN: {
    PADDING: `${SPACE.SM} ${SPACE.MD}`,
    COLOR: '#666',
    BG: '#f9f9f9',
    BORDER: '1px solid #eee',
    RADIUS: '4px',
    FONT_SIZE: '0.85rem'
  }
} as const;

const UI_COPY = {
  LIST_TITLE: '近くのカフェ',
  MORE_LABEL: 'さらに読み込む',
  COPYRIGHT: '© 2026 ALETHEIA PROJECT'
} as const;

// 4. CafeList
interface CafeListProps {
  cafes: Cafe[];
  totalCount: number;
  offset?: number;
  keyword?: string;
  region?: string;
  category?: string; // 型追加済み
}

export const CafeList = ({ cafes, totalCount, offset = 0, keyword = '', region = '', category = '' }: CafeListProps) => {
  const nextOffset = offset + cafes.length;
  const hasMore = nextOffset < totalCount;
  const q = keyword || '';
  const r = region || '';
  const c = category || '';

  return (
    <div className="cafe-list-block">
      {cafes.map((cafe, index) => (
        <CafeCard 
          key={cafe.service_id || `${offset}-${index}`}
          title={cafe.title}
          address={cafe.address}
        />
      ))}

      <div className="more-button-wrapper" style={{ textAlign: 'center', marginTop: SPACE.MD }}>
        {hasMore ? (
          <button
            style={{ ...PAGE_DESIGN.MORE_BTN, cursor: 'pointer', width: '100%' }}
            hx-get={`/search?offset=${nextOffset}&keyword=${encodeURIComponent(q)}&region=${encodeURIComponent(r)}&category=${encodeURIComponent(c)}`}
            hx-target="closest .more-button-wrapper"
            hx-swap="outerHTML"
          >
            {UI_COPY.MORE_LABEL}
          </button>
        ) : (
          totalCount > 0 && (
            <p style={{ fontSize: '0.8rem', color: '#ccc', margin: SPACE.MD }}>
              すべてのデータを読み込みました
            </p>
          )
        )}
      </div>
    </div>
  )
}

// 5. メイン・ビュー
interface LocationInfo { region: string; city: string; colo: string; }
interface TopProps {
  user?: any; env?: any; cafes?: Cafe[]; totalCount?: number;
  location?: LocationInfo; keyword?: string; region?: string;
  category?: string;
}

export const Top = ({ user, env, cafes = [], totalCount = 0, location, keyword = '', region = '', category = '' }: TopProps) => {
  const isDev = env?.NODE_ENV === 'development';
  
  return (
    <div style={STYLES.LAYOUT.WRAPPER}>
      <style>{`
        /* インライン・ドリルダウン用スタイル */
        .drilldown-item { 
          padding: ${SPACE.MD}; 
          border-bottom: 1px solid #f5f5f5; 
          cursor: pointer; 
          display: flex; 
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }
        .drilldown-item:active { background: #f9f9f9; }
        
        .sub-menu { 
          display: none; 
          background: #fafafa; 
        }
        .sub-menu.show { display: block; }
        
        .sub-item { 
          padding: ${SPACE.SM} ${SPACE.MD} ${SPACE.SM} ${SPACE.LG}; 
          border-bottom: 1px dotted #eee;
          font-size: 0.85rem;
          color: #555;
        }
        .sub-item:active { background: #f0f0f0; }

        .arrow { font-size: 0.6rem; color: #ccc; transition: transform 0.2s; }
        .arrow.open { transform: rotate(90deg); }

        .filter-chip { 
          display: inline-flex; align-items: center; background: #e8f0fe; color: #4285F4;
          padding: 4px 12px; borderRadius: 999px; fontSize: 0.75rem; fontWeight: bold;
        }
      `}</style>

      <div style={STYLES.LAYOUT.OUTER_CONTAINER}>
        {isDev && (
          <div style={{ position: 'sticky', top: SPACE.MD, alignSelf: 'start', zIndex: 1000 }}>
            <DebugMonitor user={user} env={env} location={location} query={{ keyword, region, category }} />
          </div>
        )}

        <div style={STYLES.LAYOUT.MAIN}>
          <HeaderArea user={user} />
          <SearchSection />

          <main style={STYLES.LAYOUT.LIST} id="cafe-list-container">
            <div id="search-results-area">
              <div id="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE.SM }}>
                <h2 style={{ fontSize: PAGE_DESIGN.SECTION_TITLE.FONT_SIZE, color: PAGE_DESIGN.SECTION_TITLE.COLOR, fontWeight: PAGE_DESIGN.SECTION_TITLE.WEIGHT }}>
                  {UI_COPY.LIST_TITLE} 
                  <span style={{ color: PAGE_DESIGN.COUNTER.COLOR, fontWeight: PAGE_DESIGN.COUNTER.WEIGHT, marginLeft: SPACE.XS }}>
                    全 {totalCount} 件
                  </span>
                </h2>
              </div>
              <div id="cafe-cards-root">
                <CafeList cafes={cafes} totalCount={totalCount} keyword={keyword} region={region} category={category} offset={0} />
              </div>
            </div>
          </main>
          
          <footer style={{ textAlign: 'center', padding: SPACE.LG, marginTop: SPACE.XL }}>
            <p style={PAGE_DESIGN.FOOTER}>{UI_COPY.COPYRIGHT}</p>
          </footer>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
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

        // インライン表示用に切り替え
        window.toggleDrilldown = function(mode) {
          const container = document.getElementById('drilldown-' + mode);
          const otherMode = mode === 'region' ? 'category' : 'region';
          
          // もう一方を閉じる
          document.getElementById('drilldown-' + otherMode).style.display = 'none';

          if (container.style.display === 'block') {
            container.style.display = 'none';
          } else {
            renderDrilldownMenu(mode, container);
            container.style.display = 'block';
          }
        };

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
              // 「全体」選択肢
              html += '<div class="sub-item" style="color: #4285F4; font-weight: bold;" onclick="finalizeSelection(\\'' + mode + '\\', \\'' + data.value + '\\', \\'' + key + '\\')">' + key + '全体</div>';
              // 子要素
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
          const data = MASTER_DATA[mode].options[key];
          if (data.sub) {
            const subMenu = el.nextElementSibling;
            const arrow = el.querySelector('.arrow');
            const isShowing = subMenu.classList.contains('show');
            
            // 他のサブメニューを閉じる
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

        window.finalizeSelection = function(mode, val, label) {
          const displayLabel = (val === '' || label === '全国') ? '指定なし' : label;
          
          // 値をセット
          document.getElementById('hidden-' + mode).value = val;
          document.getElementById('current-' + mode + '-text').innerText = displayLabel;
          
          updateFilterChips();
          
          // メニューを閉じる
          document.getElementById('drilldown-' + mode).style.display = 'none';
          
          // フォーム送信（HTMX）
          const form = document.querySelector('form');
          if (window.htmx) {
            window.htmx.trigger(form, 'submit');
          }
        };

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
    </div>
  );
}
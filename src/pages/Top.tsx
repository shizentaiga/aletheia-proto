/**
 * =============================================================================
 * 【 ALETHEIA - メインポータル・ビュー / Top.tsx 】
 * =============================================================================
 * 役割：実データ（店名・住所）に基づき、ノイズを排したリストを構築します。
 * 📁 File Path: src/pages/Top.tsx
 * =============================================================================
 */

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
}

export const CafeList = ({ cafes, totalCount, offset = 0, keyword = '', region = '' }: CafeListProps) => {
  const nextOffset = offset + cafes.length;
  const hasMore = nextOffset < totalCount;
  const q = keyword || '';
  const r = region || '';

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
            hx-get={`/search?offset=${nextOffset}&keyword=${encodeURIComponent(q)}&region=${encodeURIComponent(r)}`}
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
}

export const Top = ({ user, env, cafes = [], totalCount = 0, location, keyword = '', region = '' }: TopProps) => {
  const isDev = env?.NODE_ENV === 'development';
  
  return (
    <div style={STYLES.LAYOUT.WRAPPER}>
      {/* 💡 ボトムシートのアニメーション制御用スタイル */}
      <style>{`
        #search-overlay {
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        #search-overlay.show {
          opacity: 1;
          visibility: visible;
        }
        #bottom-sheet {
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1);
        }
        #search-overlay.show #bottom-sheet {
          transform: translateY(0);
        }
        .sheet-item {
          padding: ${SPACE.MD};
          border-bottom: 1px solid #eee;
          cursor: pointer;
        }
        .sheet-item:active {
          background: #f0f0f0;
        }
      `}</style>

      <div style={STYLES.LAYOUT.OUTER_CONTAINER}>
        {isDev && (
          <div style={{ position: 'sticky', top: SPACE.MD, alignSelf: 'start', zIndex: 1000 }}>
            <DebugMonitor user={user} env={env} location={location} query={{ keyword, region }} />
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
                <CafeList cafes={cafes} totalCount={totalCount} keyword={keyword} region={region} offset={0} />
              </div>
            </div>
          </main>
          
          <footer style={{ textAlign: 'center', padding: SPACE.LG, marginTop: SPACE.XL }}>
            <p style={PAGE_DESIGN.FOOTER}>{UI_COPY.COPYRIGHT}</p>
          </footer>
        </div>
      </div>

      {/* 💡 ボトムシート本体 */}
      <div id="search-overlay" style={STYLES.LAYOUT.OVERLAY} onclick="this.classList.remove('show')">
        <div id="bottom-sheet" style={STYLES.LAYOUT.BOTTOM_SHEET} onclick="event.stopPropagation()">
          {/* シート内ヘッダー */}
          <div style={{ padding: SPACE.MD, textAlign: 'center', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
            条件を選択
          </div>
          
          {/* リストエリア（スクロール可能） */}
          <div style={{ overflowY: 'auto', flex: 1, paddingBottom: SPACE.XL }}>
            <div className="sheet-item" onclick="selectRegion('', '指定なし')">指定なし（全国）</div>
            <div className="sheet-item" onclick="selectRegion('tokyo', '東京')">東京</div>
            <div className="sheet-item" onclick="selectRegion('kanto', '関東')">関東</div>
          </div>

          {/* キャンセルボタン */}
          <div style={{ padding: SPACE.MD }}>
            <button 
              onclick="document.getElementById('search-overlay').classList.remove('show')"
              style={{ width: '100%', padding: SPACE.MD, borderRadius: '8px', border: 'none', background: '#eee' }}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>

      {/* 値セット用のインラインスクリプト */}
      <script dangerouslySetInnerHTML={{ __html: `
        function selectRegion(val, label) {
          document.getElementById('hidden-region').value = val;
          document.getElementById('current-area-text').innerText = label;
          document.getElementById('search-overlay').classList.remove('show');
        }
      `}} />
    </div>
  );
}
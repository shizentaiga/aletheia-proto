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
import { getPrefectureName } from '../lib/constants' // 🌟 追加

// サブ・コンポーネント
import { DebugMonitor } from '../components/DebugMonitor'
import { HeaderArea } from '../components/HeaderArea'
import { SearchSection } from '../components/SearchSection'
import { CafeCard } from '../components/CafeCard'

// 💡 新規分離したコンポーネントのインポート
import { SearchHeader } from '../components/SearchHeader'
import { SearchLogic } from '../components/SearchLogic'

// ページ専用設定
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

// CafeList
interface CafeListProps {
  cafes: Cafe[];
  totalCount: number;
  offset?: number;
  keyword?: string;
  region?: string;
  category?: string;
  detectedRegion?: string; // 🌟 現在地のヒント
}

export const CafeList = ({ 
  cafes, totalCount, offset = 0, keyword = '', region = '', category = '', detectedRegion = '' 
}: CafeListProps) => {
  const nextOffset = offset + cafes.length;
  const hasMore = nextOffset < totalCount;
  
  // URLエンコードの共通化
  const params = new URLSearchParams({
    offset: nextOffset.toString(),
    keyword: keyword || '',
    region: region || '',
    category: category || '',
    detectedRegion: detectedRegion || '' // 追加読み込み時もソート順を維持するために継承
  }).toString();

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
            hx-get={`/search?${params}`}
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

// メイン・ビュー
interface LocationInfo { region: string; city: string; colo: string; }
interface TopProps {
  user?: any; env?: any; cafes?: Cafe[]; totalCount?: number;
  location?: LocationInfo; keyword?: string; region?: string;
  category?: string;
}

export const Top = ({ user, env, cafes = [], totalCount = 0, location, keyword = '', region = '', category = '' }: TopProps) => {
  const isDev = env?.NODE_ENV === 'development';

  // 🌟 Cloudflareからの英語名(Tokyo等)を日本語名(東京都)に変換
  const jpnRegion = getPrefectureName(location?.region);
  
  return (
    <div style={STYLES.LAYOUT.WRAPPER}>
      {/* 💡 CSS定義のみを保持 */}
      <style>{`
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
              <SearchHeader totalCount={totalCount} />
              
              <div id="cafe-cards-root">
                <CafeList 
                  cafes={cafes} 
                  totalCount={totalCount} 
                  keyword={keyword} 
                  region={region} 
                  category={category} 
                  detectedRegion={location?.region}
                  offset={0} 
                />
              </div>
            </div>
          </main>
          
          <footer style={{ textAlign: 'center', padding: SPACE.LG, marginTop: SPACE.XL }}>
            <p style={PAGE_DESIGN.FOOTER}>{UI_COPY.COPYRIGHT}</p>
          </footer>
        </div>
      </div>

      <SearchLogic />

      {/* 🌟 修正：日本語化された都道府県名(jpnRegion)を初期化関数に渡す */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', () => {
          if (window.initSearchContext) {
            window.initSearchContext('${jpnRegion}');
          }
        });
      `}} />
    </div>
  );
}
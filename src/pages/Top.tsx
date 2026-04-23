/**
 * =============================================================================
 * 【 ALETHEIA - メインポータル・ビュー / Top.tsx 】
 * =============================================================================
 * 役割：実データ（店名・住所）に基づき、ノイズを排したリストを構築します。
 * 📁 File Path: src/pages/Top.tsx
 * =============================================================================
 */

//** @jsxImportSource hono/jsx */

// -----------------------------------------------------------------------------
// 1. 外部依存・デザインシステム
// -----------------------------------------------------------------------------
import { STYLES, SPACE } from '../styles/theme'
import type { Cafe } from '../db/queries'
import { DISPLAY_LIMIT } from '../db/queries'

// -----------------------------------------------------------------------------
// 2. サブ・コンポーネント
// -----------------------------------------------------------------------------
import { DebugMonitor } from '../components/DebugMonitor'
import { HeaderArea } from '../components/HeaderArea'
import { SearchSection } from '../components/SearchSection'
import { CafeCard } from '../components/CafeCard'

// -----------------------------------------------------------------------------
// 3. ページ専用設定 (Page-Specific Config)
// -----------------------------------------------------------------------------
const PAGE_DESIGN = {
  SECTION_TITLE: { 
    FONT_SIZE: '0.9rem', 
    COLOR: '#111', 
    WEIGHT: 700 
  },
  COUNTER: { 
    COLOR: '#999', 
    WEIGHT: 400 
  },
  FOOTER: {
    FONT_SIZE: '0.75rem',
    COLOR: '#ccc',
    LETTER_SPACING: '1px'
  },
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
  RESULTS_LABEL: '件を表示中', 
  TOTAL_PREFIX: '/',
  MORE_LABEL: 'さらに読み込む',
  COPYRIGHT: '© 2026 ALETHEIA PROJECT'
} as const;

// -----------------------------------------------------------------------------
// 4. 増築型リストコンポーネント (CafeList)
// -----------------------------------------------------------------------------
interface CafeListProps {
  cafes: Cafe[];
  totalCount: number;
  offset?: number;
  keyword?: string;
  region?: string;
}

export const CafeList = ({ cafes, totalCount, offset = 0, keyword = '', region = '' }: CafeListProps) => {
  // test06方式：実際に取得できた件数を足して次の開始位置(nextOffset)を算出
  const nextOffset = offset + cafes.length;
  // 全件数に達していない場合のみ「もっと見る」を表示
  const hasMore = nextOffset < totalCount;

  // URLパラメータとして安全に渡すための正規化
  const q = keyword || '';
  const r = region || '';

  return (
    <div className="cafe-list-block">
      {/* 1. カード本体のレンダリング */}
      {cafes.map((cafe, index) => (
        <CafeCard 
          key={cafe.service_id || `${offset}-${index}`}
          title={cafe.title}
          address={cafe.address}
        />
      ))}

      {/* 2. 次の塊を呼び出すボタンエリア */}
      <div className="more-button-wrapper" style={{ textAlign: 'center', marginTop: SPACE.MD }}>
        {hasMore ? (
          <button
            style={{ ...PAGE_DESIGN.MORE_BTN, cursor: 'pointer', width: '100%' }}
            // サーバー(index.tsx)に定義した /search を叩く
            hx-get={`/search?offset=${nextOffset}&keyword=${encodeURIComponent(q)}&region=${encodeURIComponent(r)}`}
            hx-target="closest .more-button-wrapper"
            hx-swap="outerHTML"
            hx-indicator="#loading-spinner"
          >
            {UI_COPY.MORE_LABEL}
          </button>
        ) : (
          /* データが0件でない、かつ最後に達した時のみ表示 */
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

// -----------------------------------------------------------------------------
// 5. メイン・ビュー
// -----------------------------------------------------------------------------
interface LocationInfo {
  region: string;
  city: string;
  colo: string;
}

interface TopProps {
  user?: any;
  env?: any;
  cafes?: Cafe[];
  totalCount?: number;
  location?: LocationInfo;
  keyword?: string;
  region?: string;
}

export const Top = ({ user, env, cafes = [], totalCount = 0, location, keyword = '', region = '' }: TopProps) => {
  const isDev = env?.NODE_ENV === 'development';
  
  return (
    <div style={STYLES.LAYOUT.WRAPPER}>
      <div style={STYLES.LAYOUT.OUTER_CONTAINER}>
        
        {isDev && (
          <div style={{ 
            position: 'sticky', 
            top: SPACE.MD,
            alignSelf: 'start',
            zIndex: 1000
          }}>
            <DebugMonitor 
              user={user} 
              env={env} 
              location={location} 
              query={{ keyword, region }} 
            />
          </div>
        )}

        <div style={STYLES.LAYOUT.MAIN}>
          <HeaderArea user={user} />
          <SearchSection />

          <main style={STYLES.LAYOUT.LIST} id="cafe-list-container">
            <div id="list-header" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: SPACE.SM 
            }}>
              <h2 style={{ 
                fontSize: PAGE_DESIGN.SECTION_TITLE.FONT_SIZE, 
                color: PAGE_DESIGN.SECTION_TITLE.COLOR, 
                fontWeight: PAGE_DESIGN.SECTION_TITLE.WEIGHT 
              }}>
                {UI_COPY.LIST_TITLE} 
                <span style={{ 
                  color: PAGE_DESIGN.COUNTER.COLOR, 
                  fontWeight: PAGE_DESIGN.COUNTER.WEIGHT, 
                  marginLeft: SPACE.XS 
                }}>
                  全 {totalCount} 件
                </span>
              </h2>
            </div>

            <div id="cafe-cards-root">
              <CafeList 
                cafes={cafes} 
                totalCount={totalCount} 
                keyword={keyword} 
                region={region} 
                offset={0}
              />
            </div>
          </main>
          
          <footer style={{ textAlign: 'center', padding: SPACE.LG, marginTop: SPACE.XL }}>
            <p style={PAGE_DESIGN.FOOTER}>
              {UI_COPY.COPYRIGHT}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
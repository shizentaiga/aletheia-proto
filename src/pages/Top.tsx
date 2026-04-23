/**
 * =============================================================================
 * 【 ALETHEIA - メインポータル・ビュー / Top.tsx 】
 * =============================================================================
 * 役割：実データ（店名・住所）に基づき、ノイズを排したリストを構築します。
 * 📁 File Path: src/pages/Top.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */

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
// 4. 部分更新用コンポーネント (CafeList)
// -----------------------------------------------------------------------------

interface CafeListProps {
  cafes: Cafe[];
  totalCount: number;
  offset?: number;
  keyword?: string;
  region?: string; // 地域指定も引き継げるように追加
}

export const CafeList = ({ cafes, totalCount, offset = 0, keyword, region }: CafeListProps) => {
  const currentDisplayCount = offset + cafes.length;
  const hasMore = currentDisplayCount < totalCount;

  return (
    <>
      {/* OOB (Out of Band) Swap: ヘッダーの件数表示を更新 */}
      <div id="list-header" hx-swap-oob="true" style={{ 
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
            {currentDisplayCount}{UI_COPY.TOTAL_PREFIX}{totalCount}{UI_COPY.RESULTS_LABEL}
          </span>
        </h2>
      </div>

      {/* 新しいカードのリスト (hx-select でここだけが抽出される) */}
      <div id="cafe-cards">
        {cafes.map((cafe, index) => (
          <CafeCard 
            key={cafe.service_id || `${offset}-${index}`}
            title={cafe.title}
            address={cafe.address}
          />
        ))}
      </div>

      {/* OOB Swap: ボタンコンテナ自体を新しい offset 値で書き換える。
          これにより、ボタンの中にボタンが入る不具合を防止し、常に最新のパラメータを保持できる。
      */}
      <div id="more-button-container" hx-swap-oob="true" style={{ textAlign: 'center', marginTop: SPACE.MD }}>
        {hasMore ? (
          <button
            style={{
              ...PAGE_DESIGN.MORE_BTN,
              cursor: 'pointer',
              width: '100%'
            }}
            hx-get="/search"
            hx-vals={JSON.stringify({ 
              offset: offset + DISPLAY_LIMIT, 
              keyword: keyword || '',
              region: region || ''
            })}
            hx-target="#cafe-cards"
            hx-swap="beforeend"
            hx-indicator="#loading-spinner"
            hx-select="#cafe-cards > *" 
          >
            {UI_COPY.MORE_LABEL}
          </button>
        ) : (
          /* 次がない場合は空にしてボタンを消去 */
          <div id="more-button-container"></div>
        )}
      </div>
    </>
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
  keyword?: string; // 追加
  region?: string;  // 追加
}

export const Top = ({ user, env, cafes = [], totalCount = 0, location, keyword, region }: TopProps) => {
  const isDev = env?.NODE_ENV === 'development';
  
  return (
    <div style={STYLES.LAYOUT.WRAPPER}>
      <div style={STYLES.LAYOUT.OUTER_CONTAINER}>
        {isDev && <DebugMonitor user={user} env={env} location={location} />}

        <div style={STYLES.LAYOUT.MAIN}>
          <HeaderArea user={user} />
          <SearchSection />

          <main style={STYLES.LAYOUT.LIST} id="cafe-list-container">
            {/* keyword と region を CafeList に渡して初期ボタンのパラメータを確定させる */}
            <CafeList 
              cafes={cafes} 
              totalCount={totalCount} 
              keyword={keyword} 
              region={region} 
            />
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
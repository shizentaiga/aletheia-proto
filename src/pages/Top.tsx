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
  region?: string;
}

/**
 * 修正ポイント: 
 * 外枠の div#cafe-cards を含めず、カードの配列のみを返します。
 * これにより hx-select="#cafe-cards > *" で子要素だけを綺麗に継ぎ足せます。
 */
export const CafeList = ({ cafes, totalCount, offset = 0, keyword, region }: CafeListProps) => {
  const currentDisplayCount = offset + cafes.length;
  const hasMore = currentDisplayCount < totalCount;

  return (
    <>
      {/* OOB Swap: ヘッダーの件数表示を更新 */}
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

      {/* カード本体のレンダリング
         注: ここで ID を持った親 div で囲まず、フラグメントで展開します。
      */}
      {cafes.map((cafe, index) => (
        <CafeCard 
          key={cafe.service_id || `${offset}-${index}`}
          title={cafe.title}
          address={cafe.address}
        />
      ))}

      {/* OOB Swap: ボタンコンテナ自体を新しい offset 値で書き換える */}
      <div id="more-button-container" hx-swap-oob="true" style={{ textAlign: 'center', marginTop: SPACE.MD }}>
        {hasMore ? (
          <button
            style={{ ...PAGE_DESIGN.MORE_BTN, cursor: 'pointer', width: '100%' }}
            // 👈 修正：hx-vals を廃止し、hx-get の URL に直接パラメータを埋め込む
            hx-get={`/search?offset=${offset + DISPLAY_LIMIT}&keyword=${encodeURIComponent(keyword || '')}&region=${encodeURIComponent(region || '')}`}
            hx-target="#cafe-cards"
            hx-swap="beforeend"
            hx-indicator="#loading-spinner"
            // 👈 修正：hx-select を "a" からクラス名に変更
            hx-select=".cafe-card-link"
          >
            {UI_COPY.MORE_LABEL}
          </button>
        ) : (
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
  keyword?: string;
  region?: string;
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
            {/* ベースとなるコンテナをここに固定。
              CafeList はこの中の「中身」だけを管理する。
            */}
            <div id="list-header"></div>
            <div id="cafe-cards">
              <CafeList 
                cafes={cafes} 
                totalCount={totalCount} 
                keyword={keyword} 
                region={region} 
              />
            </div>
            <div id="more-button-container"></div>
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
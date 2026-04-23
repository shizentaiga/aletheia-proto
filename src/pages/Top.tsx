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
  MORE_LABEL: 'もっと見る（後日、対応予定）',   // 後日対応に変更
  COPYRIGHT: '© 2026 ALETHEIA PROJECT'
} as const;

// -----------------------------------------------------------------------------
// 4. 部分更新用コンポーネント (CafeList)
//    HTMXが検索時や「もっと見る」時に、この中身だけを返却するために使用
// -----------------------------------------------------------------------------

interface CafeListProps {
  cafes: Cafe[];
  totalCount: number;
  offset?: number;
  keyword?: string; // 「もっと見る」の継続的なクエリ用
}

export const CafeList = ({ cafes, totalCount, offset = 0, keyword }: CafeListProps) => {
  const currentDisplayCount = offset + cafes.length;
  const hasMore = currentDisplayCount < totalCount;

  return (
    <>
      {/* リストヘッダー：hx-swap-oob="true" により、検索時も追加読み込み時も件数表示を自動更新 */}
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

      {/* カフェカード一覧：hx-target の対象 */}
      <div id="cafe-cards">
        {cafes.map((cafe, index) => (
          <CafeCard 
            key={cafe.service_id || `${offset}-${index}`}
            title={cafe.title}
            address={cafe.address}
          />
        ))}
      </div>

      {/* 「もっと見る」ボタンコンテナ：
          hx-swap="outerHTML" でコンテナごと新しいボタン（または空）に差し替えます
      */}
      <div id="more-button-container" style={{ textAlign: 'center', marginTop: SPACE.MD }}>
        {hasMore && (
          <button
            style={{
              ...PAGE_DESIGN.MORE_BTN,
              cursor: 'pointer',
              width: '100%'
            }}
            hx-get="./search"
            hx-vals={`{"offset": ${offset + DISPLAY_LIMIT}, "keyword": "${keyword || ''}"}`}
            hx-target="#cafe-cards"
            hx-swap="beforeend"
            hx-indicator="#loading-spinner"
            hx-select="#cafe-cards > *, #more-button-container"
          >
            {UI_COPY.MORE_LABEL}
          </button>
        )}
      </div>
    </>
  )
}

// -----------------------------------------------------------------------------
// 5. メイン・ビュー
// -----------------------------------------------------------------------------

interface TopProps {
  user?: any;
  env?: any;
  cafes?: Cafe[];
  totalCount?: number;
}

export const Top = ({ user, env, cafes = [], totalCount = 0 }: TopProps) => {
  const isDev = env?.NODE_ENV === 'development';

  return (
    <div style={STYLES.LAYOUT.WRAPPER}>
      <div style={STYLES.LAYOUT.OUTER_CONTAINER}>
        
        {isDev && <DebugMonitor user={user} env={env} />}

        <div style={STYLES.LAYOUT.MAIN}>
          
          <HeaderArea user={user} />

          <SearchSection />

          {/* HTMXによる部分更新のターゲットとなるメインコンテナ */}
          <main style={STYLES.LAYOUT.LIST} id="cafe-list-container">
            <CafeList cafes={cafes} totalCount={totalCount} />
          </main>

          <footer style={{ 
            padding: `${SPACE.XL} 0`, 
            textAlign: 'center' as const, 
            borderTop: `1px solid #f3f3f3`,
            marginTop: SPACE.XL
          }}>
            <p style={{ 
              color: PAGE_DESIGN.FOOTER.COLOR, 
              fontSize: PAGE_DESIGN.FOOTER.FONT_SIZE, 
              letterSpacing: PAGE_DESIGN.FOOTER.LETTER_SPACING 
            }}>
              {UI_COPY.COPYRIGHT}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
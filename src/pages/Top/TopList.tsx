/**
 * =============================================================================
 * 【 ALETHEIA - メインポータル・ビュー / TopList.tsx 】
 * =============================================================================
 * 役割：店舗リストの表示と、HTMXによる「さらに読み込む」機能（追加読み込み）を提供。
 * 📁 File Path: src/pages/Top/TopList.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { SPACE } from '../../styles/theme'
import type { Cafe } from '../../db/cafe_queries'
import { CafeCard } from '../../components/CafeCard'

/**
 * デザイン・文言設定
 */
const DESIGN = {
  MORE_BTN: {
    PADDING: `${SPACE.SM} ${SPACE.MD}`,
    COLOR: '#666',
    BG: '#f9f9f9',
    BORDER: '1px solid #eee',
    RADIUS: '4px',
    FONT_SIZE: '0.85rem'
  }
} as const;

const COPY = {
  MORE_LABEL: 'さらに読み込む'
} as const;

interface CafeListProps {
  cafes: Cafe[];
  totalCount: number;
  offset?: number;
  keyword?: string;
  region?: string;
  category?: string;
  detectedRegion?: string;
}

/**
 * CafeList コンポーネント
 */
export const CafeList = ({ 
  cafes, 
  totalCount, 
  offset = 0, 
  keyword = '', 
  region = '', 
  category = '', 
  detectedRegion = '' 
}: CafeListProps) => {
  const nextOffset = offset + cafes.length;
  const hasMore = nextOffset < totalCount;
  
  // 次の読み込み用のクエリパラメータを構築
  const params = new URLSearchParams({
    offset: nextOffset.toString(),
    keyword: keyword || '',
    region: region || '',
    category: category || '',
    detectedRegion: detectedRegion || ''
  }).toString();

  return (
    <div className="cafe-list-block">
      {/* 1. 店舗カードの展開 */}
      {cafes.map((cafe, index) => (
        <CafeCard 
          key={cafe.service_id || `${offset}-${index}`}
          title={cafe.title}
          address={cafe.address}
        />
      ))}

      {/* 2. 「さらに読み込む」ボタンエリア（HTMX） */}
      <div className="more-button-wrapper" style={{ textAlign: 'center', marginTop: SPACE.MD }}>
        {hasMore ? (
          <button
            style={{ ...DESIGN.MORE_BTN, cursor: 'pointer', width: '100%' }}
            hx-get={`/search?${params}`}
            hx-target="closest .more-button-wrapper"
            hx-swap="outerHTML"
          >
            {COPY.MORE_LABEL}
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
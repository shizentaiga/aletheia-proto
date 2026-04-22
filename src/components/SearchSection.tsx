/**
 * =============================================================================
 * 【 ALETHEIA - 検索セクション / SearchSection.tsx 】
 * =============================================================================
 * 役割：エリアコンテキスト（地域・主要駅チップ）と、自由検索キーワードの提供。
 * 📁 File Path: src/components/SearchSection.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { STYLES, SPACE } from '../styles/theme'

// -----------------------------------------------------------------------------
// 1. デザイナー・エンジニア向け設定 (Visual & Functional Config)
// -----------------------------------------------------------------------------

const SEARCH_DESIGN = {
  AREA_CHIP: {
    BG: '#f5f5f5',
    TEXT: '#666',
    RADIUS: '999px',
    PADDING: '4px 12px',
    FONT_SIZE: '0.75rem',
    BORDER: 'none',
  },
  SEARCH_ICON_BTN: {
    COLOR: '#4285F4',
    FONT_SIZE: '1.2rem',
    BG: 'transparent',
    BORDER: 'none',
  }
} as const;

// -----------------------------------------------------------------------------
// 2. テキスト・文言定義 (UI Copy)
// -----------------------------------------------------------------------------

const UI_COPY = {
  PLACEHOLDER: '店舗名・特徴（Wi-Fi、静かなど）で検索...',
  SEARCH_LABEL: '🔍',
  // 地域コンテキスト
  AREAS: [
    { label: '東京', value: 'tokyo' },
    { label: '関東', value: 'kanto' },
    { label: '全国', value: 'all' },
  ],
  // 主要駅チップ（Cloudflareの判定に合わせて動的に出す想定）
  STATION_CHIPS: ['渋谷', '新宿', '池袋']
} as const;

// -----------------------------------------------------------------------------
// 3. メインコンポーネント
// -----------------------------------------------------------------------------

export const SearchSection = () => {
  return (
    <div style={{ ...STYLES.LAYOUT.STICKY_BAR, flexDirection: 'column', alignItems: 'stretch' }}>
      
      {/* 1段目：エリアコンテキスト（どこで） */}
      <div style={{ 
        display: 'flex', 
        gap: SPACE.XS, 
        marginBottom: SPACE.XS, 
        alignItems: 'center',
        overflowX: 'auto', // チップが多い場合に横スクロール可能に
        paddingBottom: '4px'
      }}>
        {/* 地域選択セレクト */}
        <select style={{ ...STYLES.COMPONENTS.SELECT, width: 'auto', minWidth: '80px' }}>
          {UI_COPY.AREAS.map((area) => (
            <option key={area.value} value={area.value}>
              {area.label}
            </option>
          ))}
        </select>

        {/* 主要駅チップ */}
        {UI_COPY.STATION_CHIPS.map((station) => (
          <button 
            key={station}
            style={{
              background: SEARCH_DESIGN.AREA_CHIP.BG,
              color: SEARCH_DESIGN.AREA_CHIP.TEXT,
              borderRadius: SEARCH_DESIGN.AREA_CHIP.RADIUS,
              padding: SEARCH_DESIGN.AREA_CHIP.PADDING,
              fontSize: SEARCH_DESIGN.AREA_CHIP.FONT_SIZE,
              border: SEARCH_DESIGN.AREA_CHIP.BORDER,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {station}
          </button>
        ))}
      </div>

      {/* 2段目：自由検索（何を） */}
      <section style={STYLES.LAYOUT.SEARCH_BOX}>
        <input 
          type="text" 
          placeholder={UI_COPY.PLACEHOLDER} 
          style={{ ...STYLES.COMPONENTS.INPUT, flex: 1 }} 
        />
        <button style={{ 
          background: SEARCH_DESIGN.SEARCH_ICON_BTN.BG, 
          border: SEARCH_DESIGN.SEARCH_ICON_BTN.BORDER, 
          color: SEARCH_DESIGN.SEARCH_ICON_BTN.COLOR, 
          fontSize: SEARCH_DESIGN.SEARCH_ICON_BTN.FONT_SIZE, 
          cursor: 'pointer', 
          padding: `0 ${SPACE.XS}` 
        }}>
          {UI_COPY.SEARCH_LABEL}
        </button>
      </section>

    </div>
  );
}
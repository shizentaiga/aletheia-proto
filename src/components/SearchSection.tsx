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

const SEARCH_DESIGN = {
  SEARCH_ICON_BTN: {
    COLOR: '#4285F4',
    FONT_SIZE: '1.2rem',
    BG: 'transparent',
    BORDER: 'none',
  },
  CHIP_AREA: {
    display: 'flex',
    gap: SPACE.XS,
    flexWrap: 'wrap' as const,
    minHeight: '24px',
    marginBottom: SPACE.XS,
    padding: `0 ${SPACE.XS}`
  },
  DRILLDOWN_WRAPPER: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 100,
    width: '100%',
    background: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'none',
    border: '1px solid #eee',
    marginTop: '4px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
  }
} as const;

const UI_COPY = {
  PLACEHOLDER: '店名や住所で検索...',
  SEARCH_LABEL: '🔍',
  LABEL_AREA: '📍 エリア',
  LABEL_FEAT: '✨ 特徴',
  DEFAULT_VAL: '指定なし'
} as const;

// 💡 Props インターフェースの定義
interface SearchSectionProps {
  region?: string;
  category?: string;
}

export const SearchSection = ({ region = '', category = '' }: SearchSectionProps) => {
  const COMMON_HX_ATTRS = {
    'hx-get': "/search",
    'hx-target': "#search-results-area",
    'hx-swap': "innerHTML",
    'hx-push-url': "true",
  };

  return (
    <div style={{ ...STYLES.LAYOUT.STICKY_BAR, flexDirection: 'column' }}>
      
      {/* 💡 修正：form タグに id と data 属性を追加 */}
      <form 
        id="search-form"
        style={STYLES.LAYOUT.SEARCH_BOX}
        {...COMMON_HX_ATTRS}
        hx-trigger="submit"
        data-current-region={region}
        data-current-category={category}
      >
        {/* 1段目：トリガーエリア */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: SPACE.XS,
          width: '100%',
          marginBottom: SPACE.XS 
        }}>
          {/* エリア選択ブロック */}
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div 
              id="area-trigger"
              style={STYLES.COMPONENTS.SELECT_REPLACEMENT}
              onclick="toggleDrilldown('region')"
            >
              <span style={{ fontSize: '0.7rem', display: 'block', color: '#999' }}>{UI_COPY.LABEL_AREA}</span>
              <span id="current-region-text" style={{ fontWeight: 'bold' }}>{UI_COPY.DEFAULT_VAL}</span>
            </div>
            <div id="drilldown-region" style={SEARCH_DESIGN.DRILLDOWN_WRAPPER}></div>
          </div>

          {/* 特徴選択ブロック */}
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div 
              id="feat-trigger" 
              style={STYLES.COMPONENTS.SELECT_REPLACEMENT}
              onclick="toggleDrilldown('category')"
            >
              <span style={{ fontSize: '0.7rem', display: 'block', color: '#999' }}>{UI_COPY.LABEL_FEAT}</span>
              <span id="current-category-text" style={{ fontWeight: 'bold' }}>{UI_COPY.DEFAULT_VAL}</span>
            </div>
            <div id="drilldown-category" style={SEARCH_DESIGN.DRILLDOWN_WRAPPER}></div>
          </div>
        </div>

        <div id="active-filters" style={SEARCH_DESIGN.CHIP_AREA}></div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%', 
          background: '#f5f5f5', 
          padding: `0 ${SPACE.MD}`,
          borderRadius: '8px'
        }}>
          <input 
            id="keyword-input"
            type="text" 
            name="keyword" 
            placeholder={UI_COPY.PLACEHOLDER} 
            style={{ ...STYLES.COMPONENTS.INPUT, padding: `${SPACE.SM} 0` }} 
          />
          
          <input type="hidden" name="region" id="hidden-region" value={region} />
          <input type="hidden" name="category" id="hidden-category" value={category} />
          <input type="hidden" name="offset" value="0" />
          
          <button 
            type="submit" 
            style={{ 
              background: SEARCH_DESIGN.SEARCH_ICON_BTN.BG, 
              border: SEARCH_DESIGN.SEARCH_ICON_BTN.BORDER, 
              color: SEARCH_DESIGN.SEARCH_ICON_BTN.COLOR, 
              fontSize: SEARCH_DESIGN.SEARCH_ICON_BTN.FONT_SIZE, 
              cursor: 'pointer', 
              paddingLeft: SPACE.SM
            }}
          >
            {UI_COPY.SEARCH_LABEL}
          </button>
        </div>
      </form>
    </div>
  );
}
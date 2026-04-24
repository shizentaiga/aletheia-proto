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
// 1. デザイン設定
// -----------------------------------------------------------------------------
const SEARCH_DESIGN = {
  SEARCH_ICON_BTN: {
    COLOR: '#4285F4',
    FONT_SIZE: '1.2rem',
    BG: 'transparent',
    BORDER: 'none',
  }
} as const;

// -----------------------------------------------------------------------------
// 2. UIコピー
// -----------------------------------------------------------------------------
const UI_COPY = {
  PLACEHOLDER: '店名や特徴で検索...',
  SEARCH_LABEL: '🔍',
  LABEL_AREA: '📍 エリア',
  LABEL_CAT: '🏷 カテゴリ',
  DEFAULT_VAL: '指定なし'
} as const;

// -----------------------------------------------------------------------------
// 3. メインコンポーネント
// -----------------------------------------------------------------------------
export const SearchSection = () => {
  const COMMON_HX_ATTRS = {
    'hx-get': "/search",
    'hx-target': "#search-results-area",
    'hx-swap': "innerHTML",
    'hx-push-url': "true",
  };

  return (
    <div style={{ ...STYLES.LAYOUT.STICKY_BAR, flexDirection: 'column' }}>
      
      <form 
        style={STYLES.LAYOUT.SEARCH_BOX}
        {...COMMON_HX_ATTRS}
        hx-trigger="submit"
      >
        {/* 1段目：ボトムシート起動ボタン（グリッド） */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: SPACE.XS,
          width: '100%',
          marginBottom: SPACE.XS 
        }}>
          {/* エリア選択ボタン */}
          <div 
            id="area-trigger"
            style={STYLES.COMPONENTS.SELECT_REPLACEMENT}
            // 💡 後ほどTop.tsxで実装するボトムシート表示ロジックを呼び出す
            onclick="document.getElementById('search-overlay').classList.add('show')"
          >
            <span style={{ fontSize: '0.7rem', display: 'block', color: '#999' }}>{UI_COPY.LABEL_AREA}</span>
            <span id="current-area-text" style={{ fontWeight: 'bold' }}>{UI_COPY.DEFAULT_VAL}</span>
          </div>

          {/* カテゴリ選択ボタン */}
          <div 
            id="cat-trigger"
            style={STYLES.COMPONENTS.SELECT_REPLACEMENT}
            onclick="document.getElementById('search-overlay').classList.add('show')"
          >
            <span style={{ fontSize: '0.7rem', display: 'block', color: '#999' }}>{UI_COPY.LABEL_CAT}</span>
            <span id="current-cat-text" style={{ fontWeight: 'bold' }}>{UI_COPY.DEFAULT_VAL}</span>
          </div>
        </div>

        {/* 2段目：キーワード入力エリア */}
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
          
          {/* ボトムシートで選択された値を保持する隠しフィールド */}
          <input type="hidden" name="region" id="hidden-region" value="" />
          <input type="hidden" name="category" id="hidden-category" value="" />
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
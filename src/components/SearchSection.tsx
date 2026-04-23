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
  AREAS: [
    { label: '全国', value: 'all' },
    { label: '東京', value: 'tokyo' },
    { label: '関東', value: 'kanto' },
  ],
  STATION_CHIPS: ['渋谷', '新宿', '池袋']
} as const;

// -----------------------------------------------------------------------------
// 3. メインコンポーネント
// -----------------------------------------------------------------------------
export const SearchSection = () => {
  /**
   * 💡 修正ポイント:
   * 検索時は常に offset=0 から開始することを明示するため、
   * hx-get に直接パラメータを載せるのではなく、input/select の値を
   * まとめて送信する構成にします。
   */
  const COMMON_HX_ATTRS = {
    'hx-get': "/search",
    'hx-target': "#cafe-cards-root",
    'hx-swap': "innerHTML",
    'hx-push-url': "true",
  };

  return (
    <div style={{ ...STYLES.LAYOUT.STICKY_BAR, flexDirection: 'column', alignItems: 'stretch' }}>
      
      {/* 1段目：エリアコンテキスト */}
      <div style={{ 
        display: 'flex', 
        gap: SPACE.XS, 
        marginBottom: SPACE.XS, 
        alignItems: 'center',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {/* 地域選択セレクト: 変更時にキーワード入力欄の値も一緒に送る */}
        <select 
          id="region-select"
          name="region"
          style={{ ...STYLES.COMPONENTS.SELECT, width: 'auto', minWidth: '80px' }}
          {...COMMON_HX_ATTRS}
          hx-trigger="change"
          hx-include="#keyword-input" 
        >
          {UI_COPY.AREAS.map((area) => (
            <option key={area.value} value={area.value}>
              {area.label}
            </option>
          ))}
        </select>

        {/* 主要駅チップ: test06方式に従い、URLにパラメータを固定して飛ばす */}
        {UI_COPY.STATION_CHIPS.map((station) => (
          <button 
            key={station}
            type="button"
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
            // チップクリック時はその駅名でリセット。offset=0を明示。
            hx-get={`/search?keyword=${encodeURIComponent(station)}&offset=0`}
            hx-target={COMMON_HX_ATTRS['hx-target']}
            hx-swap={COMMON_HX_ATTRS['hx-swap']}
            hx-include="#region-select"
            hx-push-url="true"
          >
            {station}
          </button>
        ))}
      </div>

      {/* 2段目：自由検索フォーム */}
      <form 
        style={STYLES.LAYOUT.SEARCH_BOX}
        {...COMMON_HX_ATTRS}
        hx-trigger="submit"
        hx-include="#region-select"
      >
        <input 
          id="keyword-input"
          type="text" 
          name="keyword" 
          placeholder={UI_COPY.PLACEHOLDER} 
          style={{ ...STYLES.COMPONENTS.INPUT, flex: 1 }} 
        />
        {/* offsetを0にリセットするための隠しフィールド */}
        <input type="hidden" name="offset" value="0" />
        
        <button 
          type="submit" 
          style={{ 
            background: SEARCH_DESIGN.SEARCH_ICON_BTN.BG, 
            border: SEARCH_DESIGN.SEARCH_ICON_BTN.BORDER, 
            color: SEARCH_DESIGN.SEARCH_ICON_BTN.COLOR, 
            fontSize: SEARCH_DESIGN.SEARCH_ICON_BTN.FONT_SIZE, 
            cursor: 'pointer', 
            padding: `0 ${SPACE.XS}` 
          }}
        >
          {UI_COPY.SEARCH_LABEL}
        </button>
      </form>

    </div>
  );
}
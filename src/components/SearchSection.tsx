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
    { label: '東京', value: 'tokyo' },
    { label: '関東', value: 'kanto' },
    { label: '全国', value: 'all' },
  ],
  STATION_CHIPS: ['渋谷', '新宿', '池袋']
} as const;

// -----------------------------------------------------------------------------
// 3. メインコンポーネント
// -----------------------------------------------------------------------------

export const SearchSection = () => {
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
        {/* 地域選択セレクト 
            修正点: IDを付与し、下のフォーム送信時にこの値も含まれるようにします。
        */}
        <select 
          id="region-select"
          name="region"
          style={{ ...STYLES.COMPONENTS.SELECT, width: 'auto', minWidth: '80px' }}
          hx-get="./search"
          hx-trigger="change"
          hx-target="#cafe-list-container"
          hx-include="[name='keyword']"
          hx-push-url="true"
        >
          {UI_COPY.AREAS.map((area) => (
            <option key={area.value} value={area.value}>
              {area.label}
            </option>
          ))}
        </select>

        {/* 主要駅チップ：相対パス ./search を指定して確実にパスを通す */}
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
            hx-get="./search"
            hx-vals={`{"keyword": "${station}"}`}
            hx-include="#region-select" // チップクリック時も選択中の地域を引き継ぐ
            hx-target="#cafe-list-container"
            hx-push-url="true"
          >
            {station}
          </button>
        ))}
      </div>

      {/* 2段目：自由検索（formタグを導入） */}
      {/* hx-trigger="submit" にすることで、
          Enterキー押下時と検索ボタン押下時の両方を一括でハンドリングします。
      */}
      <form 
        style={STYLES.LAYOUT.SEARCH_BOX}
        hx-get="./search"
        hx-trigger="submit"
        hx-target="#cafe-list-container"
        hx-include="#region-select" // 👈 修正: 検索実行時にセレクトボックスの値も強制的に含める
        hx-push-url="true"
      >
        <input 
          type="text" 
          name="keyword" 
          placeholder={UI_COPY.PLACEHOLDER} 
          style={{ ...STYLES.COMPONENTS.INPUT, flex: 1 }} 
        />
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
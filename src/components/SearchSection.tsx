/**
 * =============================================================================
 * 【 ALETHEIA - 検索セクション / SearchSection.tsx 】
 * =============================================================================
 * 役割：キーワード入力、設備フィルタ、検索実行ボタンを提供します。
 * 📁 File Path: src/components/SearchSection.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { STYLES, SPACE } from '../styles/theme'

// -----------------------------------------------------------------------------
// 1. デザイナー・エンジニア向け設定 (Visual & Functional Config)
// -----------------------------------------------------------------------------

const SEARCH_DESIGN = {
  BUTTON: {
    COLOR: '#4285F4', // アクセントカラー（themeのPRIMARYに相当）
    WEIGHT: 800,
    BG: 'transparent',
  }
} as const;

// -----------------------------------------------------------------------------
// 2. テキスト・文言定義 (UI Copy)
// -----------------------------------------------------------------------------

const UI_COPY = {
  PLACEHOLDER: 'エリアや特徴で検索...',
  SEARCH_LABEL: '検索',
  FILTER_OPTIONS: [
    { label: 'すべての設備', value: 'all' },
    { label: 'Wi-Fiあり', value: 'wifi' },
    { label: '電源あり', value: 'power' },
  ]
} as const;

// -----------------------------------------------------------------------------
// 3. メインコンポーネント
// -----------------------------------------------------------------------------

export const SearchSection = () => {
  return (
    <div style={STYLES.LAYOUT.STICKY_BAR}>
      <section style={STYLES.LAYOUT.SEARCH_BOX}>
        
        {/* キーワード入力 */}
        <input 
          type="text" 
          placeholder={UI_COPY.PLACEHOLDER} 
          style={STYLES.COMPONENTS.INPUT} 
        />

        {/* 設備フィルタ選択 */}
        <select style={STYLES.COMPONENTS.SELECT}>
          {UI_COPY.FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* 検索実行ボタン */}
        <button style={{ 
          background: SEARCH_DESIGN.BUTTON.BG, 
          border: 'none', 
          color: SEARCH_DESIGN.BUTTON.COLOR, 
          fontWeight: SEARCH_DESIGN.BUTTON.WEIGHT, 
          cursor: 'pointer', 
          padding: `0 ${SPACE.XS}` 
        }}>
          {UI_COPY.SEARCH_LABEL}
        </button>

      </section>
    </div>
  );
}
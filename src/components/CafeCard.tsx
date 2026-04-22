/**
 * =============================================================================
 * 【 ALETHEIA - カフェカード・コンポーネント / CafeCard.tsx 】
 * =============================================================================
 * 役割：ワークスペース情報の表示、および読み込み中のスケルトン表示。
 * 📁 File Path: src/components/CafeCard.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { STYLES, SPACE } from '../styles/theme'

// -----------------------------------------------------------------------------
// 1. デザイナー向け設定 (Visual Design Config)
// -----------------------------------------------------------------------------

const CARD_DESIGN = {
  TITLE: { FONT_SIZE: '1.1rem', WEIGHT: 700, COLOR: '#111' },
  LOCATION: { FONT_SIZE: '0.85rem', COLOR: '#888' },
  TAG: { 
    FONT_SIZE: '0.7rem', 
    BG: '#f5f5f5', 
    COLOR: '#666', 
    RADIUS: '6px',
    PADDING: '4px 10px' 
  },
  ARROW: { FONT_SIZE: '1.5rem', COLOR: '#eee' },
  // ホバー時の動的スタイル設定（JS文字列として渡す用）
  INTERACTION: {
    TRANSFORM_UP: 'translateY(-2px)',
    SHADOW: '0 8px 20px rgba(0,0,0,0.06)',
    BORDER_HOVER: '#ddd',
    BORDER_NORMAL: '#eee'
  },
  SKELETON: {
    ANIM_BG: 'linear-gradient(90deg,#f4f4f4,#fafafa,#f4f4f4)',
    FIXED_BG: '#f9f9f9',
    RADIUS: '4px'
  }
} as const;

// -----------------------------------------------------------------------------
// 2. 固定値・文言定義 (Static Config)
// -----------------------------------------------------------------------------

const CONFIG = {
  TAG_SEPARATOR: ' / ',
  LINK_DESTINATION: '#', // 将来的に詳細ページ '/cafe/:id' 等へ変更
  ARROW_CHAR: '›'
} as const;

// -----------------------------------------------------------------------------
// 3. メインコンポーネント (CafeCard)
// -----------------------------------------------------------------------------

interface CafeCardProps {
  name: string;
  tags: string;
  location: string;
}

export const CafeCard = ({ name, tags, location }: CafeCardProps) => {
  // インライン・イベントハンドラの文字列定義
  const hoverIn = `this.style.transform='${CARD_DESIGN.INTERACTION.TRANSFORM_UP}';this.style.boxShadow='${CARD_DESIGN.INTERACTION.SHADOW}';this.style.borderColor='${CARD_DESIGN.INTERACTION.BORDER_HOVER}'`;
  const hoverOut = `this.style.transform='translateY(0)';this.style.boxShadow='none';this.style.borderColor='${CARD_DESIGN.INTERACTION.BORDER_NORMAL}'`;

  return (
    <a 
      href={CONFIG.LINK_DESTINATION} 
      style={STYLES.COMPONENTS.CARD}
      onmouseover={hoverIn}
      onmouseout={hoverOut}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ 
            margin: 0, 
            fontSize: CARD_DESIGN.TITLE.FONT_SIZE, 
            fontWeight: CARD_DESIGN.TITLE.WEIGHT, 
            marginBottom: '4px' 
          }}>
            {name}
          </h3>
          <p style={{ 
            fontSize: CARD_DESIGN.LOCATION.FONT_SIZE, 
            color: CARD_DESIGN.LOCATION.COLOR, 
            margin: 0, 
            marginBottom: SPACE.SM 
          }}>
            {location}
          </p>
          <div style={{ display: 'flex', gap: SPACE.XS }}>
            {tags.split(CONFIG.TAG_SEPARATOR).map((tag, i) => (
              <span key={i} style={{ 
                fontSize: CARD_DESIGN.TAG.FONT_SIZE, 
                background: CARD_DESIGN.TAG.BG, 
                padding: CARD_DESIGN.TAG.PADDING, 
                borderRadius: CARD_DESIGN.TAG.RADIUS, 
                color: CARD_DESIGN.TAG.COLOR 
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div style={{ color: CARD_DESIGN.ARROW.COLOR, fontSize: CARD_DESIGN.ARROW.FONT_SIZE }}>
          {CONFIG.ARROW_CHAR}
        </div>
      </div>
    </a>
  );
}

// -----------------------------------------------------------------------------
// 4. スケルトンコンポーネント (SkeletonCard)
// -----------------------------------------------------------------------------

export const SkeletonCard = () => (
  <div style={{ ...STYLES.COMPONENTS.CARD, cursor: 'default', borderStyle: 'dashed' }}>
    <div style={{ 
      height: '20px', 
      width: '40%', 
      background: CARD_DESIGN.SKELETON.ANIM_BG, 
      marginBottom: SPACE.SM, 
      borderRadius: CARD_DESIGN.SKELETON.RADIUS 
    }}></div>
    <div style={{ 
      height: '14px', 
      width: '60%', 
      background: CARD_DESIGN.SKELETON.FIXED_BG, 
      borderRadius: CARD_DESIGN.SKELETON.RADIUS 
    }}></div>
  </div>
)
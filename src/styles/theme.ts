/**
 * =============================================================================
 * 【 ALETHEIA - デザインシステム定義 / theme.ts 】
 * =============================================================================
 * 役割：プロジェクト全体の余白、カラー、共通スタイルを一括管理します。
 * 📁 File Path: src/styles/theme.ts
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// 1. デザイナー向け基本設定 (Brand Identity & Tokens)
// -----------------------------------------------------------------------------

/**
 * カラーパレット
 */
const COLORS = {
  PRIMARY: '#4285F4',    // Google Blue / アクセント
  TEXT_MAIN: '#111111',  // メインテキスト
  TEXT_SUB: '#666666',   // 補足テキスト
  TEXT_LIGHT: '#999999', // 非常に薄いテキスト
  BORDER: '#eeeeee',     // 標準境界線
  BG_PAGE: '#ffffff',    // ページ背景
  BG_SUB: '#fafafa',     // サブ背景（モニター等）
} as const;

/**
 * タイポグラフィ
 */
const FONTS = {
  SANS: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

/**
 * エフェクト（影、角丸）
 */
const EFFECTS = {
  ROUND_FULL: '999px',
  ROUND_MD: '12px',
  ROUND_LG: '14px',
  SHADOW_SOFT: '0 8px 30px rgba(0,0,0,0.04)',
  SHADOW_HOVER: '0 8px 20px rgba(0,0,0,0.06)',
  TRANSITION: 'all 0.18s ease',
} as const;

// -----------------------------------------------------------------------------
// 2. 共通余白定義 (Spacing System)
// -----------------------------------------------------------------------------

export const SPACE = {
  XS: '8px',
  SM: '12px',
  MD: '16px',
  LG: '24px',
  XL: '40px',
} as const;

// -----------------------------------------------------------------------------
// 3. 共通レイアウト定義 (Layout Styles)
// -----------------------------------------------------------------------------

export const STYLES = {
  LAYOUT: {
    WRAPPER: { 
      minHeight: '100vh', 
      background: COLORS.BG_PAGE, 
      fontFamily: FONTS.SANS,
      color: COLORS.TEXT_MAIN
    },
    OUTER_CONTAINER: {
      display: 'flex',
      justifyContent: 'center',
      padding: `0 ${SPACE.MD}`,
      position: 'relative' as const,
    },
    MAIN: { 
      width: '100%',
      maxWidth: '800px', 
      margin: '0 auto',
    },
    HEADER: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: `${SPACE.LG} 0`,
    },
    STICKY_BAR: {
      position: 'sticky' as const,
      top: SPACE.SM,
      zIndex: 20,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(8px)',
      padding: `${SPACE.SM} 0`,
      marginBottom: SPACE.LG,
    },
    SEARCH_BOX: {
      display: 'flex',
      gap: SPACE.XS,
      padding: '10px 20px',
      background: COLORS.BG_PAGE,
      border: `1px solid ${COLORS.BORDER}`,
      borderRadius: EFFECTS.ROUND_FULL,
      boxShadow: EFFECTS.SHADOW_SOFT,
      alignItems: 'center',
    },
    LIST: { 
      display: 'flex', 
      flexDirection: 'column' as const, 
      gap: SPACE.SM, 
      paddingBottom: SPACE.XL 
    },
    DEBUG_MONITOR: {
      position: 'absolute' as const,
      left: SPACE.MD,
      top: '100px',
      width: '200px',
      padding: SPACE.MD,
      background: COLORS.BG_SUB,
      border: `1px solid ${COLORS.BORDER}`,
      borderRadius: EFFECTS.ROUND_MD,
      fontSize: '0.75rem',
      color: COLORS.TEXT_SUB,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: SPACE.SM,
      zIndex: 30,
    }
  },

  // -----------------------------------------------------------------------------
  // 4. 共通コンポーネント定義 (Component Styles)
  // -----------------------------------------------------------------------------
  COMPONENTS: {
    INPUT: { 
      flex: 1, 
      border: 'none', 
      outline: 'none', 
      fontSize: '1rem', 
      background: 'transparent' 
    },
    SELECT: { 
      border: 'none', 
      background: 'transparent', 
      color: COLORS.TEXT_SUB, 
      fontSize: '0.85rem', 
      cursor: 'pointer', 
      borderLeft: `1px solid ${COLORS.BORDER}`, 
      paddingLeft: SPACE.SM 
    },
    AUTH_BTN: { 
      padding: '8px 20px', 
      borderRadius: EFFECTS.ROUND_FULL, 
      fontSize: '0.85rem', 
      fontWeight: 'bold' as const, 
      textDecoration: 'none',
      background: COLORS.TEXT_MAIN,
      color: COLORS.BG_PAGE,
      transition: 'opacity 0.2s'
    },
    CARD: {
      padding: SPACE.LG,
      borderRadius: EFFECTS.ROUND_LG,
      background: COLORS.BG_PAGE,
      border: `1px solid ${COLORS.BORDER}`,
      transition: EFFECTS.TRANSITION,
      cursor: 'pointer',
      display: 'block',
      textDecoration: 'none',
      color: 'inherit',
    }
  }
} as const;
/**
 * =============================================================================
 * 【 ALETHEIA - ヘッダー・エリア / HeaderArea.tsx 】
 * =============================================================================
 * 役割：ロゴおよび認証状態に応じたナビゲーションを表示します。
 * 📁 File Path: src/components/TopHeader.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { STYLES } from '../../styles/theme'

// HTMX属性をTypeScriptに認識させるための定義
declare module 'hono/jsx' {
  namespace JSX {
    interface HTMLAttributes {
      'hx-get'?: string;
      'hx-target'?: string;
      'hx-push-url'?: string;
      'hx-trigger'?: string;
    }
  }
}

// -----------------------------------------------------------------------------
// 1. デザイナー向け設定 (Visual Design & Assets)
// -----------------------------------------------------------------------------

const DESIGN_CONFIG = {
  HEADER: {
    HEIGHT: '68px',            // 💡 72px -> 68px (スマート化)
    BG: 'rgba(255,255,255,0.85)',
    BLUR: 'blur(10px)',        // 💡 8px -> 10px (質感向上)
    BORDER_BOTTOM: '1px solid #f1f1f1',
    SHADOW: '0 2px 8px rgba(0,0,0,0.04)', // 💡 レイヤー感の追加
  },
  LOGO: {
    FONT_FAMILY: '"Times New Roman", "Georgia", serif', 
    FONT_SIZE: '1.28rem',      // 💡 1.2rem -> 1.28rem (視認性向上)
    WEIGHT: 500,               // 💡 400 -> 500 (芯を強く)
    COLOR: '#0f172a',          // 💡 #111 -> #0f172a (知的な青み)
    LETTER_SPACING: '0.06em', 
  },
  NAV: {
    FONT_SIZE: '0.82rem',
    FONT_WEIGHT: 500,
    TEXT_COLOR: '#222',
    BG: '#fff',
    BORDER: '1px solid #eee',
    LOGOUT_COLOR: '#64748b',
  }
} as const;

const UI_COPY = {
  BRAND_NAME: 'ALETHEIA',
  AUTH: {
    LOGIN: 'ログイン',
    LOGOUT: 'ログアウト',
  }
} as const;

const NAV_PATHS = {
  HOME: '/',
  GOOGLE_LOGIN: '/auth/google',
  LOGOUT: '/auth/logout',
} as const;

// -----------------------------------------------------------------------------
// 4. メインコンポーネント
// -----------------------------------------------------------------------------

interface HeaderAreaProps {
  user: any;
}

export const HeaderArea = ({ user }: HeaderAreaProps) => {
  return (
    <header style={{ 
      ...STYLES.LAYOUT.HEADER,
      height: DESIGN_CONFIG.HEADER.HEIGHT,
      borderBottom: DESIGN_CONFIG.HEADER.BORDER_BOTTOM,
      boxShadow: DESIGN_CONFIG.HEADER.SHADOW,
      background: DESIGN_CONFIG.HEADER.BG,
      backdropFilter: DESIGN_CONFIG.HEADER.BLUR,
      padding: '0 24px',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {/* 1. ブランドロゴ：ホバー時のクリック感を付与 */}
      <a 
        href={NAV_PATHS.HOME}
        hx-get={NAV_PATHS.HOME}
        hx-target="body"
        hx-push-url="true"
        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7' }}
        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
        style={{ 
          fontFamily: DESIGN_CONFIG.LOGO.FONT_FAMILY,
          fontSize: DESIGN_CONFIG.LOGO.FONT_SIZE, 
          fontWeight: DESIGN_CONFIG.LOGO.WEIGHT, 
          letterSpacing: DESIGN_CONFIG.LOGO.LETTER_SPACING,
          color: DESIGN_CONFIG.LOGO.COLOR,
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'opacity 0.15s ease',
          outline: 'none',
        }}
      >
        {UI_COPY.BRAND_NAME}
      </a>

      {/* 2. ナビゲーション */}
      <nav>
        {user ? (
          <a 
            href={NAV_PATHS.LOGOUT} 
            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#ddd' }}
            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#eee' }}
            style={{ 
              padding: '6px 14px',
              borderRadius: '999px',
              border: `1px solid #eee`,
              fontSize: DESIGN_CONFIG.NAV.FONT_SIZE, 
              color: DESIGN_CONFIG.NAV.LOGOUT_COLOR, 
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {UI_COPY.AUTH.LOGOUT}
          </a>
        ) : (
          <a 
            href={NAV_PATHS.GOOGLE_LOGIN} 
            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb' }}
            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = DESIGN_CONFIG.NAV.BG }}
            style={{
              padding: '8px 18px',
              borderRadius: '999px',
              border: DESIGN_CONFIG.NAV.BORDER,
              textDecoration: 'none',
              color: DESIGN_CONFIG.NAV.TEXT_COLOR,
              fontSize: DESIGN_CONFIG.NAV.FONT_SIZE,
              fontWeight: DESIGN_CONFIG.NAV.FONT_WEIGHT,
              background: DESIGN_CONFIG.NAV.BG,
              transition: 'all 0.2s ease',
            }}
          >
            {UI_COPY.AUTH.LOGIN}
          </a>
        )}
      </nav>
    </header>
  );
}
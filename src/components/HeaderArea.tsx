/**
 * =============================================================================
 * 【 ALETHEIA - ヘッダー・エリア / HeaderArea.tsx 】
 * =============================================================================
 * 役割：ロゴおよび認証状態に応じたナビゲーションを表示します。
 * 📁 File Path: src/components/HeaderArea.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { STYLES, SPACE } from '../styles/theme'

// -----------------------------------------------------------------------------
// 1. デザイナー向け設定 (Visual Design & Assets)
// -----------------------------------------------------------------------------

const DESIGN_CONFIG = {
  LOGO: {
    FONT_SIZE: '1.1rem',
    WEIGHT: 800,
    LETTER_SPACING: '-0.02em',
  },
  SLOGAN: {
    FONT_SIZE: '0.85rem',
    COLOR: '#999',
    WEIGHT: 400,
  },
  NAV: {
    FONT_SIZE: '0.85rem',
    LOGOUT_COLOR: '#666',
  }
} as const;

// -----------------------------------------------------------------------------
// 2. テキスト・文言定義 (UI Copy)
// -----------------------------------------------------------------------------

const UI_COPY = {
  BRAND_NAME: 'ALETHEIA',
  SLOGAN: '〜つながりは、偶然から。〜',
  AUTH: {
    START: 'はじめる',
    LOGOUT: 'ログアウト',
  }
} as const;

// -----------------------------------------------------------------------------
// 3. リンク・エンドポイント設定 (Navigation Paths)
// -----------------------------------------------------------------------------

const NAV_PATHS = {
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
    <header style={STYLES.LAYOUT.HEADER}>
      {/* ブランドロゴ・スローガン */}
      <h1 style={{ 
        fontSize: DESIGN_CONFIG.LOGO.FONT_SIZE, 
        fontWeight: DESIGN_CONFIG.LOGO.WEIGHT, 
        margin: 0, 
        letterSpacing: DESIGN_CONFIG.LOGO.LETTER_SPACING 
      }}>
        {UI_COPY.BRAND_NAME} 
        <span style={{ 
          fontWeight: DESIGN_CONFIG.SLOGAN.WEIGHT, 
          color: DESIGN_CONFIG.SLOGAN.COLOR, 
          marginLeft: SPACE.XS, 
          fontSize: DESIGN_CONFIG.SLOGAN.FONT_SIZE 
        }}>
          {UI_COPY.SLOGAN}
        </span>
      </h1>

      {/* ナビゲーション（認証状態により切り替え） */}
      <nav>
        {user ? (
          <a 
            href={NAV_PATHS.LOGOUT} 
            style={{ 
              fontSize: DESIGN_CONFIG.NAV.FONT_SIZE, 
              color: DESIGN_CONFIG.NAV.LOGOUT_COLOR, 
              textDecoration: 'none' 
            }}
          >
            {UI_COPY.AUTH.LOGOUT}
          </a>
        ) : (
          <a 
            href={NAV_PATHS.GOOGLE_LOGIN} 
            style={STYLES.COMPONENTS.AUTH_BTN}
          >
            {UI_COPY.AUTH.START}
          </a>
        )}
      </nav>
    </header>
  );
}
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
  HEADER: {
    HEIGHT: '72px',
    BG: 'rgba(255,255,255,0.9)',
    BLUR: 'blur(8px)',
    BORDER_BOTTOM: '1px solid #f3f3f3',
  },
  LOGO: {
    // 案B: 知的・哲学的なニュアンスを持つセリフ体
    FONT_FAMILY: '"Times New Roman", "Georgia", serif', 
    FONT_SIZE: '1.2rem',     // セリフ体は細身に見えるため、少しサイズをアップ
    WEIGHT: 400,            // 重厚感よりは「しなやかさ」を優先
    COLOR: '#111',
    LETTER_SPACING: '0.05em', // セリフ体特有の美しさを出すため、少し広めに
  },
  NAV: {
    FONT_SIZE: '0.82rem',
    FONT_WEIGHT: 500,
    TEXT_COLOR: '#222',
    BG: '#fff',
    BORDER: '1px solid #eee',
    LOGOUT_COLOR: '#666',
  }
} as const;

// -----------------------------------------------------------------------------
// 2. テキスト・文言定義 (UI Copy)
// -----------------------------------------------------------------------------

const UI_COPY = {
  BRAND_NAME: 'ALETHEIA',
  AUTH: {
    LOGIN: 'ログイン',
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
    <header style={{ 
      ...STYLES.LAYOUT.HEADER,
      height: DESIGN_CONFIG.HEADER.HEIGHT,
      borderBottom: DESIGN_CONFIG.HEADER.BORDER_BOTTOM,
      background: DESIGN_CONFIG.HEADER.BG,
      backdropFilter: DESIGN_CONFIG.HEADER.BLUR,
    }}>
      {/* 1. ブランドロゴ（案B: 知的・哲学的なセリフ体） */}
      <h1 style={{ 
        fontFamily: DESIGN_CONFIG.LOGO.FONT_FAMILY,
        fontSize: DESIGN_CONFIG.LOGO.FONT_SIZE, 
        fontWeight: DESIGN_CONFIG.LOGO.WEIGHT, 
        margin: 0, 
        letterSpacing: DESIGN_CONFIG.LOGO.LETTER_SPACING,
        color: DESIGN_CONFIG.LOGO.COLOR
      }}>
        {UI_COPY.BRAND_NAME}
      </h1>

      {/* 2. ナビゲーション（世界観を統一したログインボタン） */}
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
            style={{
              padding: '8px 14px',
              borderRadius: '999px',
              border: DESIGN_CONFIG.NAV.BORDER,
              textDecoration: 'none',
              color: DESIGN_CONFIG.NAV.TEXT_COLOR,
              fontSize: DESIGN_CONFIG.NAV.FONT_SIZE,
              fontWeight: DESIGN_CONFIG.NAV.FONT_WEIGHT,
              background: DESIGN_CONFIG.NAV.BG,
            }}
          >
            {UI_COPY.AUTH.LOGIN}
          </a>
        )}
      </nav>
    </header>
  );
}
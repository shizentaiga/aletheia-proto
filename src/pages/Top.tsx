/**
 * =============================================================================
 * 【 ALETHEIA - メインポータル・ビュー / Top.tsx 】
 * =============================================================================
 * ログイン状態に応じたトップ画面の描画を担当します。
 * 📁 File Path: src/pages/Top.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */

// -----------------------------------------------------------------------------
// 1. デザイン設定 (Styles / Design Assets)
// -----------------------------------------------------------------------------

/**
 * デザイン・トーン＆マナーを一括管理
 * デザイナーが調整する際はこのオブジェクトを変更します
 */
const STYLES = {
  COLORS: {
    PRIMARY: '#4285F4',    // Google Blue
    SUCCESS: '#2b9348',    // Active Green
    DANGER: '#d90429',     // Alert Red
    TEXT_MAIN: '#333333',
    TEXT_MUTE: '#666666',
    TEXT_LIGHT: '#888888',
    BG_CARD: '#ffffff',
    BG_FOOTER: '#f8f9fa',
    BORDER: '#dddddd',
  },
  CARD: {
    border: '1px solid #ddd',
    padding: '25px',
    borderRadius: '10px',
    background: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    textAlign: 'center' as const,
  },
  BUTTON: {
    BASE: 'display: inline-block; padding: 8px 16px; border-radius: 5px; font-size: 0.9rem; text-decoration: none; transition: opacity 0.2s;',
    PRIMARY: 'display: inline-block; padding: 12px 24px; background: #4285F4; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;',
    LOGOUT: 'padding: 8px 16px; border: 1px solid #666; color: #666; text-decoration: none; border-radius: 5px; font-size: 0.9rem;',
    DANGER: 'padding: 8px 16px; border: 1px solid #d90429; color: #d90429; background: transparent; border-radius: 5px; font-size: 0.9rem; cursor: pointer;',
  },
  FOOTER_BOX: {
    marginTop: '30px',
    padding: '15px',
    borderRadius: '8px',
    background: '#f8f9fa',
    fontSize: '0.9rem',
    color: '#555',
  }
}

// -----------------------------------------------------------------------------
// 2. 表示テキスト設定 (Text / I18n Assets)
// -----------------------------------------------------------------------------

const TEXT = {
  TITLE: 'メインポータル',
  DESCRIPTION: '情報の「種」から「資産」へ。現在はプロトタイプ稼働中です。',
  STATUS_UNLOGGED: '現在は【未ログイン】です',
  STATUS_LOGGED_IN: '✅ ログイン中: ',
  BTN_SIGNIN: 'Googleでサインイン',
  BTN_LOGOUT: 'ログアウト',
  BTN_DELETE: '退会する',
  CONFIRM_DELETE: '本当に退会しますか？\nこの操作は取り消せません。',
  NEXT_STEP: '📡 次のステップ：Cloudflare Edge Locationからの地域取得',
}

// -----------------------------------------------------------------------------
// 3. 型定義 (Type Definitions)
// -----------------------------------------------------------------------------

interface TopProps {
  user?: {
    display_name: string | null
    email: string | null
  } | null
}

// -----------------------------------------------------------------------------
// 4. コンポーネント (Component)
// -----------------------------------------------------------------------------

export const Top = ({ user }: TopProps) => {
  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: STYLES.COLORS.TEXT_MAIN }}>
        {TEXT.TITLE}
      </h2>
      <p style={{ color: STYLES.COLORS.TEXT_MUTE, marginBottom: '30px' }}>
        {TEXT.DESCRIPTION}
      </p>

      {/* --- 認証状態に応じたカード表示 --- */}
      <div style={STYLES.CARD}>
        {user ? (
          <div>
            <p style={{ color: STYLES.COLORS.SUCCESS, fontWeight: 'bold', fontSize: '1.1rem' }}>
              {TEXT.STATUS_LOGGED_IN}{user.display_name}
            </p>
            <p style={{ fontSize: '0.85rem', color: STYLES.COLORS.TEXT_LIGHT, margin: '8px 0 20px' }}>
              Email: {user.email}
            </p>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <a href="/logout" style={STYLES.BUTTON.LOGOUT}>
                {TEXT.BTN_LOGOUT}
              </a>
              <button 
                onclick={`if(confirm('${TEXT.CONFIRM_DELETE}')){ location.href='/delete-account'; }`}
                style={STYLES.BUTTON.DANGER}
              >
                {TEXT.BTN_DELETE}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: STYLES.COLORS.TEXT_MUTE, marginBottom: '20px' }}>
              {TEXT.STATUS_UNLOGGED}
            </p>
            <a href="/auth/google" style={STYLES.BUTTON.PRIMARY}>
              {TEXT.BTN_SIGNIN}
            </a>
          </div>
        )}
      </div>

      {/* --- 今後の展望セクション --- */}
      <div style={STYLES.FOOTER_BOX}>
        <p>{TEXT.NEXT_STEP}</p>
      </div>
    </div>
  )
}
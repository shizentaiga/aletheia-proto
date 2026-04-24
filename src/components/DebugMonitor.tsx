/**
 * =============================================================================
 * 【 ALETHEIA - 開発用デバッグモニター / DebugMonitor.tsx 】
 * =============================================================================
 * 役割：開発環境（development）において、ログインユーザー情報や環境変数を表示します。
 * 📁 File Path: src/components/DebugMonitor.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { STYLES, SPACE } from '../styles/theme'
import { getPrefectureName } from '../lib/constants'

// -----------------------------------------------------------------------------
// 1. デザイナー・エンジニア向け設定 (Visual & Debug Config)
// -----------------------------------------------------------------------------
const DEBUG_DESIGN = {
  TITLE: {
    FONT_SIZE: '0.65rem',
    WEIGHT: 800,
    COLOR: '#111',
    TRANSFORM: 'uppercase' as const,
  },
  LABEL: {
    COLOR: '#999',
    FONT_SIZE: '0.6rem',
    MARGIN_B: '2px',
  },
  VALUE: {
    COLOR: '#333',
    WEIGHT: 600,
    ACCENT_COLOR: '#4285F4',
  },
  FOOTER: {
    FONT_SIZE: '0.6rem',
    COLOR: '#ccc',
  }
} as const;

// -----------------------------------------------------------------------------
// 2. テキスト・表示ラベル定義 (UI Copy & Debug Labels)
// -----------------------------------------------------------------------------
const UI_COPY = {
  PANEL_TITLE: 'Debug Monitor',
  LABELS: {
    EMAIL: 'Email',
    LOCATION: 'Location (CF)', 
    MODE: 'MODE',
  },
  FALLBACK: {
    GUEST_EMAIL: 'guest@example.com',
    UNDEFINED: 'undefined',
    NOT_AVAILABLE: 'N/A',
    EMPTY: '(empty)'
  }
} as const;

// -----------------------------------------------------------------------------
// 3. メインコンポーネント
// -----------------------------------------------------------------------------
interface LocationInfo {
  region: string;
  city: string;
  colo: string;
}

interface DebugMonitorProps {
  user: any;
  env: any;
  location?: LocationInfo;
  // 💡 Note: Propsとしては受け取れる状態を維持しますが、表示からは除外します
  query?: {
    keyword?: string;
    region?: string;
    category?: string; // 🌟 これを追加
    offset?: number;
  };
}

export const DebugMonitor = ({ user, env, location, query }: DebugMonitorProps) => {
  const mappedPref = getPrefectureName(location?.region);

  return (
    <aside style={STYLES.LAYOUT.DEBUG_MONITOR}>
      {/* タイトルセクション */}
      <div style={{ 
        fontWeight: DEBUG_DESIGN.TITLE.WEIGHT, 
        color: DEBUG_DESIGN.TITLE.COLOR, 
        fontSize: DEBUG_DESIGN.TITLE.FONT_SIZE, 
        textTransform: DEBUG_DESIGN.TITLE.TRANSFORM 
      }}>
        {UI_COPY.PANEL_TITLE}
      </div>
      
      {/* ユーザー情報セクション */}
      <div style={{ borderTop: `1px solid ${STYLES.LAYOUT.DEBUG_MONITOR.border}`, paddingTop: SPACE.XS }}>
        <div style={{ color: DEBUG_DESIGN.LABEL.COLOR, fontSize: DEBUG_DESIGN.LABEL.FONT_SIZE, marginBottom: DEBUG_DESIGN.LABEL.MARGIN_B }}>
          {UI_COPY.LABELS.EMAIL}
        </div>
        <div style={{ fontWeight: DEBUG_DESIGN.VALUE.WEIGHT, wordBreak: 'break-all', color: DEBUG_DESIGN.VALUE.COLOR }}>
          {user?.email || UI_COPY.FALLBACK.GUEST_EMAIL}
        </div>
      </div>

      {/* CDN位置情報セクション */}
      <div>
        <div style={{ color: DEBUG_DESIGN.LABEL.COLOR, fontSize: DEBUG_DESIGN.LABEL.FONT_SIZE, marginBottom: DEBUG_DESIGN.LABEL.MARGIN_B }}>
          {UI_COPY.LABELS.LOCATION}
        </div>
        <div style={{ fontWeight: DEBUG_DESIGN.VALUE.WEIGHT, color: DEBUG_DESIGN.VALUE.COLOR, lineHeight: 1.4 }}>
          Region: <span style={{ color: DEBUG_DESIGN.VALUE.ACCENT_COLOR }}>{location?.region || UI_COPY.FALLBACK.NOT_AVAILABLE}</span><br />
          Mapped: <span style={{ color: DEBUG_DESIGN.VALUE.ACCENT_COLOR }}>{mappedPref || UI_COPY.FALLBACK.NOT_AVAILABLE}</span><br />
          City: <span style={{ color: DEBUG_DESIGN.VALUE.ACCENT_COLOR }}>{location?.city || UI_COPY.FALLBACK.NOT_AVAILABLE}</span><br />
          Colo: <span style={{ color: DEBUG_DESIGN.VALUE.ACCENT_COLOR }}>{location?.colo || UI_COPY.FALLBACK.NOT_AVAILABLE}</span>
        </div>
      </div>

      {/* 環境モード表示 */}
      <div style={{ fontSize: DEBUG_DESIGN.FOOTER.FONT_SIZE, color: DEBUG_DESIGN.FOOTER.COLOR, textAlign: 'right', marginTop: SPACE.XS }}>
        {UI_COPY.LABELS.MODE}: {env?.NODE_ENV || UI_COPY.FALLBACK.UNDEFINED}
      </div>
    </aside>
  );
}
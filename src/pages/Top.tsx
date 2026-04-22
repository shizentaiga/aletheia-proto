/**
 * =============================================================================
 * 【 ALETHEIA - メインポータル・ビュー / Top.tsx 】
 * =============================================================================
 * 役割：各コンポーネントを配置し、ページ全体のレイアウトを構築します。
 * 📁 File Path: src/pages/Top.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */

// -----------------------------------------------------------------------------
// 1. 外部依存・デザインシステム
// -----------------------------------------------------------------------------
import { STYLES, SPACE } from '../styles/theme'

// -----------------------------------------------------------------------------
// 2. サブ・コンポーネントの導入 (UI Units)
// -----------------------------------------------------------------------------
import { DebugMonitor } from '../components/DebugMonitor'
import { HeaderArea } from '../components/HeaderArea'
import { SearchSection } from '../components/SearchSection'
import { CafeCard, SkeletonCard } from '../components/CafeCard'

// -----------------------------------------------------------------------------
// 3. ページ専用設定 (Page-Specific Config)
// -----------------------------------------------------------------------------

const PAGE_DESIGN = {
  SECTION_TITLE: { 
    FONT_SIZE: '0.9rem', 
    COLOR: '#111', 
    WEIGHT: 700 
  },
  COUNTER: { 
    COLOR: '#999', 
    WEIGHT: 400 
  },
  FOOTER: {
    FONT_SIZE: '0.75rem',
    COLOR: '#ccc',
    LETTER_SPACING: '1px'
  }
} as const;

const UI_COPY = {
  LIST_TITLE: '近くのワークスペース',
  RESULTS_COUNT: '23件のカフェ',
  COPYRIGHT: '© 2026 ALETHEIA PROJECT'
} as const;

// -----------------------------------------------------------------------------
// 4. メイン・ビュー
// -----------------------------------------------------------------------------

interface TopProps {
  user?: any;
  env?: any;
}

export const Top = ({ user, env }: TopProps) => {
  // 開発環境判定（DebugMonitorの表示制御）
  const isDev = env?.NODE_ENV === 'development';

  return (
    <div style={STYLES.LAYOUT.WRAPPER}>
      <div style={STYLES.LAYOUT.OUTER_CONTAINER}>
        
        {/* 【開発支援】特定の環境下でのみ表示されるサイドパネル */}
        {isDev && <DebugMonitor user={user} env={env} />}

        <div style={STYLES.LAYOUT.MAIN}>
          
          {/* 【ヘッダー】ロゴ・認証ナビゲーション */}
          <HeaderArea user={user} />

          {/* 【検索エリア】スティッキー配置の検索ボックス */}
          <SearchSection />

          <main style={STYLES.LAYOUT.LIST}>
            {/* リストヘッダー（件数表示） */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: SPACE.XS 
            }}>
              <h2 style={{ 
                fontSize: PAGE_DESIGN.SECTION_TITLE.FONT_SIZE, 
                color: PAGE_DESIGN.SECTION_TITLE.COLOR, 
                fontWeight: PAGE_DESIGN.SECTION_TITLE.WEIGHT 
              }}>
                {UI_COPY.LIST_TITLE} 
                <span style={{ 
                  color: PAGE_DESIGN.COUNTER.COLOR, 
                  fontWeight: PAGE_DESIGN.COUNTER.WEIGHT, 
                  marginLeft: SPACE.XS 
                }}>
                  {UI_COPY.RESULTS_COUNT}
                </span>
              </h2>
            </div>

            {/* カフェ一覧（プロトタイプ・モックデータ） */}
            <CafeCard 
              name="Blue Bottle Coffee - Aoyama" 
              location="東京都港区南青山 3-13-14" 
              tags="Wi-Fi / 電源あり / テラス席" 
            />
            <CafeCard 
              name="Aletheia Lounge" 
              location="神奈川県横浜市西区（直営プロトタイプ）" 
              tags="静かな空間 / 集中モード / 予約可" 
            />
            <CafeCard 
              name="FabCafe Tokyo" 
              location="東京都渋谷区道玄坂 1-22-7" 
              tags="クリエイティブ / 3Dプリンタ / 電源" 
            />

            {/* ローディング状態のプレビュー */}
            <SkeletonCard />
            <SkeletonCard />

          </main>

          {/* フッター */}
          <footer style={{ 
            padding: `${SPACE.XL} 0`, 
            textAlign: 'center' as const, 
            borderTop: `1px solid ${STYLES.LAYOUT.DEBUG_MONITOR.border}` 
          }}>
            <p style={{ 
              color: PAGE_DESIGN.FOOTER.COLOR, 
              fontSize: PAGE_DESIGN.FOOTER.FONT_SIZE, 
              letterSpacing: PAGE_DESIGN.FOOTER.LETTER_SPACING 
            }}>
              {UI_COPY.COPYRIGHT}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
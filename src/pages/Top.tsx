/**
 * =============================================================================
 * 【 ALETHEIA - メインポータル・ビュー / Top.tsx 】
 * =============================================================================
 * 役割：実データ（店名・住所）に基づき、ノイズを排したリストを構築します。
 * 📁 File Path: src/pages/Top.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */

// -----------------------------------------------------------------------------
// 1. 外部依存・デザインシステム
// -----------------------------------------------------------------------------
import { STYLES, SPACE } from '../styles/theme'

// -----------------------------------------------------------------------------
// 2. サブ・コンポーネント
// -----------------------------------------------------------------------------
import { DebugMonitor } from '../components/DebugMonitor'
import { HeaderArea } from '../components/HeaderArea'
import { SearchSection } from '../components/SearchSection'
import { CafeCard } from '../components/CafeCard'

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
  LIST_TITLE: '近くのカフェ', // 「ワークスペース」から具体的表現へ
  RESULTS_LABEL: '表示中',     // 固定件数ではなく現状の提示
  COPYRIGHT: '© 2026 ALETHEIA PROJECT'
} as const;

// -----------------------------------------------------------------------------
// 4. メイン・ビュー
// -----------------------------------------------------------------------------

interface TopProps {
  user?: any;
  env?: any;
  cafes?: Array<{ title: string; address: string }>; // 修正：title / address へ変更
}

export const Top = ({ user, env, cafes }: TopProps) => {
  const isDev = env?.NODE_ENV === 'development';

  // モックデータ（実データがない場合のフォールバック）
  // 修正：プロパティ名を title / address に統一
  const displayCafes = cafes || [
    { title: "Blue Bottle Coffee - Aoyama", address: "東京都港区南青山 3-13-14" },
    { title: "Aletheia Lounge", address: "東京都渋谷区（プロトタイプ）" },
    { title: "FabCafe Tokyo", address: "東京都渋谷区道玄坂 1-22-7" },
  ];

  return (
    <div style={STYLES.LAYOUT.WRAPPER}>
      <div style={STYLES.LAYOUT.OUTER_CONTAINER}>
        
        {isDev && <DebugMonitor user={user} env={env} />}

        <div style={STYLES.LAYOUT.MAIN}>
          
          <HeaderArea user={user} />

          <SearchSection />

          <main style={STYLES.LAYOUT.LIST}>
            {/* リストヘッダー */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: SPACE.SM 
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
                  {displayCafes.length}件{UI_COPY.RESULTS_LABEL}
                </span>
              </h2>
            </div>

            {/* カフェ一覧：タグを排除し、テキストの力強さで魅せる */}
            {displayCafes.map((cafe, index) => (
              <CafeCard 
                key={index}
                title={cafe.title}     // 修正：name -> title
                address={cafe.address} // 修正：location -> address
                // tags プロパティを渡さない（またはCafeCard側で非表示に）
              />
            ))}

            {/* SkeletonCard はデータ読み込み中のみ表示する運用へ変更するため、ここでは一旦削除 */}

          </main>

          <footer style={{ 
            padding: `${SPACE.XL} 0`, 
            textAlign: 'center' as const, 
            borderTop: `1px solid #f3f3f3` 
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
/**
 * =============================================================================
 * 【 ALETHEIA - メインポータル・ビュー / Top.tsx 】
 * =============================================================================
 * 📁 File Path: src/pages/Top.tsx
 * * デザインコンセプト：
 * 1. Sticky Search - 検索体験を途切れさせない固定バー
 * 2. Spacing System - 余白の統一によるプロトタイプ感の脱却
 * 3. Feedback - ホバー時の挙動とスケルトンによる期待感の演出
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */

// -----------------------------------------------------------------------------
// 1. デザイン設定 (Design System)
// -----------------------------------------------------------------------------

const SPACE = {
  XS: '8px',
  SM: '12px',
  MD: '16px',
  LG: '24px',
  XL: '40px',
} as const;

const STYLES = {
  LAYOUT: {
    WRAPPER: { 
      minHeight: '100vh', 
      background: '#fff', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#111'
    },
    MAIN: { maxWidth: '800px', margin: '0 auto', padding: `0 ${SPACE.MD}` },
    HEADER: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: `${SPACE.LG} 0`,
    },
    // スクロール時に追いかけてくる検索バーの土台
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
      background: '#fff',
      border: '1px solid #eee',
      borderRadius: '999px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
      alignItems: 'center',
    },
    LIST: { display: 'flex', flexDirection: 'column' as const, gap: SPACE.SM, paddingBottom: SPACE.XL },
  },
  COMPONENTS: {
    INPUT: { flex: 1, border: 'none', outline: 'none', fontSize: '1rem', background: 'transparent' },
    SELECT: { border: 'none', background: 'transparent', color: '#666', fontSize: '0.85rem', cursor: 'pointer', borderLeft: '1px solid #eee', paddingLeft: SPACE.SM },
    AUTH_BTN: { 
      padding: '8px 20px', 
      borderRadius: '999px', 
      fontSize: '0.85rem', 
      fontWeight: 'bold' as const, 
      textDecoration: 'none',
      background: '#111',
      color: '#fff',
      transition: 'opacity 0.2s'
    },
    CARD: {
      padding: SPACE.LG,
      borderRadius: '14px',
      background: '#fff',
      border: '1px solid #eee',
      transition: 'all 0.18s ease',
      cursor: 'pointer',
      display: 'block',
      textDecoration: 'none',
      color: 'inherit',
    }
  }
}

// -----------------------------------------------------------------------------
// 3. サブ・コンポーネント
// -----------------------------------------------------------------------------

const HeaderArea = ({ user }: { user: any }) => (
  <header style={STYLES.LAYOUT.HEADER}>
    <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
      ALETHEIA <span style={{ fontWeight: 400, color: '#999', marginLeft: SPACE.XS, fontSize: '0.85rem' }}>〜つながりは、偶然から。〜</span>
    </h1>
    <nav>
      {user ? (
        <a href="/auth/logout" style={{ fontSize: '0.85rem', color: '#666', textDecoration: 'none' }}>ログアウト</a>
      ) : (
        <a href="/auth/google" style={STYLES.COMPONENTS.AUTH_BTN}>はじめる</a>
      )}
    </nav>
  </header>
)

const SearchSection = () => (
  <div style={STYLES.LAYOUT.STICKY_BAR}>
    <section style={STYLES.LAYOUT.SEARCH_BOX}>
      <input type="text" placeholder="エリアや特徴で検索..." style={STYLES.COMPONENTS.INPUT} />
      <select style={STYLES.COMPONENTS.SELECT}>
        <option>すべての設備</option>
        <option>Wi-Fiあり</option>
        <option>電源あり</option>
      </select>
      <button style={{ background: 'transparent', border: 'none', color: '#4285F4', fontWeight: 800, cursor: 'pointer', padding: `0 ${SPACE.XS}` }}>
        検索
      </button>
    </section>
  </div>
)

const CafeCard = ({ name, tags, location }: { name: string, tags: string, location: string }) => (
  <a 
    href="#" 
    style={STYLES.COMPONENTS.CARD}
    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 20px rgba(0,0,0,0.06)';this.style.borderColor='#ddd'"
    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';this.style.borderColor='#eee'"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>{name}</h3>
        <p style={{ fontSize: '0.85rem', color: '#888', margin: 0, marginBottom: SPACE.SM }}>{location}</p>
        <div style={{ display: 'flex', gap: SPACE.XS }}>
          {tags.split(' / ').map((tag, i) => (
            <span key={i} style={{ fontSize: '0.7rem', background: '#f5f5f5', padding: '4px 10px', borderRadius: '6px', color: '#666' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div style={{ color: '#eee', fontSize: '1.5rem' }}>›</div>
    </div>
  </a>
)

const SkeletonCard = () => (
  <div style={{ ...STYLES.COMPONENTS.CARD, cursor: 'default', borderStyle: 'dashed' }}>
    <div style={{ height: '20px', width: '40%', background: 'linear-gradient(90deg,#f4f4f4,#fafafa,#f4f4f4)', marginBottom: SPACE.SM, borderRadius: '4px' }}></div>
    <div style={{ height: '14px', width: '60%', background: '#f9f9f9', borderRadius: '4px' }}></div>
  </div>
)

// -----------------------------------------------------------------------------
// 4. メイン・ビュー
// -----------------------------------------------------------------------------

export const Top = ({ user }: { user?: any }) => {
  return (
    <div style={STYLES.LAYOUT.WRAPPER}>
      <div style={STYLES.LAYOUT.MAIN}>
        
        {/* 固定しないヘッダー */}
        <HeaderArea user={user} />

        {/* スクロール時に固定される検索セクション */}
        <SearchSection />

        <main style={STYLES.LAYOUT.LIST}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE.XS }}>
            <h2 style={{ fontSize: '0.9rem', color: '#111', fontWeight: 700 }}>
              近くのワークスペース <span style={{ color: '#999', fontWeight: 400, marginLeft: SPACE.XS }}>23件のカフェ</span>
            </h2>
          </div>

          {/* 実データ表示サンプル */}
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

          {/* ローディング Skeleton 表示サンプル */}
          <SkeletonCard />
          <SkeletonCard />

        </main>

        <footer style={{ padding: `${SPACE.XL} 0`, textAlign: 'center' as const, borderTop: '1px solid #eee' }}>
          <p style={{ color: '#ccc', fontSize: '0.75rem', letterSpacing: '1px' }}>© 2026 ALETHEIA PROJECT</p>
        </footer>
      </div>
    </div>
  )
}
/**
 * =============================================================================
 * 【 ALETHEIA - メインポータル・ビュー / TopPage.tsx 】
 * =============================================================================
 * 役割：実データに基づき、各コンポーネントを統合してメインポータルを構築します。
 * 📁 File Path: src/pages/Top/TopPage.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { STYLES, SPACE } from '../../styles/theme'
import type { Cafe } from '../../db/cafe_queries'

// サブ・コンポーネント
import { DebugMonitor } from '../../components/DebugMonitor'
import { HeaderArea } from './TopHeader'
import { SearchSection } from './TopSearch'
import { SearchHeader } from '../../components/SearchHeader'
import { SearchLogic } from '../../components/SearchLogic'

// 💡 外部ファイル化したコンポーネント・設定のインポート
import { CafeList } from './TopList'
import { TopStyles } from './TopStyles'
import { TopScripts } from './TopScripts'
import { PAGE_DESIGN, UI_COPY } from './TopConfig'

// 型定義
interface LocationInfo { region: string; city: string; colo: string; }
interface TopProps {
  user?: any; env?: any; cafes?: Cafe[]; totalCount?: number;
  location?: LocationInfo; keyword?: string; region?: string;
  category?: string;
}

export const Top = ({ user, env, cafes = [], totalCount = 0, location, keyword = '', region = '', category = '' }: TopProps) => {
  const isDev = env?.NODE_ENV === 'development';

  return (
    <div style={STYLES.LAYOUT.WRAPPER}>
      <TopStyles />

      <div style={STYLES.LAYOUT.OUTER_CONTAINER}>
        {isDev && (
          <div style={{ position: 'sticky', top: SPACE.MD, alignSelf: 'start', zIndex: 1000 }}>
            <DebugMonitor user={user} env={env} location={location} query={{ keyword, region, category }} />
          </div>
        )}

        <div style={STYLES.LAYOUT.MAIN}>
          <HeaderArea user={user} />
          <SearchSection region={region} category={category} />

          <main style={STYLES.LAYOUT.LIST} id="cafe-list-container">
            <div id="search-results-area">
              <SearchHeader totalCount={totalCount} />
              <div id="cafe-cards-root">
                <CafeList 
                  cafes={cafes} 
                  totalCount={totalCount} 
                  keyword={keyword} 
                  region={region} 
                  category={category} 
                  detectedRegion={location?.region}
                  offset={0} 
                />
              </div>
            </div>
          </main>
          
          <footer style={{ textAlign: 'center', padding: SPACE.LG, marginTop: SPACE.XL }}>
            <p style={PAGE_DESIGN.FOOTER}>{UI_COPY.COPYRIGHT}</p>
          </footer>
        </div>
      </div>

      <SearchLogic />
      <TopScripts />
    </div>
  );
}
import { Hono } from 'hono'
import { html } from 'hono/html'

type Bindings = { ALETHEIA_PROTO_DB: D1Database }
export const test03 = new Hono<{ Bindings: Bindings }>()

// =============================================================================
// 1. DESIGN TOKENS
// =============================================================================
const DESIGN_TOKENS = {
  colors: {
    primary: '#007aff',       
    brand: '#006241',         
    background: '#f8f8fa',    
    surface: '#ffffff',       
    textPrimary: '#1c1c1e',   
    textSecondary: '#636366', 
    textTertiary: '#acacb0',  
    border: '#e5e5ea',        
    inkWell: '#f2f2f7'        
  },
  typography: {
    display: { size: '20px', weight: '700', spacing: '-0.02em' }, 
    title:   { size: '16px', weight: '600', spacing: '-0.01em' }, 
    body:    { size: '14px', weight: '400', spacing: '0' },       
    caption: { size: '11px', weight: '500', spacing: '0.02em' },  
    lineHeight: '1.5'
  },
  layout: {
    radius: '12px',           
    gutter: '16px'            
  }
};

const UI_TEXT = {
  appTitle: 'ALETHEIA Discovery',
  rootLabel: '日本',
  defaultRegion: '関東',
  fallbackLocation: '日本全域',
  unit: '件の地点',
  sectionSuffix: 'のスポット',
  emptyLabel: 'データが見つかりませんでした',
  selectors: {
    prefPrompt: '都道府県を選択',
    cityBack: '市区町村を選択'
  }
};

test03.get('/', async (c) => {
  const db = c.env.ALETHEIA_PROTO_DB;

  const region = c.req.query('region') || UI_TEXT.defaultRegion;
  const pref = c.req.query('pref') || '';
  const city = c.req.query('city') || '';
  const q = c.req.query('q') || '';

  const areaFilter = (pref + city).replace(/[\s　]/g, '');
  const searchKeyword = q.trim().replace(/[\s　]/g, '%');

  // --- デバッグ用の集計リスト取得 ---
  let debugPrefs: { name: string, count: number }[] = [];
  let debugCities: { name: string, count: number }[] = [];

  try {
    // 1. 都道府県別の件数を多い順に取得
    const prefData = await db.prepare(`
      SELECT 
        CASE 
          WHEN SUBSTR(address, 4, 1) = '県' THEN SUBSTR(address, 1, 4)
          ELSE SUBSTR(address, 1, 3)
        END as name,
        COUNT(*) as count
      FROM services 
      WHERE address IS NOT NULL AND address != ''
      GROUP BY name
      ORDER BY count DESC
      LIMIT 20
    `).all<{ name: string, count: number }>();
    debugPrefs = prefData.results;

    // 2. 選択された都道府県内の市区町村別件数を取得
    if (pref) {
      const cityData = await db.prepare(`
        SELECT 
          SUBSTR(
            address, 
            LENGTH(?) + 1, 
            INSTR(SUBSTR(address, LENGTH(?) + 1), '区') + 
            INSTR(SUBSTR(address, LENGTH(?) + 1), '市') + 
            INSTR(SUBSTR(address, LENGTH(?) + 1), '町') + 
            INSTR(SUBSTR(address, LENGTH(?) + 1), '村') 
          ) as name,
          COUNT(*) as count
        FROM services 
        WHERE address LIKE ?
        GROUP BY name
        HAVING name != ''
        ORDER BY count DESC
        LIMIT 50
      `).bind(pref, pref, pref, pref, pref, `${pref}%`).all<{ name: string, count: number }>();
      debugCities = cityData.results;
    }

    // メインコンテンツ
    const isSearchMode = q.length > 0;
    const whereClause = isSearchMode 
      ? `WHERE s.title LIKE ? OR s.address LIKE ?`
      : `WHERE REPLACE(REPLACE(s.address, ' ', ''), '　', '') LIKE ?`;
    
    const bindParams = isSearchMode 
      ? [`%${searchKeyword}%`, `%${searchKeyword}%`] 
      : [`${areaFilter}%`];

    const { total } = await db.prepare(
      `SELECT COUNT(*) as total FROM services s ${whereClause}`
    ).bind(...bindParams).first<{ total: number }>() || { total: 0 };

    const { results } = await db.prepare(`
      SELECT s.title, s.address, b.name as brand_name
      FROM services s
      LEFT JOIN brands b ON s.brand_id = b.brand_id
      ${whereClause}
      LIMIT 100
    `).bind(...bindParams).all();

    return c.html(html`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>${UI_TEXT.appTitle}</title>
        <style>
          :root {
            --primary: ${DESIGN_TOKENS.colors.primary};
            --accent: ${DESIGN_TOKENS.colors.brand};
            --bg: ${DESIGN_TOKENS.colors.background};
            --card: ${DESIGN_TOKENS.colors.surface};
            --text-main: ${DESIGN_TOKENS.colors.textPrimary};
            --text-sub: ${DESIGN_TOKENS.colors.textSecondary};
            --border: ${DESIGN_TOKENS.colors.border};
            --active: ${DESIGN_TOKENS.colors.inkWell};
          }
          body { 
            font-family: -apple-system, sans-serif; 
            margin: 0; background: var(--bg); color: var(--text-main); 
            line-height: ${DESIGN_TOKENS.typography.lineHeight};
          }
          
          .breadcrumb-nav { background: var(--card); padding: 12px 16px; border-bottom: 0.5px solid var(--border); position: sticky; top: 0; z-index: 100; padding-left: 100px; }
          .breadcrumb-nav a { text-decoration: none; color: var(--primary); font-size: 12px; }
          .search-box { background: var(--card); padding: 12px 16px; border-bottom: 0.5px solid var(--border); padding-left: 100px; }
          .search-input { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 16px; box-sizing: border-box; }
          
          .status-header { background: var(--card); padding: 16px 16px 16px 100px; border-bottom: 0.5px solid var(--border); }
          .current-loc { font-size: ${DESIGN_TOKENS.typography.display.size}; font-weight: 700; display: block; }
          
          .list-item { padding: 16px; border-bottom: 0.5px solid var(--border); background: var(--card); display: flex; justify-content: space-between; align-items: center; margin-left: 80px; }
          .item-title { font-weight: 600; font-size: 15px; margin-bottom: 4px; display: block; }
          .item-address { font-size: 13px; color: var(--text-sub); }

          /* デバッグモニター (集計表示) */
          .debug-monitor { 
            position: fixed; top: 0; left: 0; bottom: 0; width: 80px;
            background: rgba(30, 30, 30, 0.95); color: #00ff00; 
            font-family: monospace; font-size: 9px; z-index: 9999;
            overflow-y: auto; padding: 10px 4px;
            border-right: 1px solid #444;
          }
          .debug-section-title { font-weight: bold; color: #fff; margin-bottom: 8px; border-bottom: 1px solid #555; padding-bottom: 2px; display: block; }
          .debug-row { 
            display: block; background: #333; padding: 4px 2px; margin-bottom: 4px; 
            border-radius: 4px; text-align: center; line-height: 1.2;
          }
          .debug-count { color: #ffcc00; display: block; font-weight: bold; font-size: 10px; }
        </style>
      </head>
      <body>
        <aside class="debug-monitor">
          <span class="debug-section-title">TOP PREF</span>
          ${debugPrefs.map(p => html`
            <div class="debug-row">
              ${p.name}
              <span class="debug-count">${p.count}</span>
            </div>
          `)}
          
          <span class="debug-section-title" style="margin-top:15px">CITY (${pref})</span>
          ${debugCities.length > 0 
            ? debugCities.map(c => html`
                <div class="debug-row">
                  ${c.name}
                  <span class="debug-count">${c.count}</span>
                </div>
              `)
            : html`<span style="color:#888; font-size:8px">Select Pref</span>`
          }
        </aside>

        <nav class="breadcrumb-nav">
          <a href="/_sandbox/test03">${UI_TEXT.rootLabel}</a>
          ${pref ? html`<span>&gt;</span><a href="/_sandbox/test03?pref=${pref}">${pref}</a>` : ''}
        </nav>

        <div class="search-box">
          <form method="GET" action="/_sandbox/test03">
            <input type="text" name="q" class="search-input" placeholder="検索..." value="${q}">
            <input type="hidden" name="pref" value="${pref}">
          </form>
        </div>

        <header class="status-header">
          <span class="current-loc">${q || city || pref || UI_TEXT.fallbackLocation}</span>
          <span style="font-size:12px; color:var(--text-sub)">${total.toLocaleString()} ${UI_TEXT.unit}</span>
        </header>

        <main>
          <div class="list-section">
            ${results.map(row => html`
              <div class="list-item">
                <div style="flex: 1">
                  <span class="item-title">${row.title}</span>
                  <span class="item-address">${row.address}</span>
                </div>
                <span style="color:var(--border); margin-left:8px">〉</span>
              </div>
            `)}
          </div>
        </main>
      </body>
      </html>
    `);
  } catch (e) {
    return c.text(`Data Access Error: ${e}`);
  }
});
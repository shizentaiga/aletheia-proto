import { Hono } from 'hono'
import { html } from 'hono/html'

type Bindings = { ALETHEIA_PROTO_DB: D1Database }
export const test03 = new Hono<{ Bindings: Bindings }>()

// =============================================================================
// 1. DESIGN TOKENS - デザイナー推奨アップデート案
// =============================================================================
const DESIGN_TOKENS = {
  colors: {
    primary: '#007aff',       
    brand: '#006241',         
    background: '#f8f8fa',    // 清潔感のある明るい背景
    surface: '#ffffff',       
    textPrimary: '#1c1c1e',   
    textSecondary: '#636366', // アクセシビリティに配慮したグレー
    textTertiary: '#acacb0',  
    border: '#e5e5ea',        
    inkWell: '#f2f2f7'        
  },
  typography: {
    display: { size: '22px', weight: '700', spacing: '-0.03em' }, 
    title:   { size: '16px', weight: '600', spacing: '-0.01em' }, 
    body:    { size: '14px', weight: '400', spacing: '0' },       
    caption: { size: '11px', weight: '500', spacing: '0.02em' },  
    lineHeight: '1.6'
  },
  layout: {
    radius: '12px',           
    gutter: '16px'            
  }
};

// =============================================================================
// 2. UI TEXT CONTEXT - 文言・ラベル定義
// =============================================================================
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
  const normalizedFilter = (pref + city).replace(/[\s　]/g, '');

  const tokyoAreaGroups = [
    { label: '都心1', wards: ['千代田区', '中央区', '港区'] },
    { label: '都心2', wards: ['新宿区', '文京区', '渋谷区'] },
    { label: '城東', wards: ['台東区', '墨田区', '江東区', '荒川区', '足立区', '葛飾区', '江戸川区'] },
    { label: '城南', wards: ['品川区', '目黒区', '大田区', '世田谷区'] },
    { label: '城西', wards: ['中野区', '杉並区', '練馬区'] },
    { label: '城北', wards: ['豊島区', '北区', '板橋区'] },
  ];

  try {
    const { total } = await db.prepare(
      `SELECT COUNT(*) as total FROM services WHERE REPLACE(REPLACE(address, ' ', ''), '　', '') LIKE ?`
    ).bind(`${normalizedFilter}%`).first<{ total: number }>() || { total: 0 };

    // 【修正】DBに存在しない b.brand_color を除外
    const { results } = await db.prepare(`
      SELECT 
        s.title, 
        s.address, 
        b.name as brand_name
      FROM services s
      LEFT JOIN brands b ON s.brand_id = b.brand_id
      WHERE REPLACE(REPLACE(s.address, ' ', ''), '　', '') LIKE ? 
      LIMIT 50
    `).bind(`${normalizedFilter}%`).all();

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
            font-family: -apple-system, "Helvetica Neue", sans-serif; 
            margin: 0; background: var(--bg); color: var(--text-main); 
            line-height: ${DESIGN_TOKENS.typography.lineHeight};
            -webkit-font-smoothing: antialiased;
          }
          
          .breadcrumb-nav { background: var(--card); padding: 12px 16px; border-bottom: 0.5px solid var(--border); position: sticky; top: 0; z-index: 100; }
          .breadcrumb-nav a { text-decoration: none; color: var(--primary); font-size: ${DESIGN_TOKENS.typography.caption.size}; }
          .breadcrumb-nav span { color: var(--text-sub); font-size: ${DESIGN_TOKENS.typography.caption.size}; margin: 0 4px; }
          
          .status-header { background: var(--card); padding: 0 16px 12px; border-bottom: 0.5px solid var(--border); }
          .current-loc { 
            font-size: ${DESIGN_TOKENS.typography.display.size}; 
            font-weight: ${DESIGN_TOKENS.typography.display.weight}; 
            letter-spacing: ${DESIGN_TOKENS.typography.display.spacing};
            display: block; margin-bottom: 4px; 
          }
          .hit-count { font-size: ${DESIGN_TOKENS.typography.caption.size}; color: var(--text-sub); }

          .area-selector { padding: 16px; }
          .area-group { margin-bottom: 20px; }
          .group-label { font-size: ${DESIGN_TOKENS.typography.caption.size}; font-weight: bold; color: var(--text-sub); margin-bottom: 8px; display: block; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .grid-item { 
            background: var(--card); border: 0.5px solid var(--border); border-radius: ${DESIGN_TOKENS.layout.radius}; 
            padding: 10px 4px; text-align: center; text-decoration: none; 
            color: var(--text-main); font-size: ${DESIGN_TOKENS.typography.caption.size}; font-weight: 500;
          }
          .grid-item:active { background: var(--active); }

          .list-section { background: var(--card); border-radius: ${DESIGN_TOKENS.layout.radius} ${DESIGN_TOKENS.layout.radius} 0 0; min-height: 400px; padding-top: 8px; }
          .list-item { padding: 12px 16px; border-bottom: 0.5px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
          .item-main { flex: 1; }
          
          .brand-label { font-weight: bold; margin-right: 4px; font-size: 0.9em; }
          
          .item-title { 
            font-weight: ${DESIGN_TOKENS.typography.title.weight}; 
            font-size: ${DESIGN_TOKENS.typography.title.size}; 
            letter-spacing: ${DESIGN_TOKENS.typography.title.spacing};
            display: block; margin-bottom: 2px; 
          }
          .item-address { font-size: ${DESIGN_TOKENS.typography.body.size}; color: var(--text-sub); }
          .chevron { color: var(--border); font-size: 14px; }
          .section-title { padding: 16px 16px 8px; font-size: ${DESIGN_TOKENS.typography.body.size}; font-weight: bold; color: var(--text-sub); }
        </style>
      </head>
      <body>
        <nav class="breadcrumb-nav">
          <a href="/_sandbox/test03">${UI_TEXT.rootLabel}</a>
          <span>&gt;</span>
          <a href="/_sandbox/test03?region=${region}">${region}</a>
          ${pref ? html`<span>&gt;</span><a href="/_sandbox/test03?region=${region}&pref=${pref}">${pref}</a>` : ''}
          ${city ? html`<span>&gt;</span><span style="color:var(--text-main)">${city}</span>` : ''}
        </nav>

        <header class="status-header">
          <span class="current-loc">${city || pref || region || UI_TEXT.fallbackLocation}</span>
          <span class="hit-count">${total.toLocaleString()} ${UI_TEXT.unit}</span>
        </header>

        <main>
          ${!city ? html`
            <div class="area-selector">
              ${!pref ? html`
                <span class="group-label">${UI_TEXT.selectors.prefPrompt}</span>
                <div class="grid">
                  <a href="/_sandbox/test03?region=関東&pref=東京都" class="grid-item">東京都</a>
                  <a href="#" class="grid-item" style="color:var(--border)">神奈川県</a>
                  <a href="#" class="grid-item" style="color:var(--border)">千葉県</a>
                </div>
              ` : html`
                ${tokyoAreaGroups.map(group => html`
                  <div class="area-group">
                    <span class="group-label">${group.label}</span>
                    <div class="grid">
                      ${group.wards.map(ward => html`
                        <a href="/_sandbox/test03?region=${region}&pref=${pref}&city=${ward}" class="grid-item">${ward}</a>
                      `)}
                    </div>
                  </div>
                `)}
              `}
            </div>
          ` : ''}

          <div class="list-section">
            <div class="section-title">
              ${(city || pref || region)} ${UI_TEXT.sectionSuffix}
            </div>
            ${results.length === 0 ? html`<p style="padding:16px; color:var(--text-sub)">${UI_TEXT.emptyLabel}</p>` : ''}
            ${results.map(row => html`
              <div class="list-item">
                <div class="item-main">
                  <span class="item-title">
                    ${row.brand_name ? html`
                      <span class="brand-label" style="color: var(--accent)">
                        ${row.brand_name}
                      </span>
                    ` : ''}
                    ${row.title}
                  </span>
                  <span class="item-address">${row.address}</span>
                </div>
                <span class="chevron">〉</span>
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
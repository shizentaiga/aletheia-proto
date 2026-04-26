/**
 * =============================================================================
 * 【 ALETHEIA - APIハンドラ / ユーティリティ・ロジック 】
 * =============================================================================
 * 役割：
 * 1. エンドポイントごとのビジネスロジック（ハンドラ）の実行
 * 2. Hono Context からのパラメータ抽出および整形
 * 3. 検索結果の表示（フルレンダリング / HTMX部分更新）の判定と出力
 * * 📁 File Path: src/api_handlers.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { getAllAreaStats, fetchCafesByContext } from './db/cafe_queries'
import { Top, CafeList } from './pages/Top' 
import { SearchHeader } from './components/SearchHeader'
import { AUTH_CONFIG, getCurrentUser } from './lib/auth'

/**
 * Cloudflare のコンテキストから位置情報（地理的情報）を抽出する
 * @param c - Hono Context
 * @returns { region, city, colo }
 */
export const getCloudflareLocation = (c: Context) => {
  // c.req.raw を unknown 経由でキャストして型安全にプロパティ参照
  const cf = (c.req.raw as unknown as { cf: any }).cf
  
  return {
    region: cf?.region || 'unknown',
    city: cf?.city || 'unknown',
    colo: cf?.colo || 'unknown'
  }
}

/**
 * URLクエリから検索条件を抽出し、適切な型に整形して返す
 * @param c - Hono Context
 * @returns 検索パラメータオブジェクト
 */
export const getSearchParams = (c: Context) => {
  return {
    keyword: c.req.query('keyword') || '',
    region: c.req.query('region') || '',
    category: c.req.query('category') || '',
    offset: parseInt(c.req.query('offset') || '0', 10),
    detectedRegion: c.req.query('detectedRegion') || ''
  }
}

/**
 * [GET] /
 * トップページの初期表示ハンドラ
 * @param c - Hono Context
 */
export const handleTopPage = async (c: Context) => {
  const db = c.env.ALETHEIA_PROTO_DB
  const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)

  // 1. 位置情報および検索パラメータの取得
  const locationInfo = getCloudflareLocation(c)
  const { keyword, category, offset, region: queryRegion } = getSearchParams(c)

  // 2. エリア判定（指定がなければインフラ層の情報を利用）
  const effectiveRegion = queryRegion || (locationInfo.region !== 'unknown' ? locationInfo.region : '')

  // 3. データの並列取得（ユーザーとカフェ情報を同時フェッチ）
  const [user, cafeResult] = await Promise.all([
    getCurrentUser(db, sessionUserId),
    fetchCafesByContext(db, { 
      keyword, 
      region: effectiveRegion, 
      offset, 
      detectedRegion: locationInfo.region 
    }) 
  ])

  // レンダリング結果を返却
  return c.render(
    <Top 
      user={user} 
      env={c.env} 
      cafes={cafeResult.cafes} 
      totalCount={cafeResult.totalCount}
      location={locationInfo}
      keyword={keyword}
      region={effectiveRegion} 
      category={category}
    />, 
    { title: 'メインポータル' }
  )
}

/**
 * 検索結果の表示ロジック（フルページ / HTMX部分更新）を判定して返す
 * @param c - Hono Context
 * @param params - 抽出された検索パラメータ
 * @param results - DBからの検索結果
 */
export const renderCafeSearchResults = async (
  c: Context, 
  params: ReturnType<typeof getSearchParams>,
  results: Awaited<ReturnType<typeof fetchCafesByContext>>
) => {
  const isHtmx = c.req.header('HX-Request') === 'true'
  const { keyword, region, category, offset, detectedRegion } = params
  const { cafes, totalCount } = results

  // 1. 非HTMXリクエストの場合：フルページを返却
  if (!isHtmx) {
    const sessionUserId = getCookie(c, AUTH_CONFIG.SESSION_COOKIE)
    const user = await getCurrentUser(c.env.ALETHEIA_PROTO_DB, sessionUserId)
    return c.render(
      <Top 
        user={user} env={c.env} cafes={cafes} totalCount={totalCount}
        keyword={keyword} region={region} category={category}
      />,
      { title: '検索結果' }
    )
  }

  // 2. HTMXリクエスト（初期検索）の場合：件数ヘッダーとリストを返却
  if (offset === 0) {
    return c.html(
      <>
        <SearchHeader totalCount={totalCount} />
        <div id="cafe-cards-root">
          <CafeList 
            cafes={cafes} 
            totalCount={totalCount} 
            offset={offset} 
            keyword={keyword} 
            region={region}
            category={category}
            detectedRegion={detectedRegion}
          />
        </div>
      </>
    )
  }

  // 3. HTMXリクエスト（追加読み込み）の場合：リスト断片のみを返却
  return c.html(
    <CafeList 
      cafes={cafes} 
      totalCount={totalCount} 
      offset={offset} 
      keyword={keyword} 
      region={region}
      category={category}
      detectedRegion={detectedRegion}
    />
  )
}

/**
 * [GET] /api/area-stats
 * 市区町村ごとの店舗数統計データを JSON で返却するハンドラ
 * @param c - Hono Context
 */
export const handleAreaStats = async (c: Context) => {
  const db = c.env.ALETHEIA_PROTO_DB
  
  try {
    const stats = await getAllAreaStats(db)
    return c.json({
      success: true,
      data: stats
    })
  } catch (e) {
    console.error('Database fetch error:', e)
    return c.json(
      { 
        success: false, 
        message: 'Failed to fetch area stats' 
      }, 
      500
    )
  }
}
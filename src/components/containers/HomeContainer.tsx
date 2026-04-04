/**
 * =============================================================================
 * 【Aletheia (アレテイア) - ホーム画面・メインコンテナ / HomeContainer.tsx】
 * =============================================================================
 * ■ 設計思想
 * -----------------------------------------------------------------------------
 * 1. 結合層の役割: 
 * index.tsx（司令塔）から注入された DB インスタンスを useCafe フックへ繋ぎ、
 * UI（Component）とロジック（Service/D1）を絶縁・統合します。
 * * 2. 状態管理（State）:
 * 入力フィールドの内容を useState で管理し、ボタンクリック時に検索アクションを
 * トリガーする「標準的な Web インタラクション」を実装します。
 * * 3. 高密度 UI (High-Density List):
 * 情報の優先順位（店名 > 階数・駅文脈）を明確にし、1画面に多くの選択肢を
 * 表示させることで「偶然の発見」を促すデザインを採用しています。
 * -----------------------------------------------------------------------------
 */

/** @jsxImportSource hono/jsx */
import { useState } from 'hono/jsx'
import { useCafe } from '../../hooks/useCafe'

type Props = {
  title: string
  db: D1Database // index.tsx から DI (依存性注入) された DB インスタンス
}

export const HomeContainer = (props: Props) => {
  // --- 1. ロジックの初期化 ---
  /**
   * useCafe フックを通じて、D1 へのアクセス手段と現在の状態（cafes, loading 等）を取得。
   * これにより、コンテナ自体は「SQL」や「fetch」の具体的詳細を知る必要がありません。
   */
  const { cafes, loading, error, searchByArea } = useCafe();
  
  // 検索クエリの初期状態を 'xn76'（東京駅周辺）に設定
  const [query, setQuery] = useState('xn76');

  // --- 2. イベントハンドラー ---
  /**
   * 検索実行アクション
   * 空白を除去したクエリを searchByArea (Hook側) へ引き渡します。
   */
  const handleSearch = () => {
    console.log("🖱️ UI: Search triggered. Query:", query);
    if (query.trim()) {
      searchByArea(query.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* 【1. ヘッダーエリア】
          システムの現在状態（Loading中か否か）を視覚的にフィードバックします。
      */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold tracking-tight text-gray-800">
            {props.title}
          </h1>
          {/* ローディングアニメーション：ユーザーに「処理中」であることを明示 */}
          {loading && (
            <span className="text-xs text-blue-500 animate-pulse font-medium">
              Searching...
            </span>
          )}
        </div>
      </header>

      {/* 【2. メインコンテンツエリア】 */}
      <main className="container mx-auto p-4 space-y-6 max-w-2xl">
        
        {/* [検索入力セクション] */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">
            Location Search (Geohash)
          </label>
          
          <div className="flex gap-2">
            {/* サーチボックス本体
                onInput により、1文字入力ごとに状態を同期。
            */}
            <input 
              type="text" 
              value={query}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
              placeholder="e.g. xn76, xn77"
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            
            {/* 検索実行ボタン */}
            <button 
              onClick={handleSearch}
              disabled={loading}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                loading 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              }`}
            >
              検索
            </button>
          </div>

          {/* クイックチップ：UX向上のためのショートカット */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            <span className="text-[10px] text-gray-400 self-center mr-1">Quick:</span>
            <button onClick={() => { setQuery('xn76'); searchByArea('xn76'); }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-[10px] text-gray-600 transition-colors">東京 (xn76)</button>
            <button onClick={() => { setQuery('xn775v'); searchByArea('xn775v'); }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-[10px] text-gray-600 transition-colors">田端 (xn775v)</button>
            <button onClick={() => { setQuery('xn77ey'); searchByArea('xn77ey'); }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-[10px] text-gray-600 transition-colors">小岩 (xn77ey)</button>
          </div>

          {/* エラー表示エリア */}
          {error && (
            <div className="mt-3 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
              {error.message}
            </div>
          )}
        </section>

        {/* [リスト表示セクション] */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-tight">Results / 検索結果</h2>
            <span className="text-[10px] font-mono bg-white px-2 py-0.5 border border-gray-100 rounded text-gray-400">
              {cafes.length} Hits
            </span>
          </div>
          
          <div className="divide-y divide-gray-100">
            {/* 検索結果のレンダリング */}
            {cafes.map((cafe) => (
              <div 
                key={cafe.id} 
                className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center group transition-all"
              >
                <div className="flex flex-col">
                  {/* タイトル：高密度リストの中でも際立つよう太字に設定 */}
                  <span className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {cafe.title}
                  </span>
                  
                  {/* メタ情報（階数・駅コンテキスト） */}
                  <div className="flex items-center gap-2 mt-1.5">
                    {cafe.floor_info && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 bg-gray-800 text-white rounded shadow-sm">
                        {cafe.floor_info}
                      </span>
                    )}
                    {cafe.station_context && (
                      <span className="text-[10px] text-gray-500 flex items-center">
                        <span className="text-gray-300 mr-1">|</span> {cafe.station_context}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* 矢印アイコン：詳細画面への誘導（アフォーダンス） */}
                <div className="text-gray-200 group-hover:text-blue-300 transform group-hover:translate-x-1 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            ))}

            {/* 0件ヒット時のプレースホルダー */}
            {!loading && cafes.length === 0 && (
              <div className="p-12 text-center bg-gray-50/30">
                <div className="text-gray-200 mb-3 flex justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  検索キーを入力してください。<br/>
                  <span className="text-[10px]">（例: xn76... 東京, xn77... 田端/小岩）</span>
                </p>
              </div>
            )}
          </div>
        </section>
        
      </main>

      {/* 【3. フッターエリア】 */}
      <footer className="py-10 text-center">
        <p className="text-[10px] text-gray-300 tracking-widest uppercase">
          © 2026 Aletheia Project / Zen-yu
        </p>
      </footer>

    </div>
  )
}
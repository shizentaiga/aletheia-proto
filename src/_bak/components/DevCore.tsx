/** @jsxImportSource hono/jsx */

/**
 * 【DevCore：アプリケーションの動的エリア】
 * このコンポーネントは、ユーザーが直接操作する「検索・表示・予約」の核となる部分です。
 * 見た目の骨組み（HTML）だけを提供し、実際の動きは末尾の script で読み込む JS が担当します。
 */
export const DevCore = () => (
  <>
    {/* --- 1. 検索バーエリア --- 
        ★ここにあった <section class="search-hero-stable">... </section> を丸ごと削除します。
        検索窓は Hero.tsx が担当するようになったためです。
    */}
    
    {/* --- 2. 動的表示エリア ---
        役割：検索結果やカレンダーなど、状況に応じて中身が書き換わる「箱」です。
    */}
    <div id="development-core">
      
      {/* 2-1. 絞り込みチップ（条件選択）
          ID: 'location-chips', 'category-chips'
          役割：場所やカテゴリーをボタン形式で選択。JSが reserve.json から項目を生成します。
      */}
      <div id="filter-section">
        <span style="font-size:0.75rem; font-weight:bold; color:var(--text-sub);">📍 条件で絞り込む</span>
        <div class="chip-flex" id="location-chips"></div>
        <div class="chip-flex" id="category-chips" style="margin-top:15px; display:none;"></div>
      </div>

      {/* 2-2. サービス一覧表示
          ID: 'service-list'
          役割：検索にヒットしたサービスをカード形式で表示します。初期状態はスッキリ見せるため非表示（none）です。
      */}
      <div id="service-list" style="display:none; margin-top:20px;">
        <div id="service-items"></div>
      </div>

      {/* 2-3. カレンダー・予約詳細表示
          ID: 'reservation-view'
          役割：特定のサービスを選択した際、カレンダーや予約フォームをここに展開します。
      */}
      <div id="reservation-view" style="display:none; margin-top:20px;"></div>
      
    </div>

    {/* --- 3. 命を吹き込むロジック ---
        役割：上記の各IDに対して、データの流し込みやクリック時の反応を定義している外部JSを読み込みます。
    */}
    <script src="/client-logic.js"></script>
  </>
)
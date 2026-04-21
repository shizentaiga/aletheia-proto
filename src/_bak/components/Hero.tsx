/** @jsxImportSource hono/jsx */

/**
 * 【Heroコンポーネント：検索の入り口】
 * ユーザーが最初に目にする検索窓（ヒーローセクション）を定義します。
 * DevCoreから分離することで、検索窓のデザインだけを変更したい場合に
 * 他の機能（カレンダー等）を汚さずに修正が可能になります。
 */
export const Hero = () => (
  <section class="search-hero-stable">
    {/* 【入力フォーム】
      id="keyword-search": JSがこのIDを監視し、入力された文字でサービスを絞り込みます。
      class="search-input-stable": style.css で定義された入力欄の見た目を適用します。
    */}
    <input 
      type="text" 
      id="keyword-search" 
      class="search-input-stable" 
      placeholder="キーワード検索" 
    />
  </section>
)
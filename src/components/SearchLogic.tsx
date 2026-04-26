/**
 * 検索画面のフロントエンドロジック（JavaScript）をHTMLへ注入するコンポーネント
 * * このコンポーネントは、サーバーサイドで定義されたマスターデータや定数を
 * クライアントサイドの実行スクリプト（getSearchScripts）へ流し込み、
 * ブラウザ上で動作する <script> タグとしてレンダリングします。
 * * 📁 File Path: src/components/SearchLogic.tsx
 */

/** @jsxImportSource hono/jsx */
import { SEARCH_MASTER, UI_TEXT, PREFECTURE_MASTER } from '../lib/constants'
import { getSearchScripts } from './SearchScripts'

export const SearchLogic = () => {
  /**
   * getSearchScripts は、ブラウザで実行される生の JavaScript 文字列を返します。
   * 引数としてサーバーサイドの定数を渡すことで、
   * クライアント側でも同じ定義（エリア構造、テキスト等）を参照可能にします。
   */
  const scriptContent = getSearchScripts(
    SEARCH_MASTER,    // エリアやカテゴリの階層構造データ
    UI_TEXT,          // ボタン名やラベルなどのUI文言
    PREFECTURE_MASTER // 都道府県コードと名称の変換マップ
  );

  /**
   * dangerouslySetInnerHTML を使用して、生成したスクリプト文字列を
   * エスケープせずにそのまま <script> タグ内に配置します。
   */
  return (
    <script dangerouslySetInnerHTML={{ __html: scriptContent }} />
  );
};
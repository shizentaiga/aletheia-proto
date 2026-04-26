/** @jsxImportSource hono/jsx */
import { SPACE } from '../styles/theme'
import { PAGE_DESIGN } from '../pages/Top/TopPage'

interface SearchHeaderProps {
  /** 検索にヒットした合計件数 */
  totalCount: number;
}

/**
 * 検索結果一覧の上部に表示されるヘッダーコンポーネント
 * 「検索結果 全◯件」というタイトルと件数表示を担当
 */
export const SearchHeader = ({ totalCount }: SearchHeaderProps) => {
  return (
    <div 
      id="list-header" 
      style={{ 
        display: 'flex',             // タイトルと（将来的な）ソートボタン等を横並びに
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: SPACE.SM       // 下方向の余白（themeから取得）
      }}
    >
      <h2 
        style={{ 
          // ページ共通のデザイン定義（PAGE_DESIGN）を適用
          fontSize: PAGE_DESIGN.SECTION_TITLE.FONT_SIZE, 
          color: PAGE_DESIGN.SECTION_TITLE.COLOR, 
          fontWeight: PAGE_DESIGN.SECTION_TITLE.WEIGHT 
        }}
      >
        検索結果 
        <span 
          style={{ 
            // 「◯件」の部分のみ色や太さを変えて強調
            color: PAGE_DESIGN.COUNTER.COLOR, 
            fontWeight: PAGE_DESIGN.COUNTER.WEIGHT, 
            marginLeft: SPACE.XS     // 「検索結果」との間隔
          }}
        >
          全 {totalCount} 件
        </span>
      </h2>
    </div>
  )
}
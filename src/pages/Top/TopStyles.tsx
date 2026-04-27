/**
 * =============================================================================
 * 【 ALETHEIA - メインポータル・ビュー / TopStyles.tsx 】
 * =============================================================================
 * 役割：TopPage 専用の CSS スタイル定義を管理します。
 * 📁 File Path: src/pages/Top/TopStyles.tsx
 * =============================================================================
 */

/** @jsxImportSource hono/jsx */
import { SPACE } from '../../styles/theme'

/**
 * TopPage 内部で使用される CSS スタイルコンポーネント
 */
export const TopStyles = () => (
  <style>{`
    /* ドリルダウンメニュー項目 */
    .drilldown-item { 
      padding: ${SPACE.MD}; 
      border-bottom: 1px solid #f5f5f5; 
      cursor: pointer; 
      display: flex; 
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }
    .drilldown-item:active { background: #f9f9f9; }
    
    /* サブメニュー（市区町村等） */
    .sub-menu { 
      display: none; 
      background: #fafafa; 
    }
    .sub-menu.show { display: block; }
    
    /* サブメニュー項目 */
    .sub-item { 
      padding: ${SPACE.SM} ${SPACE.MD} ${SPACE.SM} ${SPACE.LG}; 
      border-bottom: 1px dotted #eee;
      font-size: 0.85rem;
      color: #555;
    }
    .sub-item:active { background: #f0f0f0; }

    /* アイコン・矢印アニメーション */
    .arrow { font-size: 0.6rem; color: #ccc; transition: transform 0.2s; }
    .arrow.open { transform: rotate(90deg); }

    /* 検索条件解除用のチップ・ボタン */
    .filter-chip { 
      display: inline-flex; 
      align-items: center; 
      background: #e8f0fe; 
      color: #4285F4;
      padding: 4px 12px; 
      border-radius: 999px; 
      font-size: 0.75rem; 
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s;
      user-select: none;
    }
    .filter-chip:hover {
      background: #d2e3fc;
    }
    .filter-chip:active {
      transform: scale(0.96);
    }
  `}</style>
)
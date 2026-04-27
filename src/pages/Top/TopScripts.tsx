/** @jsxImportSource hono/jsx */

/**
 * HTMXとUIの同期、および初期化用スクリプト
 */
export const TopScripts = () => (
  <script dangerouslySetInnerHTML={{ __html: `
    (function() {
      const sync = () => {
        if (window.syncUIFromData) {
          window.syncUIFromData();
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', sync);
      } else {
        sync();
      }

      document.addEventListener('htmx:afterSettle', sync);
    })();
  `}} />
);
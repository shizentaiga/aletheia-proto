/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'

type Bindings = { aletheia_db: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

// --- [A] サーバーサイド：API窓口（DBを叩いてJSONを返すだけ） ---
app.get('/api/test', async (c) => {
  const prefix = c.req.query('q') || 'xn76';
  // 複雑なService層を通さず、ここで直接SQLを実行
  const { results } = await c.env.aletheia_db
    .prepare("SELECT title FROM Services WHERE geohash LIKE ? LIMIT 5")
    .bind(`${prefix}%`)
    .all();
  
  return c.json(results);
});

// --- [B] クライアントサイド：最小限のHTMLと「生」のJavaScript ---
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head><title>Simple Test</title></head>
      <body>
        <h1>Aletheia 疎通テスト</h1>
        <input type="text" id="q" placeholder="xn76" value="xn76">
        <button id="btn">DB検索実行</button>
        
        <pre id="out">ここに結果が出ます</pre>

        <script>
          // ReactやHono/JSXのHookを使わず、ブラウザ標準のJSで動かす
          document.getElementById('btn').onclick = async () => {
            const q = document.getElementById('q').value;
            document.getElementById('out').innerText = '通信中...';
            
            try {
              // サーバーの [A] エンドポイントを叩く
              const res = await fetch('/api/test?q=' + q);
              const data = await res.json();
              document.getElementById('out').innerText = JSON.stringify(data, null, 2);
            } catch (e) {
              document.getElementById('out').innerText = 'エラー: ' + e.message;
            }
          };
        </script>
      </body>
    </html>
  `);
});

export default app
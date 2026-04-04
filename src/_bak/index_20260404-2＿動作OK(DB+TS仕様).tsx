/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'

// --- [1. 型定義 (TypeScriptの真骨頂)] ---
// DBから返ってくるデータの形を定義し、スペルミスを防ぎます。
type CafeResult = {
  title: string;
  station_context?: string;
};

type Bindings = {
  aletheia_db: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// --- [2. サーバー側：APIエンドポイント] ---
// ここは TypeScript がフルに機能し、DB操作を型安全に行います。
app.get('/api/search', async (c) => {
  const q = c.req.query('q') || 'xn76';
  
  try {
    const { results } = await c.env.aletheia_db
      .prepare("SELECT title, station_context FROM Services WHERE geohash LIKE ? LIMIT 10")
      .bind(`${q}%`)
      .all<CafeResult>(); // ここで型を適用

    return c.json(results);
  } catch (e) {
    return c.json({ error: "DB Access Error" }, 500);
  }
});

// --- [3. クライアント側：UI & 制御スクリプト] ---
app.get('/', (c) => {
  return c.html(
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <title>Aletheia - 疎通確認済みモデル</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-50 p-8">
        <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md">
          <h1 className="text-xl font-bold mb-4">Aletheia 検索テスト</h1>
          
          <div className="flex gap-2 mb-6">
            <input 
              id="search-input"
              type="text" 
              defaultValue="xn76"
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Geohashを入力"
            />
            <button 
              id="search-btn"
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700"
            >
              検索実行
            </button>
          </div>

          <div id="result-area" className="space-y-2 text-sm text-gray-600">
            {/* ここに結果が流し込まれます */}
            <p className="text-gray-400">検索ボタンを押してください</p>
          </div>
        </div>

        {/* 【核心】ブラウザで確実に動かすためのブリッジコード 
          複雑なビルド設定を通さず、ブラウザに直接「動く命令」を届けます。
        */}
        <script dangerouslySetInnerHTML={{ __html: `
          const btn = document.getElementById('search-btn');
          const input = document.getElementById('search-input');
          const area = document.getElementById('result-area');

          btn.onclick = async () => {
            const query = input.value;
            area.innerHTML = '<p className="animate-pulse">通信中...</p>';
            
            try {
              const res = await fetch('/api/search?q=' + query);
              const data = await res.json();
              
              if (data.length === 0) {
                area.innerHTML = '<p>データが見つかりませんでした</p>';
                return;
              }

              area.innerHTML = data.map(item => \`
                <div class="p-2 border-b border-gray-100">
                  <div class="font-bold text-gray-800">\${item.title}</div>
                  <div class="text-xs text-gray-400">\${item.station_context || ''}</div>
                </div>
              \`).join('');
              
            } catch (e) {
              area.innerHTML = '<p class="text-red-500">エラーが発生しました</p>';
            }
          };
        `}} />
      </body>
    </html>
  )
})

export default app
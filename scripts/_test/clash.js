import 'dotenv/config'; // .dev.vars を読み込む (中身が env 形式の場合)
import { config } from 'dotenv';

// .dev.vars を明示的に指定して読み込み
config({ path: '.dev.vars' });

async function testClashAPI() {
  const API_KEY = process.env.SUPERCELL_API_KEY;
  const url = 'https://api.clashroyale.com/v1/clans?name=Japan&limit=1';

  console.log('--- APIリクエスト開始 ---');

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTPエラー: ${res.status}`);
    }

    const data = await res.json();
    
    // 結果をターミナルに整形して出力
    console.log('取得成功！');
    console.dir(data, { depth: null, colors: true });

  } catch (error) {
    console.error('エラーが発生しました:', error.message);
  }
}

testClashAPI();
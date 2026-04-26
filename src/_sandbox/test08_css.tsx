import { Hono } from 'hono'
import { html } from 'hono/html'

export const test08 = new Hono()

test08.get('/', (c) => {
  return c.html(html`
    <style>
      /* 強力なCSS干渉を模したスタイル */
      #target-box { display: none !important; background: red; color: white; padding: 20px; }
      .normal-box { display: none; background: blue; color: white; padding: 20px; }
    </style>

    <h3>1. 通常のJS操作（上書き可能）</h3>
    <div id="blue-box" class="normal-box">成功：青い箱が表示されました</div>
    <button onclick="document.getElementById('blue-box').style.display='block'">通常表示</button>

    <hr>

    <h3>2. CSS干渉パターン（!importantに負ける例）</h3>
    <div id="target-box">失敗：赤い箱は見えません</div>
    <button onclick="document.getElementById('target-box').style.display='block'">通常命令（失敗する）</button>
    <button onclick="document.getElementById('target-box').style.setProperty('display', 'block', 'important')">!important命令（成功する）</button>

    <script>
      console.log("Sandbox Loaded");
    </script>
  `)
})
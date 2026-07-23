const r=`\r
\r
\r
\r
[TOC]\r
\r
\r
\r
# Frontend-HTML\r
\r
## background\r
\r
\`\`\`html\r
<!DOCTYPE html>\r
<html lang="zh-CN">\r
  <head>\r
    <meta charset="UTF-8">\r
    <title>我的第一个网页</title>\r
  </head>\r
  <body>\r
    <h1>你好，互联网</h1>\r
    <p>这是我的第一个网页，现在它还只是一个本地的 HTML 文件。</p>\r
  </body>\r
</html>\r
\r
\`\`\`\r
\r
<img src="/person_blog/notes-images/frontend-html-structure.svg" alt="Frontend HTML 基础结构示意图" style="max-width: 100%;" />\r
\r
## HTML basic grammar\r
\r
### <> tag 标签\r
\r
\`\`\`html\r
<html lang="zh-CN">\r
lang标签的属性 language\r
\`\`\`\r
\r
<head> 与 </head> 之间放的是辕信息，不会直接显示在页面上\r
\r
<body> 与 </body> 标签里面的内容是页面的身体，会显示\r
\r
\r
\r
\r
\r
## add CSS\r
\r
<style> 与 </style> 之间的代码格式叫做CSS 修改格式\r
\r
\`\`\`css\r
    <style>\r
      body {\r
        background-color: #f0f4f8;\r
        display: flex;\r
        justify-content: center;\r
        align-items: center;\r
        height: 100vh;\r
        margin: 0;\r
        font-family: sans-serif;\r
      }\r
\r
      .card {\r
        background: white;\r
        padding: 40px;\r
        border-radius: 12px;\r
        text-align: center;\r
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);\r
      }\r
\r
      h1 {\r
        color: #2c3e50;\r
        margin-bottom: 12px;\r
      }\r
\r
      p {\r
        color: #666;\r
      }\r
\r
      button {\r
        margin-top: 20px;\r
        padding: 10px 24px;\r
        background-color: #3498db;\r
        color: white;\r
        border: none;\r
        border-radius: 6px;\r
        cursor: pointer;\r
        font-size: 16px;\r
      }\r
\r
      button:hover {\r
        background-color: #2980b9;\r
      }\r
    </style>\r
\r
\`\`\`\r
\r
将他放到原来html代码的title的下面一行\r
添加绑定容器\r
\r
\`\`\`html\r
  <body>\r
    <div class="card">\r
      <h1>你好，互联网</h1>\r
      <p>这是我的第一个网页，现在它有了一点样式。</p>\r
    </div>\r
  </body>\r
\r
\`\`\`\r
\r
浏览器 \`<div>\` 标签是 \`card\` 类，用 css 里面的 \`.card\` 样式定义来显示页面。\r
\r
<img src="/person_blog/notes-images/frontend-html-structure.svg" alt="HTML 与 CSS 页面结构示意图" style="max-width: 100%;" />\r
\r
\r
\r
\r
\r
## JavaScript\r
\r
add button\r
\r
先添加按钮 在加入一段脚本\r
\r
\`\`\`html\r
  <body>\r
    <div class="card">\r
      <h1>你好，互联网</h1>\r
      <p id="msg">这是我的第一个网页，现在它有了一点样式。</p>\r
      <button onclick="changeText()">点我试试</button>  \r
    </div>\r
    <script>\r
      function changeText() {\r
        document.getElementById('msg').textContent = '你刚刚触发了一段 JavaScript。';\r
      }\r
    <\/script>\r
  </body>\r
\r
\`\`\`\r
\r
\r
\r
## 三层分工\r
\r
- HTML	\`<body>\` 里的标签	内容和结构：页面上有什么东西，怎么组织\r
- CSS      <style> 块         样式和外观：这些东西长什么样\r
- JavaScript <script> 块      行为和交互：发生了什么事，应该做什么\r
\r
\r
\r
### 拆分3层分工\r
\r
#### **\`style.css\`**\r
\r
**把 \`index.html\` 里 \`<style>\` 标签之间的内容，完整复制到 \`style.css\` 里：**然后，回到 \`index.html\`，把整个 \`<style>...</style>\` 块删掉，替换成下面这一行，放在同样的位置（\`</head>\` 之前）：\r
\r
\`\`\`css\r
    <link rel="stylesheet" href="style.css">\r
\r
\`\`\`\r
\r
\`href\` 是文件路径，\`style.css\` 没有任何斜杠前缀\r
\r
\r
\r
#### JavaScript .js\r
\r
**新建一个文件，命名为 \`script.js\`：**\r
\r
**把 \`index.html\` 里 \`<script>\` 标签之间的内容，复制到 \`script.js\` 里：**\r
\r
\`script.js\` 里的内容应该是这样的：\r
\r
\`\`\`javascript\r
function changeText() {\r
  document.getElementById('msg').textContent = '你刚刚触发了一段 JavaScript。';\r
}\r
\r
\`\`\`\r
\r
然后回到 \`index.html\`，把整个 \`<script>...<\/script>\` 块删掉，替换成：\r
\r
\`\`\`html\r
    <script src="script.js"><\/script>\r
\r
\`\`\`\r
\r
去引入一个脚本文件，文件名叫 \`script.js\`，它在同一个文件夹里。\r
`;export{r as default};

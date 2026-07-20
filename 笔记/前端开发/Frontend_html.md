



[TOC]



# Frontend-HTML

## background

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <title>我的第一个网页</title>
  </head>
  <body>
    <h1>你好，互联网</h1>
    <p>这是我的第一个网页，现在它还只是一个本地的 HTML 文件。</p>
  </body>
</html>

```

<img src="/person_blog/notes-images/frontend-html-structure.svg" alt="Frontend HTML 基础结构示意图" style="max-width: 100%;" />

## HTML basic grammar

### <> tag 标签

```html
<html lang="zh-CN">
lang标签的属性 language
```

<head> 与 </head> 之间放的是辕信息，不会直接显示在页面上

<body> 与 </body> 标签里面的内容是页面的身体，会显示





## add CSS

<style> 与 </style> 之间的代码格式叫做CSS 修改格式

```css
    <style>
      body {
        background-color: #f0f4f8;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        font-family: sans-serif;
      }

      .card {
        background: white;
        padding: 40px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      h1 {
        color: #2c3e50;
        margin-bottom: 12px;
      }

      p {
        color: #666;
      }

      button {
        margin-top: 20px;
        padding: 10px 24px;
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
      }

      button:hover {
        background-color: #2980b9;
      }
    </style>

```

将他放到原来html代码的title的下面一行
添加绑定容器

```html
  <body>
    <div class="card">
      <h1>你好，互联网</h1>
      <p>这是我的第一个网页，现在它有了一点样式。</p>
    </div>
  </body>

```

浏览器 `<div>` 标签是 `card` 类，用 css 里面的 `.card` 样式定义来显示页面。

<img src="/person_blog/notes-images/frontend-html-structure.svg" alt="HTML 与 CSS 页面结构示意图" style="max-width: 100%;" />





## JavaScript

add button

先添加按钮 在加入一段脚本

```html
  <body>
    <div class="card">
      <h1>你好，互联网</h1>
      <p id="msg">这是我的第一个网页，现在它有了一点样式。</p>
      <button onclick="changeText()">点我试试</button>  
    </div>
    <script>
      function changeText() {
        document.getElementById('msg').textContent = '你刚刚触发了一段 JavaScript。';
      }
    </script>
  </body>

```



## 三层分工

- HTML	`<body>` 里的标签	内容和结构：页面上有什么东西，怎么组织
- CSS      <style> 块         样式和外观：这些东西长什么样
- JavaScript <script> 块      行为和交互：发生了什么事，应该做什么



### 拆分3层分工

#### **`style.css`**

**把 `index.html` 里 `<style>` 标签之间的内容，完整复制到 `style.css` 里：**然后，回到 `index.html`，把整个 `<style>...</style>` 块删掉，替换成下面这一行，放在同样的位置（`</head>` 之前）：

```css
    <link rel="stylesheet" href="style.css">

```

`href` 是文件路径，`style.css` 没有任何斜杠前缀



#### JavaScript .js

**新建一个文件，命名为 `script.js`：**

**把 `index.html` 里 `<script>` 标签之间的内容，复制到 `script.js` 里：**

`script.js` 里的内容应该是这样的：

```javascript
function changeText() {
  document.getElementById('msg').textContent = '你刚刚触发了一段 JavaScript。';
}

```

然后回到 `index.html`，把整个 `<script>...</script>` 块删掉，替换成：

```html
    <script src="script.js"></script>

```

去引入一个脚本文件，文件名叫 `script.js`，它在同一个文件夹里。

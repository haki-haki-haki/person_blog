# React 框架

构建工具，类似一种翻译的功能，让写的代码翻译成浏览器认识的样子

---

既然构建工具能翻译，那我们是不是可以不再老老实实手写浏览器那套底层 HTML、CSS、JavaScript，而是发明一套写起来更舒服、更高效的新规则？

---

一套前端开发的规则，React（其中的一种），再给构建工具翻译给浏览器运行



## React

国内流行Vue，React和Vue都是前端框架，用组件组织页面，有些许不同。React生态大。

React是一个前端框架，管理UI组件。

核心规则：把一块界面定义成一个组件。

- 数据
- 结构
- 样式
- 行为

组件可以组合，嵌套，小组件合成大组件，大组件拼装成页面，页面被总组件管理。

再次之前是按照文件类型区分不同的功能（HTML结构，CSS样式，JS行为），React管理的则是组件。



Vanilla

没有框架的原生写法，原意“香草”

不依赖React，Vue前端框架，只使用浏览器原生支持的HTML，CSS,JavaScript来构建页面。

本质上浏览器无法直接运行React，只能识别HTML,CSS,JavaScript，React还得依靠构建工具，



## 安装进项目

```powershell
npm install react react-dom
```

- `react`：React 本身
- `react-dom`：让 React 能把组件渲染到网页 DOM 上

插件：帮助Vite翻译React

```powershell
npm install -D @vitejs/plugin-react
```

在项目种新建vite.config.js

```powershell
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});

```

复制进去

作用：将React插件挂在Vite上面。



示例代码

```powershell
git clone https://github.com/joylibo/zero-to-tech-demos.git
cd zero-to-tech-demos/zero-to-tech-4-3
```



## 改成React组件

以下是单个页面改造成React的组件

先启动

```powershell
cd ~/zero-to-tech
npm run dev
```

`src/components/`，就先新建这个目录

从 demo 里把 `ResultCard.jsx` 拷到你的项目

`ResultCard.jsx` 是组件本身。它定义了这张卡片是什么、长什么样、挂载后做什么动画。

但组件文件自己不会自动出现在页面上。要把它放到页面里，还需要一个入口文件。



新建入口文件

```powershell
src/result.jsx
```

写入

```powershell
import { createRoot } from "react-dom/client";
import ResultCard from "./components/ResultCard.jsx";

createRoot(document.getElementById("result-root")).render(<ResultCard />);
```

1. 把 React 的 `createRoot` 引进来。

2. 把 `ResultCard` 组件引进来。

3. 找到页面上 `id="result-root"` 的位置。

4. 把 `ResultCard` 渲染进去。

   组件负责：是什么				入口负责：挂载在哪里

 在 `text-lab.html` 里留出挂载点  也就是在你之前原本的html那里

找到原来结果区那整段 `<article>`，把它删掉，换成：

```powershell
<div id="result-root" class="panel-half"></div>
```

然后在页面底部保留原来的 `js/main.js`，再新加一行：

```powershell
<script type="module" src="js/main.js"></script>
<script type="module" src="/src/result.jsx"></script>
```

挂载点上要保留 `class="panel-half"`

因为页面外层是 CSS Grid 布局，`.panel-half` 决定这一格占半宽。React 组件虽然内部也能写 class，但 CSS Grid 只会对直接子元素生效。

- `#result-root` 负责在原页面里占位置。
- `ResultCard` 负责画出真正的卡片

此时这个页面就框架化了

```powershell
npm run dev

```

可运行



### ResultCard：一个完整的 UI 零件

打开你刚拷进来的 `src/components/ResultCard.jsx`

```c
import { useEffect, useRef } from "react";
import { animate, scrambleText } from "animejs";

export default function ResultCard() {
  const cardRef = useRef(null);
  const scoreRef = useRef(null);

  useEffect(() => {
    // 卡片自己淡入：.card 默认 opacity:0，这张卡负责把自己显出来
    animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 700,
      ease: "outBack",
    });
    // 情感分数滚动归位
    animate(scoreRef.current, {
      innerHTML: scrambleText({ chars: "0-9" }),
      duration: 1500,
    });
  }, []);

  return (
    <article ref={cardRef} className="panel panel-half lab-panel result-panel card">
      <div className="panel-heading">
        <p className="section-kicker">结果区</p>
        <h3>分析结果</h3>
      </div>
      <div className="result-stack">
        <div className="result-item">
          <span>原文</span>
          <p>今天的风很轻，适合把脑海里的想法慢慢写下来。</p>
        </div>
        <div className="result-item">
          <span>拼音</span>
          <p>jīn tiān de fēng hěn qīng …</p>
        </div>
        <div className="result-grid">
          <div className="result-badge">
            <span>情感分数</span>
            <strong data-score ref={scoreRef}>0.86</strong>
          </div>
          <div className="result-badge">
            <span>情感判断</span>
            <strong>偏积极</strong>
          </div>
        </div>
      </div>
    </article>
  );
}

```

- `import`：这个组件需要什么，就自己引进来。这里引进了 React 的工具，也引进了 anime.js。
- `export default`：把这个组件交出去，让别的文件可以使用它。
- `function ResultCard()`：React 组件本质上就是一个函数。
- `return (...)`：函数返回一段长得像 HTML 的东西，这种写法叫 JSX。
- `className`：在 JSX 里，HTML 的 `class` 要写成 `className`。
- `useEffect`：组件出现在页面上后，执行一次动画逻辑。
- `ref`：拿到真实 DOM 节点，交给 anime.js 做动画。

这一张卡片里面，已经同时包含了：

- 数据：原文、拼音、情感分数、情感判断。
- 结构：`return` 里的标签层级。
- 样式：`className` 指向外部 CSS 里已有的样式规则。
- 行为：`useEffect` 里的淡入和数字滚动动画。

---

**一个组件，就是把“数据、结构、样式、行为”这一整套，封装成一个能独立拎走的 UI 单元**



## 修改整个页面为React

拷入页面相关组件

```powershell
src/components/Nav.jsx
src/components/PageHeading.jsx
src/components/InputCard.jsx
src/components/AnimatedCardGrid.jsx
src/components/TextLabPage.jsx

```

把原来那 8 个 CSS 文件拷到：src/css/

接下来 `text-lab.html` 会退化成一个挂载点，不再负责用 `<link>` 引入样式。样式会改由 React 入口文件 `import` 进来。



换掉临时入口

新建src/textlab.jsx

```powershell
import { createRoot } from "react-dom/client";
import TextLabPage from "./components/TextLabPage.jsx";

import "./css/reset.css";
import "./css/variables.css";
import "./css/layout.css";
import "./css/hero.css";
import "./css/nav.css";
import "./css/cards.css";
import "./css/lab.css";
import "./css/responsive.css";

createRoot(document.getElementById("root")).render(
  <div className="app-shell">
    <div className="page-shell">
      <main className="page-content">
        <TextLabPage current="textlab" onNavigate={() => {}} />
      </main>
    </div>
  </div>,
);

```

这里的 `app-shell / page-shell / page-content` 是页面外壳，负责背景、最大宽度、左右留白。



清空 `text-lab.html`

把 `text-lab.html` 的 `<body>` 整块内容，连同底部 script，都换成：

```powershell
<body>
  <div id="root"></div>
  <script type="module" src="/src/textlab.jsx"></script>
</body>

```

`<head>` 里那些 CSS `<link>` 也可以删掉，因为 CSS 已经由 `src/textlab.jsx` 引入。



**HTML 从“页面主体”，退化成了“一个挂载点”。**

原来整页内容都写在 HTML 里。现在 HTML 只留一块空地，真正的页面由 React 画出来



 看懂 `TextLabPage`：组件可以嵌套组件

```powershell
import Nav from "./Nav.jsx";
import PageHeading from "./PageHeading.jsx";
import AnimatedCardGrid from "./AnimatedCardGrid.jsx";
import InputCard from "./InputCard.jsx";
import ResultCard from "./ResultCard.jsx";

export default function TextLabPage({ current, onNavigate }) {
  return (
    <AnimatedCardGrid className="dashboard-grid">
      <article className="hero-stage panel-full">
        <Nav current={current} onNavigate={onNavigate} />
        <PageHeading title="文字实验室" subtitle="拼音和情绪，挖掘中文里的细节" />
      </article>

      <InputCard />
      <ResultCard />
    </AnimatedCardGrid>
  );
}

```

 大写开头的是组件，小写开头的是 HTML 标签

`<Nav />`、`<PageHeading />`、`<InputCard />`、`<ResultCard />` 都是我们自己定义的 React 组件。

`<article>` 是普通 HTML 标签。

**组件名必须大写开头。**



- 小写开头：当成浏览器原生 HTML 标签。
- 大写开头：当成你自己定义的 React 组件。



 组件挂到 HTML，需要入口；组件放进组件，只要写标签

在 `TextLabPage` 里使用 `ResultCard`，只需要：

```powershell
<ResultCard />
```

- 挂到 HTML：这是 React 世界和真实 DOM 世界的交界，需要 `createRoot`。
- 放进另一个组件：还在 React 世界内部，写成标签就行

将个人主页也处理交给React  拷贝src/components/HomePage.jsx



将两个页面收录进App

当前有两个页面组件

- `HomePage`
- `TextLabPage`

将其弄成一个大组件

App

新建 写入

```powershell
import { useState } from "react";
import HomePage from "./components/HomePage.jsx";
import TextLabPage from "./components/TextLabPage.jsx";

export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div className="app-shell">
      <div className="page-shell">
        <main className="page-content">
          {page === "home"
            ? <HomePage current={page} onNavigate={setPage} />
            : <TextLabPage current={page} onNavigate={setPage} />}
        </main>
      </div>
    </div>
  );
}

```

`App` 是整个项目的总管。

它负责记住当前显示哪一页：是 `HomePage`，还是 `TextLabPage`。



旧项目的两个html可以直接删除

- 旧 `index.html` 原来装的是个人主页内容。
- `text-lab.html` 原来装的是文字实验室内容

因为已经搬进去React组件了



需要新建一个html来挂载  

但是需要先新建main.JSX 写入

```powershell
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

import "./css/reset.css";
import "./css/variables.css";
import "./css/layout.css";
import "./css/hero.css";
import "./css/nav.css";
import "./css/cards.css";
import "./css/lab.css";
import "./css/responsive.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

```

它就是整个 React 项目的总入口：把 `App` 挂进 HTML 的 `#root`。



新建全新的html

```powershell
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Zero to Tech</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```

新 `index.html` 是 React 应用的空壳



运行构建

```powershell
npm run dev
```

```powershell
npm run build
```



项目最终骨架

```powershell
index.html
└─ src/main.jsx
   └─ App.jsx
      ├─ HomePage.jsx
      │  ├─ Nav.jsx
      │  └─ PageHeading.jsx
      └─ TextLabPage.jsx
         ├─ Nav.jsx
         ├─ PageHeading.jsx
         ├─ InputCard.jsx
         ├─ ResultCard.jsx
         └─ AnimatedCardGrid.jsx
```

- `index.html`：空壳，只提供挂载点。
- `main.jsx`：入口，把 `App` 挂进去。
- `App.jsx`：总管，决定当前显示哪个页面。
- `HomePage` / `TextLabPage`：页面组件。
- 更小的组件：页面里的零件。



## 简化

直接Vite初始化

```powershell
npm create vite
```

按照提示选择：

- 项目名
- React
- JavaScript

Vite 会直接帮你生成一套 React 项目骨架：`index.html`、`src/main.jsx`、`src/App.jsx`、配置文件等。

如图所示

<img src="/person_blog/notes-images/react-create-vite.png" alt="npm create vite 初始化项目" style="max-width: 100%;" />



<img src="/person_blog/notes-images/react-vite-dev.png" alt="Vite 开发服务器启动" style="max-width: 100%;" />



<img src="/person_blog/notes-images/react-default-page.png" alt="React 默认页面" style="max-width: 100%;" />



参考 https://reactbits.dev/get-started/index
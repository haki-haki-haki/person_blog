const r=`# React 框架\r
\r
构建工具，类似一种翻译的功能，让写的代码翻译成浏览器认识的样子\r
\r
---\r
\r
既然构建工具能翻译，那我们是不是可以不再老老实实手写浏览器那套底层 HTML、CSS、JavaScript，而是发明一套写起来更舒服、更高效的新规则？\r
\r
---\r
\r
一套前端开发的规则，React（其中的一种），再给构建工具翻译给浏览器运行\r
\r
\r
\r
## React\r
\r
国内流行Vue，React和Vue都是前端框架，用组件组织页面，有些许不同。React生态大。\r
\r
React是一个前端框架，管理UI组件。\r
\r
核心规则：把一块界面定义成一个组件。\r
\r
- 数据\r
- 结构\r
- 样式\r
- 行为\r
\r
组件可以组合，嵌套，小组件合成大组件，大组件拼装成页面，页面被总组件管理。\r
\r
再次之前是按照文件类型区分不同的功能（HTML结构，CSS样式，JS行为），React管理的则是组件。\r
\r
\r
\r
Vanilla\r
\r
没有框架的原生写法，原意“香草”\r
\r
不依赖React，Vue前端框架，只使用浏览器原生支持的HTML，CSS,JavaScript来构建页面。\r
\r
本质上浏览器无法直接运行React，只能识别HTML,CSS,JavaScript，React还得依靠构建工具，\r
\r
\r
\r
## 安装进项目\r
\r
\`\`\`powershell\r
npm install react react-dom\r
\`\`\`\r
\r
- \`react\`：React 本身\r
- \`react-dom\`：让 React 能把组件渲染到网页 DOM 上\r
\r
插件：帮助Vite翻译React\r
\r
\`\`\`powershell\r
npm install -D @vitejs/plugin-react\r
\`\`\`\r
\r
在项目种新建vite.config.js\r
\r
\`\`\`powershell\r
import { defineConfig } from "vite";\r
import react from "@vitejs/plugin-react";\r
\r
export default defineConfig({\r
  plugins: [react()],\r
});\r
\r
\`\`\`\r
\r
复制进去\r
\r
作用：将React插件挂在Vite上面。\r
\r
\r
\r
示例代码\r
\r
\`\`\`powershell\r
git clone https://github.com/joylibo/zero-to-tech-demos.git\r
cd zero-to-tech-demos/zero-to-tech-4-3\r
\`\`\`\r
\r
\r
\r
## 改成React组件\r
\r
以下是单个页面改造成React的组件\r
\r
先启动\r
\r
\`\`\`powershell\r
cd ~/zero-to-tech\r
npm run dev\r
\`\`\`\r
\r
\`src/components/\`，就先新建这个目录\r
\r
从 demo 里把 \`ResultCard.jsx\` 拷到你的项目\r
\r
\`ResultCard.jsx\` 是组件本身。它定义了这张卡片是什么、长什么样、挂载后做什么动画。\r
\r
但组件文件自己不会自动出现在页面上。要把它放到页面里，还需要一个入口文件。\r
\r
\r
\r
新建入口文件\r
\r
\`\`\`powershell\r
src/result.jsx\r
\`\`\`\r
\r
写入\r
\r
\`\`\`powershell\r
import { createRoot } from "react-dom/client";\r
import ResultCard from "./components/ResultCard.jsx";\r
\r
createRoot(document.getElementById("result-root")).render(<ResultCard />);\r
\`\`\`\r
\r
1. 把 React 的 \`createRoot\` 引进来。\r
\r
2. 把 \`ResultCard\` 组件引进来。\r
\r
3. 找到页面上 \`id="result-root"\` 的位置。\r
\r
4. 把 \`ResultCard\` 渲染进去。\r
\r
   组件负责：是什么				入口负责：挂载在哪里\r
\r
 在 \`text-lab.html\` 里留出挂载点  也就是在你之前原本的html那里\r
\r
找到原来结果区那整段 \`<article>\`，把它删掉，换成：\r
\r
\`\`\`powershell\r
<div id="result-root" class="panel-half"></div>\r
\`\`\`\r
\r
然后在页面底部保留原来的 \`js/main.js\`，再新加一行：\r
\r
\`\`\`powershell\r
<script type="module" src="js/main.js"><\/script>\r
<script type="module" src="/src/result.jsx"><\/script>\r
\`\`\`\r
\r
挂载点上要保留 \`class="panel-half"\`\r
\r
因为页面外层是 CSS Grid 布局，\`.panel-half\` 决定这一格占半宽。React 组件虽然内部也能写 class，但 CSS Grid 只会对直接子元素生效。\r
\r
- \`#result-root\` 负责在原页面里占位置。\r
- \`ResultCard\` 负责画出真正的卡片\r
\r
此时这个页面就框架化了\r
\r
\`\`\`powershell\r
npm run dev\r
\r
\`\`\`\r
\r
可运行\r
\r
\r
\r
### ResultCard：一个完整的 UI 零件\r
\r
打开你刚拷进来的 \`src/components/ResultCard.jsx\`\r
\r
\`\`\`c\r
import { useEffect, useRef } from "react";\r
import { animate, scrambleText } from "animejs";\r
\r
export default function ResultCard() {\r
  const cardRef = useRef(null);\r
  const scoreRef = useRef(null);\r
\r
  useEffect(() => {\r
    // 卡片自己淡入：.card 默认 opacity:0，这张卡负责把自己显出来\r
    animate(cardRef.current, {\r
      opacity: [0, 1],\r
      translateY: [24, 0],\r
      duration: 700,\r
      ease: "outBack",\r
    });\r
    // 情感分数滚动归位\r
    animate(scoreRef.current, {\r
      innerHTML: scrambleText({ chars: "0-9" }),\r
      duration: 1500,\r
    });\r
  }, []);\r
\r
  return (\r
    <article ref={cardRef} className="panel panel-half lab-panel result-panel card">\r
      <div className="panel-heading">\r
        <p className="section-kicker">结果区</p>\r
        <h3>分析结果</h3>\r
      </div>\r
      <div className="result-stack">\r
        <div className="result-item">\r
          <span>原文</span>\r
          <p>今天的风很轻，适合把脑海里的想法慢慢写下来。</p>\r
        </div>\r
        <div className="result-item">\r
          <span>拼音</span>\r
          <p>jīn tiān de fēng hěn qīng …</p>\r
        </div>\r
        <div className="result-grid">\r
          <div className="result-badge">\r
            <span>情感分数</span>\r
            <strong data-score ref={scoreRef}>0.86</strong>\r
          </div>\r
          <div className="result-badge">\r
            <span>情感判断</span>\r
            <strong>偏积极</strong>\r
          </div>\r
        </div>\r
      </div>\r
    </article>\r
  );\r
}\r
\r
\`\`\`\r
\r
- \`import\`：这个组件需要什么，就自己引进来。这里引进了 React 的工具，也引进了 anime.js。\r
- \`export default\`：把这个组件交出去，让别的文件可以使用它。\r
- \`function ResultCard()\`：React 组件本质上就是一个函数。\r
- \`return (...)\`：函数返回一段长得像 HTML 的东西，这种写法叫 JSX。\r
- \`className\`：在 JSX 里，HTML 的 \`class\` 要写成 \`className\`。\r
- \`useEffect\`：组件出现在页面上后，执行一次动画逻辑。\r
- \`ref\`：拿到真实 DOM 节点，交给 anime.js 做动画。\r
\r
这一张卡片里面，已经同时包含了：\r
\r
- 数据：原文、拼音、情感分数、情感判断。\r
- 结构：\`return\` 里的标签层级。\r
- 样式：\`className\` 指向外部 CSS 里已有的样式规则。\r
- 行为：\`useEffect\` 里的淡入和数字滚动动画。\r
\r
---\r
\r
**一个组件，就是把“数据、结构、样式、行为”这一整套，封装成一个能独立拎走的 UI 单元**\r
\r
\r
\r
## 修改整个页面为React\r
\r
拷入页面相关组件\r
\r
\`\`\`powershell\r
src/components/Nav.jsx\r
src/components/PageHeading.jsx\r
src/components/InputCard.jsx\r
src/components/AnimatedCardGrid.jsx\r
src/components/TextLabPage.jsx\r
\r
\`\`\`\r
\r
把原来那 8 个 CSS 文件拷到：src/css/\r
\r
接下来 \`text-lab.html\` 会退化成一个挂载点，不再负责用 \`<link>\` 引入样式。样式会改由 React 入口文件 \`import\` 进来。\r
\r
\r
\r
换掉临时入口\r
\r
新建src/textlab.jsx\r
\r
\`\`\`powershell\r
import { createRoot } from "react-dom/client";\r
import TextLabPage from "./components/TextLabPage.jsx";\r
\r
import "./css/reset.css";\r
import "./css/variables.css";\r
import "./css/layout.css";\r
import "./css/hero.css";\r
import "./css/nav.css";\r
import "./css/cards.css";\r
import "./css/lab.css";\r
import "./css/responsive.css";\r
\r
createRoot(document.getElementById("root")).render(\r
  <div className="app-shell">\r
    <div className="page-shell">\r
      <main className="page-content">\r
        <TextLabPage current="textlab" onNavigate={() => {}} />\r
      </main>\r
    </div>\r
  </div>,\r
);\r
\r
\`\`\`\r
\r
这里的 \`app-shell / page-shell / page-content\` 是页面外壳，负责背景、最大宽度、左右留白。\r
\r
\r
\r
清空 \`text-lab.html\`\r
\r
把 \`text-lab.html\` 的 \`<body>\` 整块内容，连同底部 script，都换成：\r
\r
\`\`\`powershell\r
<body>\r
  <div id="root"></div>\r
  <script type="module" src="/src/textlab.jsx"><\/script>\r
</body>\r
\r
\`\`\`\r
\r
\`<head>\` 里那些 CSS \`<link>\` 也可以删掉，因为 CSS 已经由 \`src/textlab.jsx\` 引入。\r
\r
\r
\r
**HTML 从“页面主体”，退化成了“一个挂载点”。**\r
\r
原来整页内容都写在 HTML 里。现在 HTML 只留一块空地，真正的页面由 React 画出来\r
\r
\r
\r
 看懂 \`TextLabPage\`：组件可以嵌套组件\r
\r
\`\`\`powershell\r
import Nav from "./Nav.jsx";\r
import PageHeading from "./PageHeading.jsx";\r
import AnimatedCardGrid from "./AnimatedCardGrid.jsx";\r
import InputCard from "./InputCard.jsx";\r
import ResultCard from "./ResultCard.jsx";\r
\r
export default function TextLabPage({ current, onNavigate }) {\r
  return (\r
    <AnimatedCardGrid className="dashboard-grid">\r
      <article className="hero-stage panel-full">\r
        <Nav current={current} onNavigate={onNavigate} />\r
        <PageHeading title="文字实验室" subtitle="拼音和情绪，挖掘中文里的细节" />\r
      </article>\r
\r
      <InputCard />\r
      <ResultCard />\r
    </AnimatedCardGrid>\r
  );\r
}\r
\r
\`\`\`\r
\r
 大写开头的是组件，小写开头的是 HTML 标签\r
\r
\`<Nav />\`、\`<PageHeading />\`、\`<InputCard />\`、\`<ResultCard />\` 都是我们自己定义的 React 组件。\r
\r
\`<article>\` 是普通 HTML 标签。\r
\r
**组件名必须大写开头。**\r
\r
\r
\r
- 小写开头：当成浏览器原生 HTML 标签。\r
- 大写开头：当成你自己定义的 React 组件。\r
\r
\r
\r
 组件挂到 HTML，需要入口；组件放进组件，只要写标签\r
\r
在 \`TextLabPage\` 里使用 \`ResultCard\`，只需要：\r
\r
\`\`\`powershell\r
<ResultCard />\r
\`\`\`\r
\r
- 挂到 HTML：这是 React 世界和真实 DOM 世界的交界，需要 \`createRoot\`。\r
- 放进另一个组件：还在 React 世界内部，写成标签就行\r
\r
将个人主页也处理交给React  拷贝src/components/HomePage.jsx\r
\r
\r
\r
将两个页面收录进App\r
\r
当前有两个页面组件\r
\r
- \`HomePage\`\r
- \`TextLabPage\`\r
\r
将其弄成一个大组件\r
\r
App\r
\r
新建 写入\r
\r
\`\`\`powershell\r
import { useState } from "react";\r
import HomePage from "./components/HomePage.jsx";\r
import TextLabPage from "./components/TextLabPage.jsx";\r
\r
export default function App() {\r
  const [page, setPage] = useState("home");\r
\r
  return (\r
    <div className="app-shell">\r
      <div className="page-shell">\r
        <main className="page-content">\r
          {page === "home"\r
            ? <HomePage current={page} onNavigate={setPage} />\r
            : <TextLabPage current={page} onNavigate={setPage} />}\r
        </main>\r
      </div>\r
    </div>\r
  );\r
}\r
\r
\`\`\`\r
\r
\`App\` 是整个项目的总管。\r
\r
它负责记住当前显示哪一页：是 \`HomePage\`，还是 \`TextLabPage\`。\r
\r
\r
\r
旧项目的两个html可以直接删除\r
\r
- 旧 \`index.html\` 原来装的是个人主页内容。\r
- \`text-lab.html\` 原来装的是文字实验室内容\r
\r
因为已经搬进去React组件了\r
\r
\r
\r
需要新建一个html来挂载  \r
\r
但是需要先新建main.JSX 写入\r
\r
\`\`\`powershell\r
import { StrictMode } from "react";\r
import { createRoot } from "react-dom/client";\r
import App from "./App.jsx";\r
\r
import "./css/reset.css";\r
import "./css/variables.css";\r
import "./css/layout.css";\r
import "./css/hero.css";\r
import "./css/nav.css";\r
import "./css/cards.css";\r
import "./css/lab.css";\r
import "./css/responsive.css";\r
\r
createRoot(document.getElementById("root")).render(\r
  <StrictMode>\r
    <App />\r
  </StrictMode>,\r
);\r
\r
\`\`\`\r
\r
它就是整个 React 项目的总入口：把 \`App\` 挂进 HTML 的 \`#root\`。\r
\r
\r
\r
新建全新的html\r
\r
\`\`\`powershell\r
<!doctype html>\r
<html lang="zh-CN">\r
  <head>\r
    <meta charset="UTF-8" />\r
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\r
    <title>Zero to Tech</title>\r
  </head>\r
  <body>\r
    <div id="root"></div>\r
    <script type="module" src="/src/main.jsx"><\/script>\r
  </body>\r
</html>\r
\r
\`\`\`\r
\r
新 \`index.html\` 是 React 应用的空壳\r
\r
\r
\r
运行构建\r
\r
\`\`\`powershell\r
npm run dev\r
\`\`\`\r
\r
\`\`\`powershell\r
npm run build\r
\`\`\`\r
\r
\r
\r
项目最终骨架\r
\r
\`\`\`powershell\r
index.html\r
└─ src/main.jsx\r
   └─ App.jsx\r
      ├─ HomePage.jsx\r
      │  ├─ Nav.jsx\r
      │  └─ PageHeading.jsx\r
      └─ TextLabPage.jsx\r
         ├─ Nav.jsx\r
         ├─ PageHeading.jsx\r
         ├─ InputCard.jsx\r
         ├─ ResultCard.jsx\r
         └─ AnimatedCardGrid.jsx\r
\`\`\`\r
\r
- \`index.html\`：空壳，只提供挂载点。\r
- \`main.jsx\`：入口，把 \`App\` 挂进去。\r
- \`App.jsx\`：总管，决定当前显示哪个页面。\r
- \`HomePage\` / \`TextLabPage\`：页面组件。\r
- 更小的组件：页面里的零件。\r
\r
\r
\r
## 简化\r
\r
直接Vite初始化\r
\r
\`\`\`powershell\r
npm create vite\r
\`\`\`\r
\r
按照提示选择：\r
\r
- 项目名\r
- React\r
- JavaScript\r
\r
Vite 会直接帮你生成一套 React 项目骨架：\`index.html\`、\`src/main.jsx\`、\`src/App.jsx\`、配置文件等。\r
\r
如图所示\r
\r
<img src="/person_blog/notes-images/react-create-vite.png" alt="npm create vite 初始化项目" style="max-width: 100%;" />\r
\r
\r
\r
<img src="/person_blog/notes-images/react-vite-dev.png" alt="Vite 开发服务器启动" style="max-width: 100%;" />\r
\r
\r
\r
<img src="/person_blog/notes-images/react-default-page.png" alt="React 默认页面" style="max-width: 100%;" />\r
\r
\r
\r
参考 https://reactbits.dev/get-started/index`;export{r as default};

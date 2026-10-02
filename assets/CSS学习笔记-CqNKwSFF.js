const r=`# CSS 学习笔记\r
\r
## 一、CSS 简介\r
\r
### 什么是 CSS？\r
\r
CSS（Cascading Style Sheets，层叠样式表）是一种用来为结构化文档（如 HTML、XML）添加样式（字体、间距、颜色、布局等）的计算机语言。\r
\r
### CSS 的基本工作原理\r
\r
\`\`\`css\r
HTML 负责内容结构  →  "这个是标题"\r
CSS 负责样式呈现   →  "标题字体大小24px，颜色红色"\r
\`\`\`\r
\r
### CSS 在项目中的位置\r
\r
\`\`\`css\r
项目文件夹/\r
├── night.css          ← 这就是CSS文件（样式表）\r
├── index.html         ← HTML文件（网页结构）\r
└── image/\r
    └── ims.webp       ← 图片资源\r
\`\`\`\r
\r
---\r
\r
## 二、CSS 基本语法\r
\r
### 1. CSS 规则结构\r
\r
\`\`\`css\r
选择器 {\r
    属性名: 属性值;\r
    属性名: 属性值;\r
}\r
\`\`\`\r
\r
**示例：**\r
\r
\`\`\`css\r
h1 {\r
    font-size: 2.5rem;        /* 字体大小 */\r
    color: #DEDEDE;           /* 文字颜色 */\r
    margin-bottom: 1.5rem;    /* 底部外边距 */\r
}\r
\`\`\`\r
\r
### 2. 常见选择器类型\r
\r
| 选择器 | 含义 | 示例 |\r
|--------|------|------|\r
| \`标签选择器\` | 选择特定HTML标签 | \`h1\`, \`p\`, \`div\` |\r
| \`类选择器\` | 选择class属性 | \`.btn\`, \`.header\` |\r
| \`ID选择器\` | 选择id属性 | \`#write\`, \`#header\` |\r
| \`属性选择器\` | 选择特定属性 | \`[type="text"]\` |\r
| \`通配符\` | 选择所有元素 | \`*\` |\r
\r
---\r
\r
## 三、night.css 文件解析\r
\r
### 1. 文件开头 - 导入其他样式\r
\r
\`\`\`css\r
@import "night/mermaid.dark.css";\r
@import "night/codeblock.dark.css";\r
@import "night/sourcemode.dark.css";\r
\`\`\`\r
\r
| 语法 | 含义 |\r
|------|------|\r
| \`@import\` | 导入其他CSS文件 |\r
| \`"night/mermaid.dark.css"\` | 被导入的文件路径（相对路径） |\r
\r
**作用：** 将多个CSS文件组合在一起，这里导入了3个额外的样式文件。\r
\r
---\r
\r
### 2. :root 伪类 - 全局变量定义\r
\r
\`\`\`css\r
:root {\r
    --bg-color: transparent;\r
    --side-bar-bg-color: rgba(46, 48, 51, 0.0);\r
    --text-color: #b8bfc6;\r
    --select-text-bg-color: #4a89dc;\r
    --item-hover-bg-color: #0a0d16;\r
}\r
\`\`\`\r
\r
| 语法 | 含义 |\r
|------|------|\r
| \`:root\` | 根元素选择器，代表HTML文档的根 |\r
| \`--变量名\` | CSS自定义属性（变量），以\`--\`开头 |\r
\r
**变量定义规则：**\r
- 变量名以 \`--\` 开头\r
- 变量值可以是任何CSS合法值\r
- 使用 \`var(--变量名)\` 来引用变量\r
\r
**作用：** 定义全局颜色、间距等值，方便统一修改。\r
\r
---\r
\r
### 3. 标签选择器 - 基本元素样式\r
\r
#### 3.1 html 和 body\r
\r
\`\`\`css\r
html {\r
    font-size: 16px;\r
}\r
\r
html,\r
body {\r
    -webkit-text-size-adjust: 100%;\r
    -ms-text-size-adjust: 100%;\r
    fill: currentColor;\r
    line-height: 1.625rem;\r
    background-image: url(./image/ims.webp);\r
    background-size: cover;\r
    background-position: center;\r
    background-repeat: no-repeat;\r
    background-attachment: fixed;\r
    background-color: transparent;\r
    opacity: 0.95;\r
}\r
\`\`\`\r
\r
| 属性 | 含义 | 示例值 |\r
|------|------|--------|\r
| \`font-size\` | 字体大小 | \`16px\`, \`2.5rem\` |\r
| \`line-height\` | 行高 | \`1.625\`, \`1.5\` |\r
| \`background-image\` | 背景图片 | \`url(图片路径)\` |\r
| \`background-size\` | 背景图片尺寸 | \`cover\`, \`100% 100%\` |\r
| \`background-position\` | 背景图片位置 | \`center\`, \`top left\` |\r
| \`background-repeat\` | 背景重复方式 | \`no-repeat\`, \`repeat\` |\r
| \`background-color\` | 背景颜色 | \`transparent\`, \`#333\` |\r
| \`opacity\` | 透明度 | \`0-1\`（0.95=95%） |\r
\r
**作用：** 设置网页整体背景（深色背景+透明效果）。\r
\r
---\r
\r
#### 3.2 伪元素 body::before\r
\r
\`\`\`css\r
body::before {\r
    content: "";\r
    position: fixed;\r
    top: 0;\r
    left: 0;\r
    width: 100%;\r
    height: 100%;\r
    background-color: rgba(0, 0, 0, 0.9);\r
    z-index: -1;\r
}\r
\`\`\`\r
\r
| 语法 | 含义 |\r
|------|------|\r
| \`::before\` | 伪元素，在元素内容之前插入内容 |\r
| \`content\` | 插入的内容（空字符串表示不插入可见内容） |\r
| \`position: fixed\` | 固定定位，相对于浏览器窗口定位 |\r
| \`top/left/width/height\` | 定位偏移和尺寸 |\r
| \`z-index: -1\` | 层叠顺序，-1表示在最底层 |\r
\r
**作用：** 在body内容下方创建一个半透明黑色遮罩层，让背景图片变暗。\r
\r
---\r
\r
### 4. #write - ID选择器\r
\r
\`\`\`css\r
#write {\r
    max-width: 914px;\r
    background: transparent !important;\r
}\r
\r
@media only screen and (min-width: 1400px) {\r
    #write {\r
        max-width: 1024px;\r
    }\r
}\r
\`\`\`\r
\r
| 语法 | 含义 |\r
|------|------|\r
| \`#write\` | ID选择器，选择 \`id="write"\` 的元素 |\r
| \`max-width\` | 最大宽度 |\r
| \`!important\` | 强制优先级，忽略其他规则 |\r
| \`@media\` | 媒体查询，根据屏幕尺寸应用不同样式 |\r
\r
**媒体查询语法：**\r
\`\`\`css\r
@media only screen and (条件) {\r
    /* 条件满足时应用的样式 */\r
}\r
\`\`\`\r
\r
| 条件 | 含义 |\r
|------|------|\r
| \`min-width: 1400px\` | 屏幕宽度≥1400px |\r
| \`max-width: 1000px\` | 屏幕宽度≤1000px |\r
\r
**作用：** 设置编辑器内容区域的最大宽度，并实现响应式布局（不同屏幕宽度显示不同宽度）。\r
\r
---\r
\r
### 5. 文本和字体样式\r
\r
\`\`\`css\r
h1, h2, h3, h4, h5, h6 {\r
    font-family: "Lucida Grande", "Corbel", sans-serif;\r
    font-weight: normal;\r
    -ms-word-wrap: break-word;\r
    word-wrap: break-word;\r
    margin: 0;\r
    padding: 0;\r
    color: #DEDEDE\r
}\r
\r
h1 {\r
    font-size: 2.5rem;\r
    line-height: 2.75rem;\r
    margin-bottom: 1.5rem;\r
    letter-spacing: -1.5px;\r
}\r
\`\`\`\r
\r
| 属性 | 含义 | 示例值 |\r
|------|------|--------|\r
| \`font-family\` | 字体类型 | \`"Helvetica Neue"\`, \`Arial, sans-serif\` |\r
| \`font-weight\` | 字体粗细 | \`normal\`, \`bold\`, \`lighter\` |\r
| \`font-size\` | 字体大小 | \`2.5rem\`, \`16px\`, \`1.5em\` |\r
| \`line-height\` | 行高 | \`2.75rem\`, \`1.5\` |\r
| \`letter-spacing\` | 字符间距 | \`-1.5px\`, \`2px\` |\r
| \`color\` | 文字颜色 | \`#DEDEDE\`, \`red\`, \`rgb(255,0,0)\` |\r
| \`margin\` | 外边距 | \`0\`, \`10px 20px\` |\r
| \`padding\` | 内边距 | \`0\`, \`10px 20px\` |\r
| \`margin-bottom\` | 底部外边距 | \`1.5rem\` |\r
\r
**margin/padding 简写规则：**\r
\`\`\`css\r
margin: 10px;           /* 上下左右都是10px */\r
margin: 10px 20px;       /* 上下10px，左右20px */\r
margin: 10px 20px 30px;  /* 上10px，左右20px，下30px */\r
margin: 10px 20px 30px 40px; /* 上右下左，顺时针 */\r
\`\`\`\r
\r
---\r
\r
### 6. 颜色值详解\r
\r
\`\`\`css\r
color: #b8bfc6;          /* 十六进制：RGB */\r
color: #DEDEDE;          /* 可以省略#后相同字母 */\r
color: rgba(0, 0, 0, 0.9);  /* RGBA：R红G绿B蓝A透明度 */\r
color: rgb(255, 255, 255);  /* RGB模式 */\r
\`\`\`\r
\r
| 格式 | 示例 | 说明 |\r
|------|------|------|\r
| 十六进制 | \`#b8bfc6\` | 每两位代表R、G、B（0-255） |\r
| 简写 | \`#FFF\` | 相当于 \`#FFFFFF\` |\r
| RGB | \`rgb(255, 0, 0)\` | 红、绿、蓝各0-255 |\r
| RGBA | \`rgba(0,0,0,0.9)\` | RGB + 透明度（0-1） |\r
\r
---\r
\r
### 7. 链接样式\r
\r
\`\`\`css\r
a {\r
    text-decoration: none;\r
    outline: 0;\r
    color: #e0e0e0;\r
    -webkit-transition: all .2s ease-in-out;\r
    transition: all .2s ease-in-out;\r
}\r
\r
a:hover {\r
    color: #fff;\r
}\r
\r
a:focus {\r
    outline: thin dotted;\r
}\r
\`\`\`\r
\r
| 属性 | 含义 |\r
|------|------|\r
| \`text-decoration\` | 文本装饰：\`none\`无装饰，\`underline\`下划线 |\r
| \`outline\` | 外轮廓（类似border但在外部） |\r
| \`transition\` | 过渡动画：\`属性 时长 缓动函数\` |\r
| \`:hover\` | 伪类，鼠标悬停时的样式 |\r
| \`:focus\` | 伪类，获得焦点时的样式 |\r
\r
**transition 详解：**\r
\`\`\`css\r
transition: all .2s ease-in-out;\r
/*  all    = 过渡所有属性   */\r
/*  .2s    = 动画时长0.2秒  */\r
/*  ease-in-out = 缓动函数  */\r
\`\`\`\r
\r
---\r
\r
### 8. 列表样式\r
\r
\`\`\`css\r
ul,\r
ol {\r
    padding: 0 0 0 1.875rem;\r
}\r
\r
ul {\r
    list-style: square;\r
}\r
\r
ol {\r
    list-style: decimal;\r
}\r
\`\`\`\r
\r
| 属性 | 含义 |\r
|------|------|\r
| \`list-style\` | 列表标记类型：\`square\`方块，\`decimal\`数字 |\r
\r
---\r
\r
### 9. 表格样式\r
\r
\`\`\`css\r
table {\r
    max-width: 100%;\r
    width: 100%;\r
    border-collapse: collapse;\r
    border-spacing: 0;\r
}\r
\r
th,\r
td {\r
    padding: 5px 10px;\r
    vertical-align: top;\r
    border: solid 1px #474d54;\r
}\r
\`\`\`\r
\r
| 属性 | 含义 |\r
|------|------|\r
| \`border-collapse\` | 边框合并：\`collapse\`合并，\`separate\`分离 |\r
| \`border-spacing\` | 边框间距 |\r
| \`vertical-align\` | 垂直对齐：\`top\`、\`middle\`、\`bottom\` |\r
| \`border\` | 边框：\`宽度 样式 颜色\` |\r
\r
---\r
\r
### 10. 滚动条样式\r
\r
\`\`\`css\r
.typora-node::-webkit-scrollbar {\r
    width: 5px;\r
}\r
\r
.typora-node::-webkit-scrollbar-thumb:vertical {\r
    background: rgba(250, 250, 250, 0.3);\r
}\r
\`\`\`\r
\r
| 语法 | 含义 |\r
|------|------|\r
| \`::-webkit-scrollbar\` | WebKit内核浏览器的滚动条 |\r
| \`::-webkit-scrollbar-thumb\` | 滚动条滑块 |\r
\r
---\r
\r
## 四、CSS 单位详解\r
\r
| 单位 | 含义 | 说明 |\r
|------|------|------|\r
| \`px\` | 像素 | 绝对单位，屏幕实际像素 |\r
| \`rem\` | 根元素字体大小 | 相对单位，相对于html字体大小 |\r
| \`em\` | 父元素字体大小 | 相对单位，相对于父元素 |\r
| \`%\` | 百分比 | 相对于父元素的对应值 |\r
| \`vw\` | 视口宽度 | 1vw = 视口宽度的1% |\r
| \`vh\` | 视口高度 | 1vh = 视口高度的1% |\r
\r
---\r
\r
## 五、夜间模式主题分析\r
\r
基于 \`night.css\` 文件，这是一个 **Typora 编辑器的深色主题**，主要特点：\r
\r
### 设计目标\r
- 深色背景（\`#333\`）保护眼睛\r
- 高对比度文字（\`#DEDEDE\`）确保可读性\r
- 统一的蓝色强调色（\`#4a89dc\`）\r
- 背景图片 + 半透明遮罩营造氛围\r
\r
### 颜色体系\r
\`\`\`\r
背景色：#333, #363B40, rgba(0,0,0,0.9)\r
文字色：#b8bfc6, #DEDEDE, #eee\r
强调色：#4a89dc (蓝色)\r
边框色：#474d54\r
\`\`\`\r
\r
---\r
\r
## 六、常用 CSS 属性速查表\r
\r
### 文本\r
\`\`\`css\r
font-size: 16px;        /* 字号 */\r
font-weight: bold;      /* 字重 */\r
color: #333;            /* 颜色 */\r
text-align: center;     /* 对齐 */\r
line-height: 1.5;       /* 行高 */\r
\`\`\`\r
\r
### 盒子模型\r
\`\`\`css\r
margin: 10px;          /* 外边距 */\r
padding: 10px;          /* 内边距 */\r
border: 1px solid #333; /* 边框 */\r
width: 100px;           /* 宽度 */\r
height: 100px;          /* 高度 */\r
\`\`\`\r
\r
### 背景\r
\`\`\`css\r
background-color: #fff;      /* 背景色 */\r
background-image: url(a.jpg); /* 背景图 */\r
background-size: cover;      /* 背景尺寸 */\r
\`\`\`\r
\r
### 定位\r
\`\`\`css\r
position: relative;      /* 相对定位 */\r
position: absolute;     /* 绝对定位 */\r
position: fixed;         /* 固定定位 */\r
top: 0; left: 0;        /* 偏移量 */\r
\`\`\`\r
\r
---\r
\r
## 七、学习建议\r
\r
1. **从基础开始**：先掌握选择器、属性、值的基本概念\r
2. **多动手实践**：修改 night.css 中的颜色值，观察变化\r
3. **善用开发者工具**：浏览器按F12打开调试器，实时修改样式\r
4. **理解盒子模型**：margin、padding、border、content的关系\r
5. **学习响应式**：理解 \`@media\` 媒体查询\r
\r
---\r
\r
> **提示**：CSS 不是编程语言，而是样式表语言。它的语法比编程语言简单得多，重点是理解**选择器**和**属性**的作用。\r
`;export{r as default};

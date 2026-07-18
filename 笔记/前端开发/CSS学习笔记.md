# CSS 学习笔记

## 一、CSS 简介

### 什么是 CSS？

CSS（Cascading Style Sheets，层叠样式表）是一种用来为结构化文档（如 HTML、XML）添加样式（字体、间距、颜色、布局等）的计算机语言。

### CSS 的基本工作原理

```css
HTML 负责内容结构  →  "这个是标题"
CSS 负责样式呈现   →  "标题字体大小24px，颜色红色"
```

### CSS 在项目中的位置

```css
项目文件夹/
├── night.css          ← 这就是CSS文件（样式表）
├── index.html         ← HTML文件（网页结构）
└── image/
    └── ims.webp       ← 图片资源
```

---

## 二、CSS 基本语法

### 1. CSS 规则结构

```css
选择器 {
    属性名: 属性值;
    属性名: 属性值;
}
```

**示例：**

```css
h1 {
    font-size: 2.5rem;        /* 字体大小 */
    color: #DEDEDE;           /* 文字颜色 */
    margin-bottom: 1.5rem;    /* 底部外边距 */
}
```

### 2. 常见选择器类型

| 选择器 | 含义 | 示例 |
|--------|------|------|
| `标签选择器` | 选择特定HTML标签 | `h1`, `p`, `div` |
| `类选择器` | 选择class属性 | `.btn`, `.header` |
| `ID选择器` | 选择id属性 | `#write`, `#header` |
| `属性选择器` | 选择特定属性 | `[type="text"]` |
| `通配符` | 选择所有元素 | `*` |

---

## 三、night.css 文件解析

### 1. 文件开头 - 导入其他样式

```css
@import "night/mermaid.dark.css";
@import "night/codeblock.dark.css";
@import "night/sourcemode.dark.css";
```

| 语法 | 含义 |
|------|------|
| `@import` | 导入其他CSS文件 |
| `"night/mermaid.dark.css"` | 被导入的文件路径（相对路径） |

**作用：** 将多个CSS文件组合在一起，这里导入了3个额外的样式文件。

---

### 2. :root 伪类 - 全局变量定义

```css
:root {
    --bg-color: transparent;
    --side-bar-bg-color: rgba(46, 48, 51, 0.0);
    --text-color: #b8bfc6;
    --select-text-bg-color: #4a89dc;
    --item-hover-bg-color: #0a0d16;
}
```

| 语法 | 含义 |
|------|------|
| `:root` | 根元素选择器，代表HTML文档的根 |
| `--变量名` | CSS自定义属性（变量），以`--`开头 |

**变量定义规则：**
- 变量名以 `--` 开头
- 变量值可以是任何CSS合法值
- 使用 `var(--变量名)` 来引用变量

**作用：** 定义全局颜色、间距等值，方便统一修改。

---

### 3. 标签选择器 - 基本元素样式

#### 3.1 html 和 body

```css
html {
    font-size: 16px;
}

html,
body {
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
    fill: currentColor;
    line-height: 1.625rem;
    background-image: url(./image/ims.webp);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-color: transparent;
    opacity: 0.95;
}
```

| 属性 | 含义 | 示例值 |
|------|------|--------|
| `font-size` | 字体大小 | `16px`, `2.5rem` |
| `line-height` | 行高 | `1.625`, `1.5` |
| `background-image` | 背景图片 | `url(图片路径)` |
| `background-size` | 背景图片尺寸 | `cover`, `100% 100%` |
| `background-position` | 背景图片位置 | `center`, `top left` |
| `background-repeat` | 背景重复方式 | `no-repeat`, `repeat` |
| `background-color` | 背景颜色 | `transparent`, `#333` |
| `opacity` | 透明度 | `0-1`（0.95=95%） |

**作用：** 设置网页整体背景（深色背景+透明效果）。

---

#### 3.2 伪元素 body::before

```css
body::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    z-index: -1;
}
```

| 语法 | 含义 |
|------|------|
| `::before` | 伪元素，在元素内容之前插入内容 |
| `content` | 插入的内容（空字符串表示不插入可见内容） |
| `position: fixed` | 固定定位，相对于浏览器窗口定位 |
| `top/left/width/height` | 定位偏移和尺寸 |
| `z-index: -1` | 层叠顺序，-1表示在最底层 |

**作用：** 在body内容下方创建一个半透明黑色遮罩层，让背景图片变暗。

---

### 4. #write - ID选择器

```css
#write {
    max-width: 914px;
    background: transparent !important;
}

@media only screen and (min-width: 1400px) {
    #write {
        max-width: 1024px;
    }
}
```

| 语法 | 含义 |
|------|------|
| `#write` | ID选择器，选择 `id="write"` 的元素 |
| `max-width` | 最大宽度 |
| `!important` | 强制优先级，忽略其他规则 |
| `@media` | 媒体查询，根据屏幕尺寸应用不同样式 |

**媒体查询语法：**
```css
@media only screen and (条件) {
    /* 条件满足时应用的样式 */
}
```

| 条件 | 含义 |
|------|------|
| `min-width: 1400px` | 屏幕宽度≥1400px |
| `max-width: 1000px` | 屏幕宽度≤1000px |

**作用：** 设置编辑器内容区域的最大宽度，并实现响应式布局（不同屏幕宽度显示不同宽度）。

---

### 5. 文本和字体样式

```css
h1, h2, h3, h4, h5, h6 {
    font-family: "Lucida Grande", "Corbel", sans-serif;
    font-weight: normal;
    -ms-word-wrap: break-word;
    word-wrap: break-word;
    margin: 0;
    padding: 0;
    color: #DEDEDE
}

h1 {
    font-size: 2.5rem;
    line-height: 2.75rem;
    margin-bottom: 1.5rem;
    letter-spacing: -1.5px;
}
```

| 属性 | 含义 | 示例值 |
|------|------|--------|
| `font-family` | 字体类型 | `"Helvetica Neue"`, `Arial, sans-serif` |
| `font-weight` | 字体粗细 | `normal`, `bold`, `lighter` |
| `font-size` | 字体大小 | `2.5rem`, `16px`, `1.5em` |
| `line-height` | 行高 | `2.75rem`, `1.5` |
| `letter-spacing` | 字符间距 | `-1.5px`, `2px` |
| `color` | 文字颜色 | `#DEDEDE`, `red`, `rgb(255,0,0)` |
| `margin` | 外边距 | `0`, `10px 20px` |
| `padding` | 内边距 | `0`, `10px 20px` |
| `margin-bottom` | 底部外边距 | `1.5rem` |

**margin/padding 简写规则：**
```css
margin: 10px;           /* 上下左右都是10px */
margin: 10px 20px;       /* 上下10px，左右20px */
margin: 10px 20px 30px;  /* 上10px，左右20px，下30px */
margin: 10px 20px 30px 40px; /* 上右下左，顺时针 */
```

---

### 6. 颜色值详解

```css
color: #b8bfc6;          /* 十六进制：RGB */
color: #DEDEDE;          /* 可以省略#后相同字母 */
color: rgba(0, 0, 0, 0.9);  /* RGBA：R红G绿B蓝A透明度 */
color: rgb(255, 255, 255);  /* RGB模式 */
```

| 格式 | 示例 | 说明 |
|------|------|------|
| 十六进制 | `#b8bfc6` | 每两位代表R、G、B（0-255） |
| 简写 | `#FFF` | 相当于 `#FFFFFF` |
| RGB | `rgb(255, 0, 0)` | 红、绿、蓝各0-255 |
| RGBA | `rgba(0,0,0,0.9)` | RGB + 透明度（0-1） |

---

### 7. 链接样式

```css
a {
    text-decoration: none;
    outline: 0;
    color: #e0e0e0;
    -webkit-transition: all .2s ease-in-out;
    transition: all .2s ease-in-out;
}

a:hover {
    color: #fff;
}

a:focus {
    outline: thin dotted;
}
```

| 属性 | 含义 |
|------|------|
| `text-decoration` | 文本装饰：`none`无装饰，`underline`下划线 |
| `outline` | 外轮廓（类似border但在外部） |
| `transition` | 过渡动画：`属性 时长 缓动函数` |
| `:hover` | 伪类，鼠标悬停时的样式 |
| `:focus` | 伪类，获得焦点时的样式 |

**transition 详解：**
```css
transition: all .2s ease-in-out;
/*  all    = 过渡所有属性   */
/*  .2s    = 动画时长0.2秒  */
/*  ease-in-out = 缓动函数  */
```

---

### 8. 列表样式

```css
ul,
ol {
    padding: 0 0 0 1.875rem;
}

ul {
    list-style: square;
}

ol {
    list-style: decimal;
}
```

| 属性 | 含义 |
|------|------|
| `list-style` | 列表标记类型：`square`方块，`decimal`数字 |

---

### 9. 表格样式

```css
table {
    max-width: 100%;
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
}

th,
td {
    padding: 5px 10px;
    vertical-align: top;
    border: solid 1px #474d54;
}
```

| 属性 | 含义 |
|------|------|
| `border-collapse` | 边框合并：`collapse`合并，`separate`分离 |
| `border-spacing` | 边框间距 |
| `vertical-align` | 垂直对齐：`top`、`middle`、`bottom` |
| `border` | 边框：`宽度 样式 颜色` |

---

### 10. 滚动条样式

```css
.typora-node::-webkit-scrollbar {
    width: 5px;
}

.typora-node::-webkit-scrollbar-thumb:vertical {
    background: rgba(250, 250, 250, 0.3);
}
```

| 语法 | 含义 |
|------|------|
| `::-webkit-scrollbar` | WebKit内核浏览器的滚动条 |
| `::-webkit-scrollbar-thumb` | 滚动条滑块 |

---

## 四、CSS 单位详解

| 单位 | 含义 | 说明 |
|------|------|------|
| `px` | 像素 | 绝对单位，屏幕实际像素 |
| `rem` | 根元素字体大小 | 相对单位，相对于html字体大小 |
| `em` | 父元素字体大小 | 相对单位，相对于父元素 |
| `%` | 百分比 | 相对于父元素的对应值 |
| `vw` | 视口宽度 | 1vw = 视口宽度的1% |
| `vh` | 视口高度 | 1vh = 视口高度的1% |

---

## 五、夜间模式主题分析

基于 `night.css` 文件，这是一个 **Typora 编辑器的深色主题**，主要特点：

### 设计目标
- 深色背景（`#333`）保护眼睛
- 高对比度文字（`#DEDEDE`）确保可读性
- 统一的蓝色强调色（`#4a89dc`）
- 背景图片 + 半透明遮罩营造氛围

### 颜色体系
```
背景色：#333, #363B40, rgba(0,0,0,0.9)
文字色：#b8bfc6, #DEDEDE, #eee
强调色：#4a89dc (蓝色)
边框色：#474d54
```

---

## 六、常用 CSS 属性速查表

### 文本
```css
font-size: 16px;        /* 字号 */
font-weight: bold;      /* 字重 */
color: #333;            /* 颜色 */
text-align: center;     /* 对齐 */
line-height: 1.5;       /* 行高 */
```

### 盒子模型
```css
margin: 10px;          /* 外边距 */
padding: 10px;          /* 内边距 */
border: 1px solid #333; /* 边框 */
width: 100px;           /* 宽度 */
height: 100px;          /* 高度 */
```

### 背景
```css
background-color: #fff;      /* 背景色 */
background-image: url(a.jpg); /* 背景图 */
background-size: cover;      /* 背景尺寸 */
```

### 定位
```css
position: relative;      /* 相对定位 */
position: absolute;     /* 绝对定位 */
position: fixed;         /* 固定定位 */
top: 0; left: 0;        /* 偏移量 */
```

---

## 七、学习建议

1. **从基础开始**：先掌握选择器、属性、值的基本概念
2. **多动手实践**：修改 night.css 中的颜色值，观察变化
3. **善用开发者工具**：浏览器按F12打开调试器，实时修改样式
4. **理解盒子模型**：margin、padding、border、content的关系
5. **学习响应式**：理解 `@media` 媒体查询

---

> **提示**：CSS 不是编程语言，而是样式表语言。它的语法比编程语言简单得多，重点是理解**选择器**和**属性**的作用。

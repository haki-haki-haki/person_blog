# 样式系统说明

## 样式文件组织结构

```
src/styles/
├── global.css        # 全局样式、CSS 变量、重置样式
├── animations.css    # 所有动画 @keyframes 定义
├── components.css    # 通用组件样式
└── pages/            # 页面级样式
    ├── home.css
    ├── study.css
    ├── life.css
    └── note-detail.css
```

## CSS 变量

在 `global.css` 中定义：

```css
:root {
  --color-bg: #ffffff;           // 背景色
  --color-fg: #000000;           // 前景色
  --color-muted: #666666;        // 次要文字
  --color-border: #e5e5e5;       // 边框色
  --font-mono: 'JetBrains Mono', ...;  // 等宽字体
  --font-serif: 'Noto Serif SC', ...;  // 衬线字体
}
```

## 设计风格

- **主色调**：黑白极简，参考 token-template 的终端风格
- **字体搭配**：等宽字体（终端风）+ 衬线字体（文艺感）
- **布局特点**：大量留白、不对称构图、竖线装饰
- **交互效果**：悬停位移、淡入动画、打字机效果

## 动画类

在 `animations.css` 中定义了以下动画类：

- `.animate-fade-in` - 淡入
- `.animate-fade-in-up` - 上移淡入
- `.animate-fade-in-down` - 下移淡入
- `.animate-slide-in-left` - 左移入
- `.animate-typing` - 打字机效果
- `.animate-float` - 漂浮动画
- `.animate-blink` - 闪烁
- `.delay-100` ~ `.delay-1500` - 延迟类

## 组件类

在 `components.css` 中定义了以下通用组件：

- `.btn` / `.btn-primary` - 按钮
- `.card` - 卡片
- `.tag` - 标签
- `.terminal-prompt` - 终端提示符
- `.divider` - 分隔线
- `.link-underline` - 下划线链接
- `.image-frame` - 图片框
- `.section-title` - 章节标题

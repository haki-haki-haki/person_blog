# 项目结构说明

## 目录结构

```
person_blog/
├── public/                    # 静态资源
│   ├── notes/                 # Markdown 笔记文件
│   │   ├── frontend/         # 前端笔记
│   │   ├── backend/          # 后端笔记
│   │   ├── embedded/         # 嵌入式笔记
│   │   ├── vision/           # 视觉笔记
│   │   ├── math/             # 数学笔记
│   │   ├── cpp/              # C/C++ 笔记
│   │   ├── projects/         # 项目笔记
│   │   └── misc/             # 杂项笔记
│   └── images/
│       ├── life/             # 生活照片
│       └── avatar/           # 头像等
├── src/
│   ├── components/           # 可复用组件
│   │   ├── Navbar/          # 导航栏组件
│   │   ├── Hero/            # Hero 封面组件
│   │   └── Footer/          # 页脚组件
│   ├── pages/               # 页面组件
│   │   ├── Home/            # 首页
│   │   ├── Study/           # 学习页
│   │   ├── Life/            # 生活页
│   │   └── NoteDetail/      # 笔记详情页
│   ├── styles/              # 样式文件（分门别类）
│   │   ├── global.css       # 全局样式、变量
│   │   ├── animations.css   # 动画定义
│   │   ├── components.css   # 组件通用样式
│   │   └── pages/           # 页面级样式
│   ├── data/                # 数据配置
│   │   ├── categories.ts    # 学习分类配置
│   │   ├── notes.ts         # 笔记索引数据
│   │   └── photos.ts        # 生活照片数据
│   ├── App.tsx              # 应用入口
│   ├── main.tsx             # 渲染入口
│   └── index.css            # 样式总入口
├── .trae/documents/         # 项目文档
└── package.json
```

## 添加笔记的方法

1. 在 `public/notes/` 对应的分类文件夹中创建 `.md` 文件
2. 在 `src/data/notes.ts` 中添加笔记的元数据（标题、日期、摘要等）

## 添加照片的方法

1. 将照片放入 `public/images/life/` 文件夹
2. 在 `src/data/photos.ts` 中添加照片的信息

## 样式文件说明

- `global.css` - CSS 变量、重置样式、基础排版
- `animations.css` - 所有 @keyframes 动画定义
- `components.css` - 通用组件样式（按钮、卡片、标签等）
- `pages/*.css` - 各页面独有的样式

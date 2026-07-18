# 学习笔记分类说明

## 已有分类

| 分类 ID | 名称 | 文件夹路径 | 说明 |
|---------|------|-----------|------|
| frontend | 前端开发 | /notes/frontend/ | HTML、CSS、JavaScript、React、Vue 等 |
| backend | 后端开发 | /notes/backend/ | Node.js、Python、数据库、API 设计等 |
| embedded | 嵌入式开发 | /notes/embedded/ | STM32、ARM、RTOS、驱动、RoboMaster |
| vision | 计算机视觉 | /notes/vision/ | OpenCV、深度学习、图像处理、目标检测 |
| math | 数学 | /notes/math/ | 高等数学、线性代数、概率论、离散数学 |
| cpp | C/C++ | /notes/cpp/ | C++ 语法、STL、数据结构与算法 |
| projects | 项目实战 | /notes/projects/ | 课程设计、比赛项目、个人项目 |
| misc | 杂项笔记 | /notes/misc/ | 工具使用、学习方法、踩坑记录 |

## 如何添加新分类

1. 在 `src/data/categories.ts` 中添加新的分类对象
2. 在 `public/notes/` 中创建对应的文件夹
3. 在 `src/styles/pages/study.css` 中按需添加样式

## 笔记格式

每篇笔记需要两部分：

### 1. Markdown 文件
放在对应的分类文件夹下，支持标准 Markdown 语法和 GFM（GitHub Flavored Markdown）。

### 2. 元数据配置
在 `src/data/notes.ts` 的 `notes` 数组中添加：

```typescript
{
  id: '唯一ID',
  title: '笔记标题',
  category: '分类ID',
  date: 'YYYY-MM-DD',
  summary: '笔记摘要',
  filePath: '/notes/分类/文件名.md',
  tags: ['标签1', '标签2'],
}
```

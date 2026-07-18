# 生活区使用说明

## 照片墙

### 添加照片

1. 将照片放入 `public/images/life/` 文件夹
2. 在 `src/data/photos.ts` 的 `photos` 数组中添加：

```typescript
{
  id: '唯一ID',
  src: '/images/life/照片文件名.jpg',
  alt: '照片描述',
  caption: '显示的标题文字',
  date: 'YYYY-MM-DD',
  category: '分类ID',
  width: 800,  // 照片宽度（用于布局）
  height: 600, // 照片高度
}
```

### 照片分类

已有分类：
- `daily` - 日常
- `travel` - 旅行
- `food` - 美食
- `sports` - 运动
- `coding` - 写代码
- `study` - 学习

添加新分类：在 `src/data/photos.ts` 的 `photoCategories` 数组中添加。

## 生活随笔

在 `src/data/photos.ts` 的 `journalEntries` 数组中添加：

```typescript
{
  id: '唯一ID',
  day: '日期（日）',
  month: '月份',
  title: '标题',
  content: '内容',
}
```

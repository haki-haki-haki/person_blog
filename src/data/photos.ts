export interface Photo {
  id: string;
  src: string;
  alt: string;
  caption: string;
  date: string;
  category: string;
  width: number;
  height: number;
}

export const photos: Photo[] = [
  {
    id: '1',
    src: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
    alt: '打羽毛球',
    caption: '周末和朋友打羽毛球',
    date: '2024-12-14',
    category: 'daily',
    width: 800,
    height: 600,
  },
  {
    id: '2',
    src: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800',
    alt: '操场跑步',
    caption: '夜跑五公里，保持清醒',
    date: '2024-12-12',
    category: 'sports',
    width: 800,
    height: 1000,
  },
  {
    id: '3',
    src: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800',
    alt: '高铁旅行',
    caption: '坐高铁回家的路上',
    date: '2024-10-01',
    category: 'travel',
    width: 800,
    height: 500,
  },
  {
    id: '4',
    src: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    alt: '深夜泡面',
    caption: '写代码到深夜，来碗泡面',
    date: '2024-12-10',
    category: 'food',
    width: 800,
    height: 800,
  },
  {
    id: '5',
    src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
    alt: '假期旅行',
    caption: '暑假去看海',
    date: '2024-08-15',
    category: 'travel',
    width: 800,
    height: 600,
  },
  {
    id: '6',
    src: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
    alt: '傍晚散步',
    caption: '傍晚的校园小路',
    date: '2024-11-20',
    category: 'daily',
    width: 800,
    height: 1000,
  },
  {
    id: '7',
    src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
    alt: '写代码',
    caption: '深夜写代码的快乐',
    date: '2024-12-08',
    category: 'coding',
    width: 800,
    height: 600,
  },
  {
    id: '8',
    src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    alt: '图书馆',
    caption: '图书馆自习的下午',
    date: '2024-11-25',
    category: 'study',
    width: 800,
    height: 1000,
  },
  {
    id: '9',
    src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    alt: '美食',
    caption: '周末犒劳自己一顿',
    date: '2024-12-07',
    category: 'food',
    width: 800,
    height: 600,
  },
];

export const photoCategories = [
  { id: 'all', name: '全部' },
  { id: 'daily', name: '日常' },
  { id: 'travel', name: '旅行' },
  { id: 'food', name: '美食' },
  { id: 'sports', name: '运动' },
  { id: 'coding', name: '写代码' },
  { id: 'study', name: '学习' },
];

export interface JournalEntry {
  id: string;
  day: string;
  month: string;
  title: string;
  content: string;
}

export const journalEntries: JournalEntry[] = [
  {
    id: '1',
    day: '15',
    month: '12月',
    title: '调参调到头秃',
    content: '今天调了一整天的云台 PID，参数改来改去总是不理想。晚上和队友讨论了一下，发现是机械结构的问题。明天打算先加固一下结构再继续调。加油，离比赛越来越近了！',
  },
  {
    id: '2',
    day: '12',
    month: '12月',
    title: '五公里达成',
    content: '今天终于跑完了五公里，配速六分钟，虽然不快但是坚持下来了。跑完之后感觉脑子特别清醒，回实验室写代码效率都高了不少。以后每周至少跑三次！',
  },
  {
    id: '3',
    day: '08',
    month: '12月',
    title: '深夜的泡面格外香',
    content: '为了赶项目 Deadline，又熬夜了。三点钟泡了碗红烧牛肉面，是真的香。项目终于有了进展，虽然累但是很充实。年轻就是要拼嘛！',
  },
];

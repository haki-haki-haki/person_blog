/** ASCII 字符画作品数据 */
export interface AsciiArtItem {
  id: string;
  title: string;
  desc: string;
  file: string; // 对应的txt文件名
}

export const asciiArtWorks: AsciiArtItem[] = [
  {
    id: 'naruto-1',
    title: 'Naruto I',
    desc: '春日的鸣人',
    file: 'naruto_1.txt',
  },
  {
    id: 'naruto-2',
    title: 'Naruto II',
    desc: '鸣人侧影',
    file: 'naruto_2.txt',
  },
  {
    id: 'naruto-3',
    title: 'Naruto III',
    desc: '鸣人特写',
    file: 'naruto_3.txt',
  },
  {
    id: 'naruto-fan-1',
    title: '鸣人 Fan Art I',
    desc: '最喜欢的鸣人',
    file: 'naruto_fan_1.txt',
  },
  {
    id: 'naruto-fan-2',
    title: '鸣人 Fan Art II',
    desc: '难得的热血少年',
    file: 'naruto_fan_2.txt',
  },
];

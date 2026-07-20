export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  noteCount: number;
}

export const categories: Category[] = [
  {
    id: 'embedded',
    name: '嵌入式开发',
    nameEn: 'Embedded',
    icon: '🔌',
    description: 'STM32、ARM、SWD调试、PID控制、IMU传感器、电机驱动、CAN通信等嵌入式技术笔记',
    noteCount: 15,
  },
  {
    id: 'frontend',
    name: '前端开发',
    nameEn: 'Frontend',
    icon: '💻',
    description: 'HTML、CSS、JavaScript、Markdown 语法等前端基础知识学习笔记',
    noteCount: 4,
  },
  {
    id: 'cpp',
    name: 'C/C++',
    nameEn: 'C/C++',
    icon: '🔧',
    description: 'C语言基础、位运算、指针、继承与派生、Keil 优化等底层编程知识',
    noteCount: 4,
  },
  {
    id: 'vision',
    name: '计算机视觉与数学',
    nameEn: 'Vision & Math',
    icon: '👁️',
    description: '欧拉图、图论、计算机视觉与数学基础',
    noteCount: 2,
  },
  {
    id: 'projects',
    name: '项目实战',
    nameEn: 'Projects',
    icon: '🚀',
    description: 'Dart 裁判系统、RoboMaster 比赛项目经验',
    noteCount: 1,
  },
  {
    id: 'tools',
    name: '工具与部署',
    nameEn: 'Tools & Deploy',
    icon: '🛠️',
    description: 'Git、GitHub远程同步、网页发布公网、服务器部署等工具链笔记',
    noteCount: 3,
  },
  {
    id: 'misc',
    name: '杂项笔记',
    nameEn: 'Misc',
    icon: '📝',
    description: 'PowerShell、Qt API调用、服务器配置等工具使用笔记',
    noteCount: 3,
  },
];

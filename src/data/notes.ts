export interface Note {
  id: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  filePath: string;
  tags: string[];
}

export const notes: Note[] = [
  // 嵌入式开发
  {
    id: 'embedded-1',
    title: 'SWD通信时序原理 & Keil烧录Contents mismatch故障终极详解',
    category: 'embedded',
    date: '2025-07-01',
    summary: '深入剖析SWD双线调试协议时序原理，详解Keil四种复位模式，以及Contents mismatch错误的根本原因和解决方案...',
    filePath: '/notes/embedded/SWD通信时序原理 & Keil烧录Contents mismatch故障终极详解.md',
    tags: ['SWD', 'Keil', 'STM32', '调试'],
  },
  {
    id: 'embedded-2',
    title: 'PID_Advanced —— 电机建模与传递函数',
    category: 'embedded',
    date: '2025-06-28',
    summary: '从电机化学方程和机械方程出发，利用拉普拉斯变换推导传递函数，深入理解PID控制器的设计原理...',
    filePath: '/notes/embedded/PID_Advanced.md',
    tags: ['PID', '控制', '电机', '数学建模'],
  },
  {
    id: 'embedded-3',
    title: '卡尔曼滤波学习笔记',
    category: 'embedded',
    date: '2025-06-25',
    summary: '从协方差矩阵讲起，逐步推导卡尔曼滤波的五大核心公式，理解状态空间模型的预测与更新过程...',
    filePath: '/notes/embedded/卡尔曼滤波学习笔记.md',
    tags: ['卡尔曼滤波', '状态估计', '传感器'],
  },
  {
    id: 'embedded-4',
    title: '大疆DT7与DMA双缓冲区 —— STM32H7接收遥控器数据',
    category: 'embedded',
    date: '2025-06-20',
    summary: '详解DT7遥控器与DR16接收机的SBUS/DBUS协议，使用DMA双缓冲区在STM32H7上实现高效数据接收...',
    filePath: '/notes/embedded/大疆DT7与DMA双缓冲区.md',
    tags: ['DT7', 'DMA', 'STM32H7', '遥控器'],
  },
  {
    id: 'embedded-5',
    title: 'STM32内存布局 —— Flash、RAM、CCRAM详解',
    category: 'embedded',
    date: '2025-06-15',
    summary: '全面解析STM32的内存映射：FLASH存储代码和常量，RAM划分.data/.bss/堆/栈，以及CCRAM和Backup RAM的用途...',
    filePath: '/notes/embedded/STM32内存布局.md',
    tags: ['STM32', '内存', 'FLASH', 'RAM'],
  },
  {
    id: 'embedded-6',
    title: 'DM电机代码移植说明',
    category: 'embedded',
    date: '2025-06-10',
    summary: '达妙电机驱动代码的移植流程和注意事项，涵盖CAN通信配置、PID参数适配、电机标定等关键步骤...',
    filePath: '/notes/embedded/DM电机代码移植说明.md',
    tags: ['达妙电机', 'CAN', '移植'],
  },
  {
    id: 'embedded-7',
    title: 'OpenOCD配置说明',
    category: 'embedded',
    date: '2025-06-05',
    summary: 'OpenOCD的安装、配置文件编写、与调试器的连接方法，以及常见错误的排查指南...',
    filePath: '/notes/embedded/OpenOCD配置说明.md',
    tags: ['OpenOCD', '调试', 'STM32'],
  },
  {
    id: 'embedded-8',
    title: 'IMU零偏校准学习笔记',
    category: 'embedded',
    date: '2025-05-30',
    summary: 'MPU6050等IMU传感器的零偏校准方法，包括静止校准、温度补偿和在线校准策略...',
    filePath: '/notes/embedded/IMU零偏校准学习笔记.md',
    tags: ['IMU', 'MPU6050', '校准', '传感器'],
  },
  {
    id: 'embedded-9',
    title: 'VGD 2026 Dart Learning',
    category: 'embedded',
    date: '2025-05-25',
    summary: 'VGD战队 Dart 项目学习记录，涵盖裁判系统通信、电机控制、传感器数据融合等内容...',
    filePath: '/notes/embedded/VGD 2026 Dart Learning.md',
    tags: ['VGD', 'Dart', 'RoboMaster'],
  },
  {
    id: 'embedded-10',
    title: 'Parking —— 停车控制算法',
    category: 'embedded',
    date: '2025-05-20',
    summary: '机器人停车控制算法的实现，涉及位置环PID、速度规划、刹车策略等核心控制逻辑...',
    filePath: '/notes/embedded/Parking.md',
    tags: ['Parking', 'PID', '控制'],
  },
  {
    id: 'embedded-11',
    title: 'DMA 双缓冲',
    category: 'embedded',
    date: '2025-07-18',
    summary: '深入理解DMA双缓冲机制，包括ADC采集、串口接收的硬件双缓冲与软件双缓冲实现，以及环形缓冲区FIFO的完整架构...',
    filePath: '/notes/embedded/DMA 双缓冲.md',
    tags: ['DMA', '双缓冲', 'STM32', 'ADC', '串口'],
  },
  // C/C++
  {
    id: 'cpp-1',
    title: 'C语言基础 —— 位运算与指针',
    category: 'cpp',
    date: '2025-04-15',
    summary: '异或运算的应用技巧、指针的底层原理、数组与指针的关系、内存访问方式等C语言核心知识...',
    filePath: '/notes/C_C++/C.md',
    tags: ['C语言', '位运算', '指针'],
  },
  {
    id: 'cpp-2',
    title: 'C extra —— 进阶补充',
    category: 'cpp',
    date: '2025-04-10',
    summary: 'C语言的进阶知识点补充，包括内存管理、结构体对齐、函数指针等常被忽略的细节...',
    filePath: '/notes/C_C++/C extra.md',
    tags: ['C语言', '进阶', '内存'],
  },
  {
    id: 'cpp-3',
    title: '继承与派生',
    category: 'cpp',
    date: '2025-04-05',
    summary: 'C++面向对象编程核心概念：继承方式、虚函数表、多态实现原理、构造函数调用顺序...',
    filePath: '/notes/C_C++/继承与派生.md',
    tags: ['C++', '继承', '多态', '面向对象'],
  },
  // 前端开发
  {
    id: 'frontend-1',
    title: 'CSS 学习笔记',
    category: 'frontend',
    date: '2025-05-15',
    summary: '从CSS基础语法到复杂布局，系统学习选择器、盒模型、Flexbox、Grid、动画等核心技术...',
    filePath: '/notes/前端开发/CSS学习笔记.md',
    tags: ['CSS', '布局', '样式'],
  },
  {
    id: 'frontend-2',
    title: 'Markdown 语法学习笔记',
    category: 'frontend',
    date: '2025-05-10',
    summary: 'Markdown常用语法速查：标题、列表、代码块、表格、引用、数学公式等标记语言完整指南...',
    filePath: '/notes/前端开发/Markdown 语法学习笔记.md',
    tags: ['Markdown', '语法', '笔记'],
  },
  {
    id: 'frontend-3',
    title: '网页初尝试',
    category: 'frontend',
    date: '2025-05-05',
    summary: '第一次尝试做网页的实践记录，从零搭建HTML页面、引入CSS样式、添加交互效果的完整过程...',
    filePath: '/notes/前端开发/网页初尝试.md',
    tags: ['HTML', 'CSS', '入门'],
  },
  // 计算机视觉与数学
  {
    id: 'vision-1',
    title: '欧拉图 —— 图论基础',
    category: 'vision',
    date: '2025-04-20',
    summary: '欧拉图的定义、判定条件、Fleury算法和Hierholzer算法求解欧拉回路，以及工程中的应用场景...',
    filePath: '/notes/计算机视觉与数学/欧拉图.md',
    tags: ['欧拉图', '图论', '数学'],
  },
  // 项目实战
  {
    id: 'project-1',
    title: 'Dart 裁判系统 —— 通信协议与外设',
    category: 'projects',
    date: '2025-07-10',
    summary: 'Dart裁判系统的通信协议解析：帧格式定义、CRC校验、USART6+DMA2中断处理、GPIO调试指示灯...',
    filePath: '/notes/项目实战/Dart 裁判系统.md',
    tags: ['Dart', '裁判系统', '通信协议', 'RoboMaster'],
  },
  // 杂项
  {
    id: 'misc-1',
    title: 'Qt调用百度API进行操作',
    category: 'misc',
    date: '2025-03-20',
    summary: '使用Qt框架调用百度AI开放平台API，实现图像识别、文字识别等功能，含完整的请求封装和错误处理...',
    filePath: '/notes/杂项/Qt调用百度API进行操作.md',
    tags: ['Qt', 'API', '百度AI'],
  },
  {
    id: 'misc-2',
    title: '服务器配置与管理',
    category: 'misc',
    date: '2025-03-15',
    summary: 'Linux服务器基础配置：SSH远程登录、Nginx反向代理、防火墙设置、Docker容器部署等运维知识...',
    filePath: '/notes/杂项/服务器.md',
    tags: ['服务器', 'Linux', '运维'],
  },
  {
    id: 'misc-3',
    title: 'PowerShell 使用技巧',
    category: 'misc',
    date: '2025-03-10',
    summary: 'Windows PowerShell常用命令、脚本编写、自动化任务配置，提升开发效率的实用技巧合集...',
    filePath: '/notes/杂项/PowerShell.md',
    tags: ['PowerShell', 'Windows', '自动化'],
  },
];

export function getNotesByCategory(category: string): Note[] {
  if (category === 'all') return notes;
  return notes.filter(note => note.category === category);
}

export function getNoteById(id: string): Note | undefined {
  return notes.find(note => note.id === id);
}

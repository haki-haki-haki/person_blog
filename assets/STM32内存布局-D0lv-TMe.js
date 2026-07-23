const n=`[TOC]

# STM32内存布局

## FLASH

- 1MB~2MB
- 掉电不丢，读快写慢
- 存程序代码、常量、初始化数据

### FLASH布局

0x08000000 ──┬── 中断向量表（前512字节）
             ├── .isr_vector   ← 中断服务函数入口地址
             ├── .text         ← 程序代码（所有函数的机器指令）
             ├── .rodata       ← 只读常量（字符串、const变量）
             ├── .data         ← 初始化全局变量（非零初始值）的初始值
             └── .bss          ← 未初始化全局变量（零初始值）的占位符
0x080FFFFF ──┘

### demo

.text: 所有函数的机器码
  - Dart_Contral()、PID_calc()、MIT_CtrlMotor()、Referee_Read_Data()...

.rodata: 常量
  - "Hello" 这样的字符串（如果有的话）
  - CRC8 查表法的查找表（const uint8_t CRC8_TABLE[]）
  - 枚举的名字字符串（调试用）

.data: 有初始值的全局变量的初始值
  - motor_ctrl.J_est = 0.045f → 这个 0.045 在 FLASH 里，启动时拷贝到 RAM

.bss: 零初始化变量的占位（不占实际空间）
  - pid[7][4] 的各个成员初始为 0
  - Usart6_Buffer_Rx[200] 初始全零

### 拷贝过程

上电复位 → 硬件自动跳转到 0x08000000 的复位向量
             ↓
系统启动代码（在 .text 里）
             ↓
将 .data 段从 FLASH 拷贝到 RAM（比如 motor_ctrl 的初始值）
             ↓
将 .bss 段清零（所有未初始化变量 = 0）
             ↓
跳转到 main()

## RAM（SRAM）

- 192KB
- 掉电丢失，读写快
- 运行时变量、缓冲区、堆栈

### RAM布局

0x20000000 ──┬── .data         ← 有初始值的全局变量
             │   - motor_ctrl（0.045 来自 FLASH 拷贝）
             │   - trajectory
             │   - DART1
             │
             ├── .bss          ← 零初始化的全局/静态变量
             │   - pid[7][4]
             │   - Usart6_Buffer_Rx[200]
             │   - MOTOR_RX[6]
             │   - REF
             │
             ├── .heap         ← 堆（malloc/free 使用，你的项目未用）
             │
             └── .stack        ← 栈（从高地址往下长）
                 - 函数调用栈帧（返回地址、参数、局部变量）
                                  - 中断现场保存
0x20030000 ──┘

### 堆和栈

高地址
    ↓
栈 ←── 向下增长（函数调用越多，栈越往下）
    ↓
堆 →── 向上增长（malloc 越多，堆越往上）
    ↓
低地址

==如果栈和堆碰到一起 → 栈溢出 → 程序崩溃。==

## CCRAM

- 64KB
- 掉电丢失，CPU直连最快
- 高频数据、中断临时数据

## Backup RAM

- 4KB
- 掉电保留（需VBAT供电
- 关键参数、校准数据

## .bss 和 .data 区别

- .data 在flash有数据，存储初始值 拷贝到RAM里面
- .bss 不在flash 不占据它的内存 在RAM里面 运行时清零对应区域
`;export{n as default};

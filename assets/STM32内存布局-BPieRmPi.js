const r=`[TOC]\r
\r
# STM32内存布局\r
\r
## FLASH\r
\r
- 1MB~2MB\r
- 掉电不丢，读快写慢\r
- 存程序代码、常量、初始化数据\r
\r
### FLASH布局\r
\r
0x08000000 ──┬── 中断向量表（前512字节）\r
             ├── .isr_vector   ← 中断服务函数入口地址\r
             ├── .text         ← 程序代码（所有函数的机器指令）\r
             ├── .rodata       ← 只读常量（字符串、const变量）\r
             ├── .data         ← 初始化全局变量（非零初始值）的初始值\r
             └── .bss          ← 未初始化全局变量（零初始值）的占位符\r
0x080FFFFF ──┘\r
\r
### demo\r
\r
.text: 所有函数的机器码\r
  - Dart_Contral()、PID_calc()、MIT_CtrlMotor()、Referee_Read_Data()...\r
\r
.rodata: 常量\r
  - "Hello" 这样的字符串（如果有的话）\r
  - CRC8 查表法的查找表（const uint8_t CRC8_TABLE[]）\r
  - 枚举的名字字符串（调试用）\r
\r
.data: 有初始值的全局变量的初始值\r
  - motor_ctrl.J_est = 0.045f → 这个 0.045 在 FLASH 里，启动时拷贝到 RAM\r
\r
.bss: 零初始化变量的占位（不占实际空间）\r
  - pid[7][4] 的各个成员初始为 0\r
  - Usart6_Buffer_Rx[200] 初始全零\r
\r
### 拷贝过程\r
\r
上电复位 → 硬件自动跳转到 0x08000000 的复位向量\r
             ↓\r
系统启动代码（在 .text 里）\r
             ↓\r
将 .data 段从 FLASH 拷贝到 RAM（比如 motor_ctrl 的初始值）\r
             ↓\r
将 .bss 段清零（所有未初始化变量 = 0）\r
             ↓\r
跳转到 main()\r
\r
## RAM（SRAM）\r
\r
- 192KB\r
- 掉电丢失，读写快\r
- 运行时变量、缓冲区、堆栈\r
\r
### RAM布局\r
\r
0x20000000 ──┬── .data         ← 有初始值的全局变量\r
             │   - motor_ctrl（0.045 来自 FLASH 拷贝）\r
             │   - trajectory\r
             │   - DART1\r
             │\r
             ├── .bss          ← 零初始化的全局/静态变量\r
             │   - pid[7][4]\r
             │   - Usart6_Buffer_Rx[200]\r
             │   - MOTOR_RX[6]\r
             │   - REF\r
             │\r
             ├── .heap         ← 堆（malloc/free 使用，你的项目未用）\r
             │\r
             └── .stack        ← 栈（从高地址往下长）\r
                 - 函数调用栈帧（返回地址、参数、局部变量）\r
                                  - 中断现场保存\r
0x20030000 ──┘\r
\r
### 堆和栈\r
\r
高地址\r
    ↓\r
栈 ←── 向下增长（函数调用越多，栈越往下）\r
    ↓\r
堆 →── 向上增长（malloc 越多，堆越往上）\r
    ↓\r
低地址\r
\r
==如果栈和堆碰到一起 → 栈溢出 → 程序崩溃。==\r
\r
## CCRAM\r
\r
- 64KB\r
- 掉电丢失，CPU直连最快\r
- 高频数据、中断临时数据\r
\r
## Backup RAM\r
\r
- 4KB\r
- 掉电保留（需VBAT供电\r
- 关键参数、校准数据\r
\r
## .bss 和 .data 区别\r
\r
- .data 在flash有数据，存储初始值 拷贝到RAM里面\r
- .bss 不在flash 不占据它的内存 在RAM里面 运行时清零对应区域\r
`;export{r as default};

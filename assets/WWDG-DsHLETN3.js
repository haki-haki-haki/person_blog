const n=`[TOC]\r
\r
# WWDG\r
\r
单片机在日常工作中常常会因为用户配置代码出现BUG ，而导致芯片无法正常工作；或者会受到来自外界电磁场的干扰，造成**\`程序跑飞 \`**，或陷入**\`死循环 \`**，如果无法系统复位，那么整个系统都会卡死。\r
\r
检测单片机的运行状态，一种专门用于检测单片机程序运行状态的模块或者芯片 watchdog\r
\r
## IWDG\r
\r
独立看门狗\r
\r
### 原理\r
\r
V~DD~独立供电\r
\r
时钟来源：LSI 低速时钟 32KHz \r
\r
流程：低速时钟LSI经过预分频器驱动12位的递减计数器，递减至重装载值，若未及时喂狗就会产生复位信号，单片机系统复位，重新运行\r
\r
\`\`\`mermaid\r
flowchart LR\r
    subgraph VDD电压域\r
        LSI["LSI低速时钟输入"] --> PRE["8位预分频器"]\r
        \r
        PR["IWDG_PR 预分频寄存器"] -.控制.-> PRE\r
        PRE -.状态反馈.-> SR["IWDG_SR 状态寄存器"]\r
\r
        RLR["IWDG_RLR 重载寄存器"] -.写入.-> REL["12位重载值缓存"]\r
        KR["IWDG_KR 密钥寄存器"] -.解锁/喂狗.-> REL\r
        REL --> CNT["12位递减计数器"]\r
        PRE --> CNT\r
        CNT -.状态反馈.-> SR\r
        CNT --> RST["IWDG复位输出"]\r
    end\r
\`\`\`\r
\r
#### 状态寄存器\r
\r
件状态反馈寄存器  告诉 CPU：预分频器、重载值的硬件更新有没有完成\r
\r
#### 重载计时器\r
\r
看门狗超时计数值 12位递减计数器的输出填充值\r
\r
#### 密钥寄存器\r
\r
代码执行喂狗：向 \`IWDG_KR\` 写入喂狗密钥 \`0xAAAA\`\r
\r
### 配置\r
\r
3个参数\r
\r
- IWDG counter clock prescaler：分频系数\r
-  IWDG down-counter reload value：重装载值\r
- IWDG window value ： 窗口值（默认不修改。当计数器的值大于窗口值时，如果执行重载操作，则会产生复位）  比重装载值大\r
\r
**IWDG溢出时间计算公式：**\r
$$\r
T_{out} = \\frac{N_{prescaler} \\times N_{reload}}{f_{IWDG}}\r
$$\r
N~prescaler~分频系数	N~reload~重装载值	f~IWDG~低速时钟频率\r
\r
### 函数\r
\r
初始化函数：HAL_StatusTypeDef HAL_IWDG_Init(IWDG_HandleTypeDef *hiwdg)\r
\r
喂狗函数：HAL_StatusTypeDef HAL_IWDG_Refresh(IWDG_HandleTypeDef *hiwdg)\r
\r
## WWDG\r
\r
### 原理\r
\r
窗口看门狗\r
\r
窗口看门狗的的时钟信号来自**\`PCLK1\`**，然后经过**\`看门狗预分频器\`**进行分频处理\r
\r
**\`看门狗控制寄存器(WWDG_CR)\`**为8位寄存器 ，其中首位为使能位，用于开启看门狗。后面为T[6:0] 的值。寄存器后六位为递减计数器(CNT)，由分频后的时钟信号进行驱动。\r
\r
| 位序号    | 名称   | 功能说明                                          |\r
| --------- | ------ | ------------------------------------------------- |\r
| Bit7      | WDGA   | WWDG 激活使能位（总开关）                         |\r
| Bit6~Bit0 | T[6:0] | 7 位递减计数器（T6 是激活标志位，T5~T0 为计数位） |\r
\r
**\`看门狗配置寄存器(WWDG_CFR)\`**，寄存器的值为窗口上限值，当看门狗控制寄存器的值W6大于看门狗配置寄存器的值T6，则说明已经进入窗口期（比较器输出0），否则为非窗口期（比较器输出1）。\r
\r
| 位段      | 位名称          | 功能说明                              |\r
| --------- | --------------- | ------------------------------------- |\r
| Bit9~Bit8 | WDGTB1 / WDGTB0 | 预分频选择位（可编程分频 Nprescaler） |\r
| Bit6~Bit0 | W[6:0]          | 窗口阈值数值（窗口判断分界线）        |\r
| Bit9      | EWI             | 提前唤醒中断使能位                    |\r
\r
Bit6~Bit0：W [6:0] 窗口阈值（窗口值）\r
\r
7 位窗口分界线，和 WWDG_CR 里的 7 位计数器实时比较：\r
\r
1. 当前计数器值 **> W 窗口值**：禁止喂狗区，此时调用喂狗直接硬件复位；\r
2. 当前计数器值 **≤ W 窗口值**：允许喂狗区，喂狗才会正常重载计数器；\r
\r
![img](/person_blog/notes-images/imported/wwdg-window-diagram.png)\r
\r
可产生复位信号和提前唤醒\r
\r
1. 复位条件：递减计数器值从0x40到0x3F\r
2. 复位条件：计数器值大于**\`W[6:0]\`**时喂狗复位\r
3. 中断条件：递减计数器等于0x40 提前唤醒中断\r
4. 喂狗条件 需要在窗口期（**\`0x3F<窗口期< W[6:0]\`**）重装载计数器的值，才能防止复位\r
\r
### 配置\r
\r
5个参数\r
\r
- WWDG counter clock prescaler：分频系数\r
\r
- WWDG window value ： 窗口上限值，即W[6:0]（即喂狗的窗口区间在0x3F ~ WWDG window value之间） 喂狗合法区间：\`0x3F < 当前计数值 ≤ 窗口上限W\`\r
\r
- WWDG free-running downcounter value：每次复位后重新装载的值，递减到窗口区间内才可以刷新。这个值必须大于0x40和WWDG window value。上电 / 喂狗后重载到\`WWDG_CR\`7 位计数器，**数值必须同时大于 0x40、大于窗口上限 W**。\r
\r
- Early wakeup interrupt ：早期唤醒中断，在看门狗全局中断打开的基础上，开启后当计数器到达0x40时会进入早期唤醒回调函数，可以在早期唤醒中断回调函数中进行喂狗或者函数操作。\r
\r
- Window watchdog interrupt：窗口看门狗全局中断。在NVIC Settings中，若Early wakeup interrupt为Enable，则该中断需要打开。\r
\r
**WWDG溢出时间计算公式：**\r
\r
### 函数\r
\r
初始化：HAL_StatusTypeDef HAL_WWDG_Init(WWDG_HandleTypeDef *hwwdg)\r
\r
喂狗函数：HAL_StatusTypeDef HAL_WWDG_Refresh(WWDG_HandleTypeDef *hwwdg)\r
\r
中断服务函数：void HAL_WWDG_IRQHandler(WWDG_HandleTypeDef *hwwdg)\r
\r
**早期唤醒回调函数**\r
\r
__weak void HAL_WWDG_EarlyWakeupCallback(WWDG_HandleTypeDef *hwwdg)\r
{\r
  /* Prevent unused argument(s) compilation warning */\r
  UNUSED(hwwdg);\r
\r
}\r
\r
## IWDG demo\r
\r
\`\`\`c\r
#include "stm32f1xx_hal.h"\r
\r
IWDG_HandleTypeDef hiwdg;\r
\r
void MX_IWDG_Init(void)\r
{\r
  hiwdg.Instance = IWDG;\r
  // 1.分频系数\r
  hiwdg.Init.Prescaler = IWDG_PRESCALER_32;\r
  // 2.重载值\r
  hiwdg.Init.Reload = 1000;\r
  // 3.窗口值默认4095，关闭窗口功能\r
  hiwdg.Init.Window = 4095;\r
\r
  if (HAL_IWDG_Init(&hiwdg) != HAL_OK)\r
  {\r
    Error_Handler();\r
  }\r
}\r
\r
int main(void)\r
{\r
  HAL_Init();\r
  SystemClock_Config();\r
  MX_GPIO_Init();\r
  MX_IWDG_Init(); // 启动独立看门狗\r
\r
  while (1)\r
  {\r
    HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_0);\r
    HAL_Delay(500);\r
\r
    // 喂狗，重置计数器\r
    HAL_IWDG_Refresh(&hiwdg);\r
  }\r
}\r
\`\`\`\r
\r
## WWDG demo1\r
\r
初始化\r
\r
\`\`\`c\r
#include "stm32f1xx_hal.h"\r
\r
WWDG_HandleTypeDef hwwdg;\r
\r
void MX_WWDG_Init(void)\r
{\r
  hwwdg.Instance = WWDG;\r
  // 1.WWDG counter clock prescaler 分频系数\r
  hwwdg.Init.Prescaler = WWDG_PRESCALER_8;\r
  // 2.WWDG window value 窗口上限W\r
  hwwdg.Init.Window = 0x50;\r
  // 3.free-running downcounter value 计数器初始装载值(必须>0x50、>0x40)\r
  hwwdg.Init.Counter = 0x7F;\r
  // 4.Early wakeup interrupt 开启提前唤醒中断\r
  hwwdg.Init.EWIMode = WWDG_EWI_ENABLE;\r
\r
  if (HAL_WWDG_Init(&hwwdg) != HAL_OK)\r
  {\r
    Error_Handler();\r
  }\r
}\r
\`\`\`\r
\r
中断\r
\r
\`\`\`c\r
extern WWDG_HandleTypeDef hwwdg;\r
\r
// WWDG全局中断服务函数，NVIC开启中断后才会进入\r
void WWDG_IRQHandler(void)\r
{\r
  HAL_WWDG_IRQHandler(&hwwdg);\r
}\r
\r
uint8_t wwdg_err_flag = 0;\r
\r
// 计数器到0x40自动执行此回调\r
void HAL_WWDG_EarlyWakeupCallback(WWDG_HandleTypeDef *hwwdg)\r
{\r
  __disable_irq();\r
  wwdg_err_flag = 1; // 标记程序超时故障\r
  SaveFaultLog();    // 保存故障日志\r
\r
  // 可选：HAL_WWDG_Refresh(hwwdg); // 喂狗取消复位\r
\r
  __enable_irq();\r
}\r
\`\`\`\r
\r
\`\`\`c\r
int main(void)\r
{\r
  HAL_Init();\r
  SystemClock_Config();\r
  MX_GPIO_Init();\r
  MX_WWDG_Init();\r
\r
  while (1)\r
  {\r
    HAL_GPIO_TogglePin(GPIOB, GPIO_PIN_0);\r
    HAL_Delay(40); // 延时落在合法窗口期内\r
\r
    // 仅在 0x3F < 计数值 ≤0x50 区间喂狗才有效\r
    HAL_WWDG_Refresh(&hwwdg);\r
  }\r
}\r
\`\`\`\r
\r
## WWDG demo2\r
\r
\`\`\`c\r
// 故障标记枚举\r
typedef enum\r
{\r
    FAULT_NONE = 0,\r
    FAULT_WWDG_TIMEOUT = 1,  // WWDG看门狗超时卡死\r
    FAULT_HARD_FAULT = 2,    // 硬件错误（数组越界、空指针）\r
} FaultTypeDef;\r
\r
// 故障日志结构体（存在后备SRAM）\r
typedef struct\r
{\r
    FaultTypeDef fault_type;  // 故障类型\r
    uint32_t tick_time;       // 卡死时系统滴答计时\r
    uint32_t stack_addr;      // 堆栈地址（辅助定位代码行）\r
} FaultLogTypeDef;\r
\r
// 后备SRAM起始地址，F1系列BKPSRAM基地址0x40006000\r
#define FAULT_LOG_ADDR ((FaultLogTypeDef *)0x40006000)\r
FaultLogTypeDef *g_fault_log = FAULT_LOG_ADDR;\r
\r
// WWDG句柄\r
WWDG_HandleTypeDef hwwdg;\r
// 写入故障日志到后备SRAM\r
void WriteFaultLog(FaultTypeDef fault)\r
{\r
    g_fault_log->fault_type = fault;\r
    g_fault_log->tick_time = HAL_GetTick();\r
    g_fault_log->stack_addr = __get_MSP(); // 获取当前栈指针\r
}\r
\r
// 上电读取故障日志，判断上次是否死机\r
void ReadAndPrintFaultLog(void)\r
{\r
    if(g_fault_log->fault_type != FAULT_NONE)\r
    {\r
        // 串口打印，需要提前初始化USART\r
        printf("=====上次死机记录=====\\r\\n");\r
        if(g_fault_log->fault_type == FAULT_WWDG_TIMEOUT)\r
        {\r
            printf("故障原因：WWDG窗口看门狗超时，主循环卡死/喂狗延迟\\r\\n");\r
        }\r
        else if(g_fault_log->fault_type == FAULT_HARD_FAULT)\r
        {\r
            printf("故障原因：硬件错误，空指针/数组越界\\r\\n");\r
        }\r
        printf("卡死时系统运行时间：%d ms\\r\\n", g_fault_log->tick_time);\r
        printf("卡死堆栈地址：0x%08X\\r\\n", g_fault_log->stack_addr);\r
        printf("========================\\r\\n");\r
        \r
        // 清除故障标记，避免反复打印\r
        g_fault_log->fault_type = FAULT_NONE;\r
    }\r
    else\r
    {\r
        printf("上次上电无死机故障\\r\\n");\r
    }\r
}\r
3. WWDG 初始化（开启提前唤醒中断）\r
c\r
运行\r
void MX_WWDG_Init(void)\r
{\r
  hwwdg.Instance = WWDG;\r
  hwwdg.Init.Prescaler = WWDG_PRESCALER_8;\r
  hwwdg.Init.Window = 0x50;\r
  hwwdg.Init.Counter = 0x7F;\r
  hwwdg.Init.EWIMode = WWDG_EWI_ENABLE; // 开启提前唤醒中断\r
\r
  if (HAL_WWDG_Init(&hwwdg) != HAL_OK)\r
  {\r
    Error_Handler();\r
  }\r
}\r
\r
void HAL_WWDG_EarlyWakeupCallback(WWDG_HandleTypeDef *hwwdg)\r
{\r
  __disable_irq(); // 关闭所有中断，防止打断日志写入\r
  // 把卡死现场存入后备SRAM\r
  WriteFaultLog(FAULT_WWDG_TIMEOUT);\r
  // 重点：这里不喂狗！等待自动复位，保留故障现场\r
  // HAL_WWDG_Refresh(hwwdg);\r
  __enable_irq();\r
}\r
extern WWDG_HandleTypeDef hwwdg;\r
void WWDG_IRQHandler(void)\r
{\r
  HAL_WWDG_IRQHandler(&hwwdg);\r
}\r
\r
int main(void)\r
{\r
  HAL_Init();\r
  SystemClock_Config();\r
  MX_USART1_UART_Init(); // 串口打印日志\r
  MX_GPIO_Init();\r
  MX_WWDG_Init();\r
\r
  // 上电第一步：读取上次死机日志，串口打印\r
  ReadAndPrintFaultLog();\r
\r
  while (1)\r
  {\r
    HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_0);\r
    HAL_Delay(40);\r
\r
    // 正常业务执行完喂狗\r
    HAL_WWDG_Refresh(&hwwdg);\r
    // ========== 测试卡死代码，取消注释复现故障 ==========\r
    // while(1); // 死循环卡死，不再执行喂狗\r
  }\r
}\r
\`\`\`\r
\r
WWDG 计数到\`0x40\`会进**提前唤醒回调**，此时还没复位，是唯一能抢救现场的时机；\r
\r
普通 RAM 重启会清空，所以用**后备 SRAM（BKPSRAM）** 存故障信息，断电才清空，重启后可读；\r
\r
制造卡死（取消\`while(1);\`注释）\r
\r
1. 程序进入死循环，再也不会执行喂狗；\r
2. WWDG 计数器持续递减，降到\`0x40\`；\r
3. 触发提前唤醒中断，进入\`HAL_WWDG_EarlyWakeupCallback\`；\r
4. 执行\`WriteFaultLog\`，把**故障类型、卡死时间、堆栈地址**存入后备 SRAM；\r
5. 回调不喂狗，计数器继续降到\`0x3F\`，芯片自动复位重启。\r
`;export{n as default};

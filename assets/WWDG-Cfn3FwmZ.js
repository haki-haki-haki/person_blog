const n=`[TOC]

# WWDG

单片机在日常工作中常常会因为用户配置代码出现BUG ，而导致芯片无法正常工作；或者会受到来自外界电磁场的干扰，造成**\`程序跑飞 \`**，或陷入**\`死循环 \`**，如果无法系统复位，那么整个系统都会卡死。

检测单片机的运行状态，一种专门用于检测单片机程序运行状态的模块或者芯片 watchdog

## IWDG

独立看门狗

### 原理

V~DD~独立供电

时钟来源：LSI 低速时钟 32KHz 

流程：低速时钟LSI经过预分频器驱动12位的递减计数器，递减至重装载值，若未及时喂狗就会产生复位信号，单片机系统复位，重新运行

\`\`\`mermaid
flowchart LR
    subgraph VDD电压域
        LSI["LSI低速时钟输入"] --> PRE["8位预分频器"]
        
        PR["IWDG_PR 预分频寄存器"] -.控制.-> PRE
        PRE -.状态反馈.-> SR["IWDG_SR 状态寄存器"]

        RLR["IWDG_RLR 重载寄存器"] -.写入.-> REL["12位重载值缓存"]
        KR["IWDG_KR 密钥寄存器"] -.解锁/喂狗.-> REL
        REL --> CNT["12位递减计数器"]
        PRE --> CNT
        CNT -.状态反馈.-> SR
        CNT --> RST["IWDG复位输出"]
    end
\`\`\`

#### 状态寄存器

件状态反馈寄存器  告诉 CPU：预分频器、重载值的硬件更新有没有完成

#### 重载计时器

看门狗超时计数值 12位递减计数器的输出填充值

#### 密钥寄存器

代码执行喂狗：向 \`IWDG_KR\` 写入喂狗密钥 \`0xAAAA\`

### 配置

3个参数

- IWDG counter clock prescaler：分频系数
-  IWDG down-counter reload value：重装载值
- IWDG window value ： 窗口值（默认不修改。当计数器的值大于窗口值时，如果执行重载操作，则会产生复位）  比重装载值大

**IWDG溢出时间计算公式：**
$$
T_{out} = \\frac{N_{prescaler} \\times N_{reload}}{f_{IWDG}}
$$
N~prescaler~分频系数	N~reload~重装载值	f~IWDG~低速时钟频率

### 函数

初始化函数：HAL_StatusTypeDef HAL_IWDG_Init(IWDG_HandleTypeDef *hiwdg)

喂狗函数：HAL_StatusTypeDef HAL_IWDG_Refresh(IWDG_HandleTypeDef *hiwdg)

## WWDG

### 原理

窗口看门狗

窗口看门狗的的时钟信号来自**\`PCLK1\`**，然后经过**\`看门狗预分频器\`**进行分频处理

**\`看门狗控制寄存器(WWDG_CR)\`**为8位寄存器 ，其中首位为使能位，用于开启看门狗。后面为T[6:0] 的值。寄存器后六位为递减计数器(CNT)，由分频后的时钟信号进行驱动。

| 位序号    | 名称   | 功能说明                                          |
| --------- | ------ | ------------------------------------------------- |
| Bit7      | WDGA   | WWDG 激活使能位（总开关）                         |
| Bit6~Bit0 | T[6:0] | 7 位递减计数器（T6 是激活标志位，T5~T0 为计数位） |

**\`看门狗配置寄存器(WWDG_CFR)\`**，寄存器的值为窗口上限值，当看门狗控制寄存器的值W6大于看门狗配置寄存器的值T6，则说明已经进入窗口期（比较器输出0），否则为非窗口期（比较器输出1）。

| 位段      | 位名称          | 功能说明                              |
| --------- | --------------- | ------------------------------------- |
| Bit9~Bit8 | WDGTB1 / WDGTB0 | 预分频选择位（可编程分频 Nprescaler） |
| Bit6~Bit0 | W[6:0]          | 窗口阈值数值（窗口判断分界线）        |
| Bit9      | EWI             | 提前唤醒中断使能位                    |

Bit6~Bit0：W [6:0] 窗口阈值（窗口值）

7 位窗口分界线，和 WWDG_CR 里的 7 位计数器实时比较：

1. 当前计数器值 **> W 窗口值**：禁止喂狗区，此时调用喂狗直接硬件复位；
2. 当前计数器值 **≤ W 窗口值**：允许喂狗区，喂狗才会正常重载计数器；

![img](/person_blog/notes-images/imported/wwdg-window-diagram.png)

可产生复位信号和提前唤醒

1. 复位条件：递减计数器值从0x40到0x3F
2. 复位条件：计数器值大于**\`W[6:0]\`**时喂狗复位
3. 中断条件：递减计数器等于0x40 提前唤醒中断
4. 喂狗条件 需要在窗口期（**\`0x3F<窗口期< W[6:0]\`**）重装载计数器的值，才能防止复位

### 配置

5个参数

- WWDG counter clock prescaler：分频系数

- WWDG window value ： 窗口上限值，即W[6:0]（即喂狗的窗口区间在0x3F ~ WWDG window value之间） 喂狗合法区间：\`0x3F < 当前计数值 ≤ 窗口上限W\`

- WWDG free-running downcounter value：每次复位后重新装载的值，递减到窗口区间内才可以刷新。这个值必须大于0x40和WWDG window value。上电 / 喂狗后重载到\`WWDG_CR\`7 位计数器，**数值必须同时大于 0x40、大于窗口上限 W**。

- Early wakeup interrupt ：早期唤醒中断，在看门狗全局中断打开的基础上，开启后当计数器到达0x40时会进入早期唤醒回调函数，可以在早期唤醒中断回调函数中进行喂狗或者函数操作。

- Window watchdog interrupt：窗口看门狗全局中断。在NVIC Settings中，若Early wakeup interrupt为Enable，则该中断需要打开。

**WWDG溢出时间计算公式：**

### 函数

初始化：HAL_StatusTypeDef HAL_WWDG_Init(WWDG_HandleTypeDef *hwwdg)

喂狗函数：HAL_StatusTypeDef HAL_WWDG_Refresh(WWDG_HandleTypeDef *hwwdg)

中断服务函数：void HAL_WWDG_IRQHandler(WWDG_HandleTypeDef *hwwdg)

**早期唤醒回调函数**

__weak void HAL_WWDG_EarlyWakeupCallback(WWDG_HandleTypeDef *hwwdg)
{
  /* Prevent unused argument(s) compilation warning */
  UNUSED(hwwdg);

}

## IWDG demo

\`\`\`c
#include "stm32f1xx_hal.h"

IWDG_HandleTypeDef hiwdg;

void MX_IWDG_Init(void)
{
  hiwdg.Instance = IWDG;
  // 1.分频系数
  hiwdg.Init.Prescaler = IWDG_PRESCALER_32;
  // 2.重载值
  hiwdg.Init.Reload = 1000;
  // 3.窗口值默认4095，关闭窗口功能
  hiwdg.Init.Window = 4095;

  if (HAL_IWDG_Init(&hiwdg) != HAL_OK)
  {
    Error_Handler();
  }
}

int main(void)
{
  HAL_Init();
  SystemClock_Config();
  MX_GPIO_Init();
  MX_IWDG_Init(); // 启动独立看门狗

  while (1)
  {
    HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_0);
    HAL_Delay(500);

    // 喂狗，重置计数器
    HAL_IWDG_Refresh(&hiwdg);
  }
}
\`\`\`

## WWDG demo1

初始化

\`\`\`c
#include "stm32f1xx_hal.h"

WWDG_HandleTypeDef hwwdg;

void MX_WWDG_Init(void)
{
  hwwdg.Instance = WWDG;
  // 1.WWDG counter clock prescaler 分频系数
  hwwdg.Init.Prescaler = WWDG_PRESCALER_8;
  // 2.WWDG window value 窗口上限W
  hwwdg.Init.Window = 0x50;
  // 3.free-running downcounter value 计数器初始装载值(必须>0x50、>0x40)
  hwwdg.Init.Counter = 0x7F;
  // 4.Early wakeup interrupt 开启提前唤醒中断
  hwwdg.Init.EWIMode = WWDG_EWI_ENABLE;

  if (HAL_WWDG_Init(&hwwdg) != HAL_OK)
  {
    Error_Handler();
  }
}
\`\`\`

中断

\`\`\`c
extern WWDG_HandleTypeDef hwwdg;

// WWDG全局中断服务函数，NVIC开启中断后才会进入
void WWDG_IRQHandler(void)
{
  HAL_WWDG_IRQHandler(&hwwdg);
}

uint8_t wwdg_err_flag = 0;

// 计数器到0x40自动执行此回调
void HAL_WWDG_EarlyWakeupCallback(WWDG_HandleTypeDef *hwwdg)
{
  __disable_irq();
  wwdg_err_flag = 1; // 标记程序超时故障
  SaveFaultLog();    // 保存故障日志

  // 可选：HAL_WWDG_Refresh(hwwdg); // 喂狗取消复位

  __enable_irq();
}
\`\`\`

\`\`\`c
int main(void)
{
  HAL_Init();
  SystemClock_Config();
  MX_GPIO_Init();
  MX_WWDG_Init();

  while (1)
  {
    HAL_GPIO_TogglePin(GPIOB, GPIO_PIN_0);
    HAL_Delay(40); // 延时落在合法窗口期内

    // 仅在 0x3F < 计数值 ≤0x50 区间喂狗才有效
    HAL_WWDG_Refresh(&hwwdg);
  }
}
\`\`\`

## WWDG demo2

\`\`\`c
// 故障标记枚举
typedef enum
{
    FAULT_NONE = 0,
    FAULT_WWDG_TIMEOUT = 1,  // WWDG看门狗超时卡死
    FAULT_HARD_FAULT = 2,    // 硬件错误（数组越界、空指针）
} FaultTypeDef;

// 故障日志结构体（存在后备SRAM）
typedef struct
{
    FaultTypeDef fault_type;  // 故障类型
    uint32_t tick_time;       // 卡死时系统滴答计时
    uint32_t stack_addr;      // 堆栈地址（辅助定位代码行）
} FaultLogTypeDef;

// 后备SRAM起始地址，F1系列BKPSRAM基地址0x40006000
#define FAULT_LOG_ADDR ((FaultLogTypeDef *)0x40006000)
FaultLogTypeDef *g_fault_log = FAULT_LOG_ADDR;

// WWDG句柄
WWDG_HandleTypeDef hwwdg;
// 写入故障日志到后备SRAM
void WriteFaultLog(FaultTypeDef fault)
{
    g_fault_log->fault_type = fault;
    g_fault_log->tick_time = HAL_GetTick();
    g_fault_log->stack_addr = __get_MSP(); // 获取当前栈指针
}

// 上电读取故障日志，判断上次是否死机
void ReadAndPrintFaultLog(void)
{
    if(g_fault_log->fault_type != FAULT_NONE)
    {
        // 串口打印，需要提前初始化USART
        printf("=====上次死机记录=====\\r\\n");
        if(g_fault_log->fault_type == FAULT_WWDG_TIMEOUT)
        {
            printf("故障原因：WWDG窗口看门狗超时，主循环卡死/喂狗延迟\\r\\n");
        }
        else if(g_fault_log->fault_type == FAULT_HARD_FAULT)
        {
            printf("故障原因：硬件错误，空指针/数组越界\\r\\n");
        }
        printf("卡死时系统运行时间：%d ms\\r\\n", g_fault_log->tick_time);
        printf("卡死堆栈地址：0x%08X\\r\\n", g_fault_log->stack_addr);
        printf("========================\\r\\n");
        
        // 清除故障标记，避免反复打印
        g_fault_log->fault_type = FAULT_NONE;
    }
    else
    {
        printf("上次上电无死机故障\\r\\n");
    }
}
3. WWDG 初始化（开启提前唤醒中断）
c
运行
void MX_WWDG_Init(void)
{
  hwwdg.Instance = WWDG;
  hwwdg.Init.Prescaler = WWDG_PRESCALER_8;
  hwwdg.Init.Window = 0x50;
  hwwdg.Init.Counter = 0x7F;
  hwwdg.Init.EWIMode = WWDG_EWI_ENABLE; // 开启提前唤醒中断

  if (HAL_WWDG_Init(&hwwdg) != HAL_OK)
  {
    Error_Handler();
  }
}

void HAL_WWDG_EarlyWakeupCallback(WWDG_HandleTypeDef *hwwdg)
{
  __disable_irq(); // 关闭所有中断，防止打断日志写入
  // 把卡死现场存入后备SRAM
  WriteFaultLog(FAULT_WWDG_TIMEOUT);
  // 重点：这里不喂狗！等待自动复位，保留故障现场
  // HAL_WWDG_Refresh(hwwdg);
  __enable_irq();
}
extern WWDG_HandleTypeDef hwwdg;
void WWDG_IRQHandler(void)
{
  HAL_WWDG_IRQHandler(&hwwdg);
}

int main(void)
{
  HAL_Init();
  SystemClock_Config();
  MX_USART1_UART_Init(); // 串口打印日志
  MX_GPIO_Init();
  MX_WWDG_Init();

  // 上电第一步：读取上次死机日志，串口打印
  ReadAndPrintFaultLog();

  while (1)
  {
    HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_0);
    HAL_Delay(40);

    // 正常业务执行完喂狗
    HAL_WWDG_Refresh(&hwwdg);
    // ========== 测试卡死代码，取消注释复现故障 ==========
    // while(1); // 死循环卡死，不再执行喂狗
  }
}
\`\`\`

WWDG 计数到\`0x40\`会进**提前唤醒回调**，此时还没复位，是唯一能抢救现场的时机；

普通 RAM 重启会清空，所以用**后备 SRAM（BKPSRAM）** 存故障信息，断电才清空，重启后可读；

制造卡死（取消\`while(1);\`注释）

1. 程序进入死循环，再也不会执行喂狗；
2. WWDG 计数器持续递减，降到\`0x40\`；
3. 触发提前唤醒中断，进入\`HAL_WWDG_EarlyWakeupCallback\`；
4. 执行\`WriteFaultLog\`，把**故障类型、卡死时间、堆栈地址**存入后备 SRAM；
5. 回调不喂狗，计数器继续降到\`0x3F\`，芯片自动复位重启。
`;export{n as default};

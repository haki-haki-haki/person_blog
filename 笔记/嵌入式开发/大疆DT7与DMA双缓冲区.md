# DT7遥控器与STM32H7接收学习笔记

> 整理来源：
> - 《DT7&DR16 2.4GHz遥控接收系统用户手册》
> - 《STM32H7系列教程2：使用DMA双缓冲区接收大疆DT7遥控器数据(SBUS/DBUS协议)》

---

## 一、DT7&DR16遥控接收系统概述

### 1.1 产品简介

- **DT7遥控器**：工作于 **2.4 GHz** 频段的无线电通信设备，仅能与 **DR16接收机** 配合使用。
- **DR16接收机**：工作频率为 **2.4 GHz** 的 **16通道** 接收机。
- **控制距离**：开阔室外最大可达 **1000 m**
- **工作时间**：最长可达 **12小时**

### 1.2 规格参数

| 项目 | DT7遥控器 | DR16接收机 |
|------|-----------|------------|
| 工作频率 | 2.4 GHz ISM | 2.4 GHz |
| 特性 | 7通道 | D-BUS协议 |
| 工作电流/电压 | 120 mA @ 3.7 V | 145 mA @ 5 V |
| 电池 | 3.7 V 2000 mAh 锂电池 | — |
| 电源 | — | 4 - 8.4 V |
| 尺寸 | — | 41 mm x 29 mm x 5 mm |
| 重量 | — | 10 g |
| 接收灵敏度 | — | -97 dBm (1% PER) |

### 1.3 DT7遥控器结构

- 天线 / 提手
- 云台俯仰控制拨轮
- 三位开关 S1、S2
- 摇杆（J1~J4）
- 教练口
- 电源开关 / 电源指示灯 / 电量指示灯
- 调参接口（Micro-USB）

### 1.4 DR16接收机接口

- 天线 / LED指示灯 / 对频按键
- **EXP** / **DBUS** / **VCC** / **GND**

---

## 二、DT7遥控器操作

### 2.1 开启与关闭

1. **向右推**电源开关，开启遥控器
2. 电源指示灯**绿灯常亮**表示正常工作
3. 通过**电量指示灯**查看电量（25%、50%、75%、100%）
4. **向左推**电源开关关闭遥控器

### 2.2 充电

- 通过**调参接口**充电，**关机状态**下充电
- 充电时电源指示灯**红灯常亮**
- 充满后电源指示灯**绿灯常亮**

### 2.3 电源指示灯状态

| 指示灯状态 | 提示音 | 描述 |
|-----------|--------|------|
| 绿灯常亮 | 无 | 正常工作 |
| 红灯快闪 | B-B-B... | 低电压报警（< 3.5 V），请马上充电 |
| 红灯慢闪 | B--B--B... | 开启后15分钟内无操作 |

> **注意**：电压低于 **3.3 V** 时遥控器将立刻自动关机！

### 2.4 云台俯仰控制拨轮

- **顺时针拨动**：云台向上转动
- **逆时针拨动**：云台向下转动

### 2.5 油门杆锁定装置

- 轻推油门杆至**最低位置**直至"咔"声后锁定，飞行器缓慢下降
- 向上轻推油门杆可**解除锁定**

### 2.6 教练口功能

1. 与 **DJI Lightbridge** 配合使用
2. 支持与 **PPM输入的模拟器** 连接
3. 支持**主从机遥控器**功能（需配合 DJI A2 飞控 V2.5+）

### 2.7 主从机遥控器设置

1. 将任意遥控器与飞控**对频**作为**主机**
2. 用**双端圆口教练线**连接另一个遥控器（**从机**）的教练口
3. 将主机拨轮**逆时针拨至最低并保持**，插入教练线另一端
4. 连接成功主机发出"嘀"声，松开拨轮

---

## 三、DR16接收机操作

### 3.1 与飞控系统连线

- 推荐配合：**NAZA-M Lite / NAZA-M / NAZA-M V2 / WooKong-M / A2**
- 使用 **3-Pin连接线** 将 DR16 连接到飞控 **X2 端口**
- 调参软件中将接收机类型选择为 **D-BUS 类型**

### 3.2 遥控器和接收机对频步骤

1. 给飞控系统和接收机**上电**
2. 给遥控器上电，距离在 **0.5 m ~ 1 m**
3. 借助针状物**按住接收机对频按键**，直到红灯闪烁后松开
4. LED指示灯变**绿灯常亮**表示对频成功

### 3.3 接收机LED指示灯状态

| LED状态 | 描述 |
|---------|------|
| 绿灯常亮 | 遥控器和接收机均上电且成功对频 |
| 红灯常亮 | 遥控器未打开，未检测到2.4 GHz信号 |
| 红灯闪亮 | 接收机已进入对频模式 |
| 绿灯闪亮 | 检测到信号但未连接，需对频 |

### 3.4 通道默认映射

| 接收机通道 | 日本手 | 美国手 |
|-----------|--------|--------|
| A | J1 | J1 |
| E | J2 | J2 |
| T | J3 | J3 |
| R | J4 | J4 |
| U | S1 | S1 |
| X1 | LD | LD |
| X2 | S2 | S2 |

---

## 四、SBUS / DBUS 协议

### 4.1 SBUS协议简介

- **全称**：Serial-BUS，串口通信协议
- 广泛应用于航模遥控器（接收机）
- **仅用一根信号线**传输多达 **16通道** 数据，比PWM高效省资源
- 大疆 **DBUS协议** 本质上与SBUS一样，略有区别

### 4.2 电平特性

- SBUS电平与**TTL电平相反**
- **高电平为1，低电平为0**
- **必须在硬件上对接收串口电平取反**（不能软件取反，因为只能反数据位，校验位/停止位无法操作）

### 4.3 标准SBUS串口配置

| 参数 | 标准SBUS | 大疆DBUS |
|------|---------|---------|
| 波特率 | 100000 | 100000 |
| 数据位 | 8位 | **9位** |
| 校验位 | 偶校验 | 偶校验 |
| 停止位 | 2位 | **1位** |

> **关键发现**：STM32H7接收DBUS协议时，**数据位必须配置为9位**（8数据位 + 1校验位），才能正确接收数据！

### 4.4 DT7遥控器数据量

- 一次发送的数据量为 **18字节**

---

## 五、STM32CubeMX 配置（以STM32H7为例）

### 5.1 串口基础配置（UART5）

1. 选择 **Connectivity -> UART5**
2. Mode 选择 **Asynchronous**（异步通信）
3. 参数配置：
   - **波特率（Baud Rate）**：100000
   - **数据位（Word Length）**：9位
   - **校验位（Parity）**：偶校验
   - **停止位（Stop Bits）**：2位
4. Data Direction 可改为 **Receive Only**（仅需接收）

### 5.2 串口中断配置

- 点击 **NVIC Settings**，打开**串口全局中断**
- 在完整接收到遥控器数据后进入中断处理

### 5.3 串口接收DMA配置

1. 选择 **DMA Settings**
2. **Add -> Select -> UART5_RX**，开启串口5接收DMA
3. **Priority（优先级）**：选择 **Very High**（遥控器数据优先）
4. **DMA Mode**：选择 **Circular**（循环模式）

> **普通模式**：完成一次传输后需手动重载数据量
> **循环模式**：完成一次后自动重载，可持续不断接收

### 5.4 引脚确认

- 默认 UART5_RX 引脚为 **PB12**
- 需修改为硬件原理图上的 **PD2**

---

## 六、DMA双缓冲区详解

### 6.1 什么是DMA

- **DMA（直接存储器访问控制器）**
- 可直接将数据从**外设搬运到内存**，无需CPU参与
- 搬运大量数据时，不使用DMA会造成CPU负载过高

### 6.2 普通模式（单缓冲区）的问题

- DMA只有一个缓冲区
- 当缓冲区满时，CPU来不及处理，新数据又到来，造成**数据丢失**

### 6.3 DMA双缓冲区原理

```
缓冲区0接收数据 -> 切换至缓冲区1接收 -> CPU处理缓冲区0数据
缓冲区1接收数据 -> 切换至缓冲区0接收 -> CPU处理缓冲区1数据
                  ... 循环往复 ...
```

- 当一个缓冲区接收完数据，自动切换到另一个缓冲区
- CPU处理已收满的缓冲区数据，**不丢失数据**

---

## 七、DMA双缓冲区代码配置

### 7.1 初始化代码（寄存器方式）

```c
static void USART_DMAEx_MultiBuffer_Init(
    UART_HandleTypeDef *huart,
    uint32_t *DstAddress,        // 第一个缓冲区地址
    uint32_t *SecondMemAddress,  // 第二个缓冲区地址
    uint32_t DataLength)         // 接收数据长度
{
    huart->ReceptionType = HAL_UART_RECEPTION_TOIDLE;  // 空闲中断接收
    huart->RxEventType = HAL_UART_RXEVENT_IDLE;
    huart->RxXferSize = DataLength;

    SET_BIT(huart->Instance->CR3, USART_CR3_DMAR);      // 使能串口DMA
    __HAL_UART_ENABLE_IT(huart, UART_IT_IDLE);          // 使能空闲中断

    // 关闭DMA（配置地址前必须先关闭）
    do {
        __HAL_DMA_DISABLE(huart->hdmarx);
    } while (((DMA_Stream_TypeDef *)huart->hdmarx->Instance)->CR & DMA_SxCR_EN);

    // 配置DMA传输起点（外设地址）
    ((DMA_Stream_TypeDef *)huart->hdmarx->Instance)->PAR =
        (uint32_t)&huart->Instance->RDR;

    // 配置DMA传输终点（双缓冲区地址）
    ((DMA_Stream_TypeDef *)huart->hdmarx->Instance)->M0AR =
        (uint32_t)DstAddress;
    ((DMA_Stream_TypeDef *)huart->hdmarx->Instance)->M1AR =
        (uint32_t)SecondMemAddress;

    // 设置DMA数据传输量
    ((DMA_Stream_TypeDef *)huart->hdmarx->Instance)->NDTR = DataLength;

    // 使能DMA双缓冲模式
    SET_BIT(((DMA_Stream_TypeDef *)huart->hdmarx->Instance)->CR, DMA_SxCR_DBM);

    // 重新使能DMA
    __HAL_DMA_ENABLE(huart->hdmarx);
}
```

### 7.2 缓冲区定义

```c
#define RC_FRAME_LENGTH   18   // DT7一次发送数据量
#define SBUS_RX_BUF_NUM   36   // 双缓冲总长度 = 18 * 2

uint8_t SBUS_MultiRx_Buf[2][RC_FRAME_LENGTH];  // 双缓冲区

// 调用初始化
USART_DMAEx_MultiBuffer_Init(&huart5,
    (uint32_t *)SBUS_MultiRx_Buf[0],
    (uint32_t *)SBUS_MultiRx_Buf[1],
    SBUS_RX_BUF_NUM);
```

### 7.3 HAL库函数方式（推荐）

```c
static void USART_RxDMA_DoubleBuffer_Init(
    UART_HandleTypeDef *huart,
    uint32_t *DstAddress,
    uint32_t *SecondMemAddress,
    uint32_t DataLength)
{
    huart->ReceptionType = HAL_UART_RECEPTION_TOIDLE;
    huart->RxEventType = HAL_UART_RXEVENT_IDLE;
    huart->RxXferSize = DataLength;

    SET_BIT(huart->Instance->CR3, USART_CR3_DMAR);
    __HAL_UART_ENABLE_IT(huart, UART_IT_IDLE);

    // 使用HAL库封装函数
    HAL_DMAEx_MultiBufferStart(huart->hdmarx,
        (uint32_t)&huart->Instance->RDR,
        (uint32_t)DstAddress,
        (uint32_t)SecondMemAddress,
        DataLength);
}
```

### 7.4 空闲中断回调函数处理

```c
void HAL_UARTEx_RxEventCallback(UART_HandleTypeDef *huart, uint16_t Size)
{
    if (huart == &huart5) {
        USER_USART5_RxHandler(huart, Size);
    }
}
```

### 7.5 数据处理函数

```c
static void USER_USART5_RxHandler(UART_HandleTypeDef *huart, uint16_t Size)
{
    // 判断当前是哪个缓冲区接收到了数据
    if (((((DMA_Stream_TypeDef *)huart->hdmarx->Instance)->CR) & DMA_SxCR_CT) == RESET)
    {
        __HAL_DMA_DISABLE(huart->hdmarx);           // 关闭DMA
        ((DMA_Stream_TypeDef *)huart->hdmarx->Instance)->CR |= DMA_SxCR_CT;  // 切换至缓冲区1
        __HAL_DMA_SET_COUNTER(huart->hdmarx, SBUS_RX_BUF_NUM);  // 重置计数器为36

        if (Size == RC_FRAME_LENGTH) {
            SBUS_TO_RC(SBUS_MultiRx_Buf[0], &remote_ctrl);  // 处理缓冲区0数据
        }
    }
    else
    {
        __HAL_DMA_DISABLE(huart->hdmarx);
        ((DMA_Stream_TypeDef *)huart->hdmarx->Instance)->CR &= ~(DMA_SxCR_CT);  // 切换至缓冲区0
        __HAL_DMA_SET_COUNTER(huart->hdmarx, SBUS_RX_BUF_NUM);

        if (Size == RC_FRAME_LENGTH) {
            SBUS_TO_RC(SBUS_MultiRx_Buf[1], &remote_ctrl);  // 处理缓冲区1数据
        }
    }

    __HAL_DMA_ENABLE(huart->hdmarx);  // 重新使能DMA
}
```

### 7.6 关键寄存器说明

| 寄存器 | 名称 | 作用 |
|--------|------|------|
| DMA_SxPAR | 外设地址寄存器 | DMA传输起点（串口RDR） |
| DMA_SxM0AR | 存储器0地址寄存器 | 第一个缓冲区地址 |
| DMA_SxM1AR | 存储器1地址寄存器 | 第二个缓冲区地址 |
| DMA_SxNDTR | 数据项数寄存器 | 剩余接收数据量 |
| DMA_SxCR_DBM | 双缓冲模式位 | 使能双缓冲 |
| DMA_SxCR_CT | 当前目标缓冲区 | 0=缓冲区0, 1=缓冲区1 |
| USART_CR3_DMAR | DMA接收使能 | 使能串口DMA接收 |

---

## 八、HAL库空闲中断逻辑（简化版）

```c
if (huart->ReceptionType == HAL_UART_RECEPTION_TOIDLE)
{
    __HAL_UART_CLEAR_FLAG(huart, UART_CLEAR_IDLEF);  // 清除空闲中断标志

    if (HAL_IS_BIT_SET(huart->Instance->CR3, USART_CR3_DMAR))
    {
        // 获取DMA剩余接收数量
        uint16_t nb_remaining_rx_data = __HAL_DMA_GET_COUNTER(huart->hdmarx);

        if ((nb_remaining_rx_data > 0U) && (nb_remaining_rx_data < huart->RxXferSize))
        {
            huart->RxXferCount = nb_remaining_rx_data;
            huart->RxEventType = HAL_UART_RXEVENT_IDLE;

            // 传入本次接收的数据长度 = 总长度 - 剩余长度
            HAL_UARTEx_RxEventCallback(huart, (huart->RxXferSize - huart->RxXferCount));
        }
    }
}
```

> **注意**：每次处理完数据后需**重置NDTR为36**，否则接收满36字节后无法再次进入回调！

---

## 九、DMA与TCM冲突问题

### 9.1 TCM简介

- **TCM（Tightly-Coupled Memory）**：紧密耦合内存
- **ITCM**：运行指令（程序代码），**DTCM**：数据存取
- 速度：**400 MHz**（与内核同速）
- **DTCM地址**：`0x2000 0000`，大小 **128 KB**

### 9.2 冲突原因

- **DMA不能与DTCM交互**，只能与 **SRAM** 交互
- 建议刚开始使用时：
  1. **关闭Cache和MPU**
  2. 将DMA相关变量搬运至 **SRAM地址（0x2400 0000）**
  3. 其他变量可在DTCM上运行

### 9.3 Keil配置

- 点击魔术棒，**勾掉IRAM1**（将变量移至SRAM）
- 若只移动部分变量，可使用 `__attribute__` 指定变量地址

---

## 十、关键要点总结

| 要点 | 内容 |
|------|------|
| **通信协议** | SBUS / DBUS，串口通信，单线传输16通道 |
| **电平特性** | 与TTL相反，需硬件取反 |
| **串口配置** | 波特率100000，数据位9位，偶校验，2停止位 |
| **单次数据量** | 18字节 |
| **DMA模式** | 双缓冲区 + 循环模式 |
| **中断方式** | 串口空闲中断 |
| **双缓冲切换** | 通过DMA_SxCR_CT位判断当前缓冲区 |
| **关键技巧** | 每次处理完重置NDTR为36，保证持续触发中断 |
| **TCM注意** | DMA不能与DTCM交互，变量需放SRAM |

---

## 十一、注意事项与安全提醒

1. **先开遥控器，后启动飞行器**；着陆后先切断飞行器电源，再关遥控器
2. 避免遥控器与其他无线设备互相干扰
3. 遥控器内部有锂电池，**勿置于潮湿、高温、阳光直射环境**
4. 使用前确保电量充足，低于 **3.5 V** 及时充电
5. 电压低于 **3.3 V** 遥控器将立刻自动关机

---

> 笔记整理完成，如有错误欢迎指正！

const n=`# FD_CAN\r
\r
本文当作经典can来使用\r
\r
## 配置\r
\r
### 模式配置\r
\r
\`\`\`c\r
hfdcan1.Instance = FDCAN1;                        // 绑定硬件实例\r
hfdcan1.Init.FrameFormat = FDCAN_FRAME_CLASSIC;   // 帧格式：经典CAN（非CAN-FD）\r
hfdcan1.Init.Mode = FDCAN_MODE_NORMAL;            // 工作模式：正常模式\r
hfdcan1.Init.AutoRetransmission = ENABLE;         // 自动重传：使能（发送失败自动重试）\r
hfdcan1.Init.TransmitPause = DISABLE;             // 发送暂停：禁用\r
hfdcan1.Init.ProtocolException = DISABLE;         // 协议异常处理：禁用\r
\`\`\`\r
\r
\r
\r
### 波特率配置\r
\r
\`\`\`c\r
hfdcan1.Init.NominalPrescaler = 3;         // 标称波特率预分频器\r
hfdcan1.Init.NominalSyncJumpWidth = 10;    // 标称同步跳转宽度\r
hfdcan1.Init.NominalTimeSeg1 = 29;         // 标称时间段1（采样点前）\r
hfdcan1.Init.NominalTimeSeg2 = 10;         // 标称时间段2（采样点后）\r
hfdcan1.Init.DataPrescaler = 3;            // 数据波特率预分频器（CAN-FD用）\r
hfdcan1.Init.DataSyncJumpWidth = 10;       // 数据同步跳转宽度\r
hfdcan1.Init.DataTimeSeg1 = 29;            // 数据时间段1\r
hfdcan1.Init.DataTimeSeg2 = 10;            // 数据时间段2\r
\`\`\`\r
\r
波特率 = FDCAN时钟频率 / (Prescaler × (1 + SyncJumpWidth + TimeSeg1 + TimeSeg2))\r
\r
采样点\r
\r
采样点 = (1 + TimeSeg1) / (1 + SyncJumpWidth + TimeSeg1 + TimeSeg2) × 100%\r
      = (1 + 29) / 50 × 100%\r
      = 60%\r
\r
\r
\r
同步跳转宽度\r
\r
- Phase_Seg1可以向Phase_Seg2"借"时间（最多SJW个TQ）\r
- Phase_Seg2也可以向Phase_Seg1"借"时间（最多SJW个TQ）\r
\r
\r
\r
### 消息RAM配置\r
\r
FDCAN控制器有一块 专用的内部RAM ，用于存储：\r
\r
- 滤波器配置 ：决定哪些CAN帧可以被接收\r
- 接收缓冲区/FIFO ：存储接收到的CAN帧\r
- 发送缓冲区/FIFO ：存储待发送的CAN帧\r
- 发送事件 ：记录发送完成的状态\r
\r
三个FDCAN共享同一块消息RAM\r
\r
\r
\r
#### 消息RAM的组成\r
\r
##### 滤波器区域（Filter Area）\r
\r
\`\`\`c\r
hfdcan1.Init.StdFiltersNbr = 1;    // 标准滤波器数量\r
hfdcan1.Init.ExtFiltersNbr = 0;    // 扩展滤波器数量\r
\`\`\`\r
\r
每个标准滤波器占用的空间 ：32位（4字节） 每个扩展滤波器占用的空间 ：64位（8字节）\r
\r
\r
\r
##### 接收FIFO0\r
\r
\`\`\`c\r
hfdcan1.Init.RxFifo0ElmtsNbr = 16;         // 元素数量\r
hfdcan1.Init.RxFifo0ElmtSize = FDCAN_DATA_BYTES_8;  // 每个元素大小\r
\`\`\`\r
\r
每个FIFO元素的结构 ：\r
\r
消息头 	64位（8字节）	 ID、数据长度、时间戳等\r
\r
数据	   8~64字节          实际数据（取决于配置）\r
\r
\`\`\`\r
FIFO0布局（16个元素，每个8字节数据）：\r
┌─────────────────────────────────────────────────────────┐\r
│ FIFO0元素0: 8字节头 + 8字节数据 = 16字节                  │\r
│ FIFO0元素1: 16字节                                       │\r
│ ...                                                     │\r
│ FIFO0元素15: 16字节                                      │\r
└─────────────────────────────────────────────────────────┘\r
\r
总大小 = 16 × 16 = 256字节\r
\`\`\`\r
\r
接收FIFO1和接收FIFO0类似\r
\r
\r
\r
##### 接收缓冲区（Rx Buffers）\r
\r
hfdcan1.Init.TxBuffersNbr = 0;  // 禁用\r
\r
\r
\r
##### 发送FIFO队列（Tx FIFO Queue）\r
\r
\`\`\`c\r
hfdcan1.Init.TxFifoQueueElmtsNbr = 8;   // 元素数量\r
hfdcan1.Init.TxFifoQueueMode = FDCAN_TX_FIFO_OPERATION;  // FIFO模式\r
hfdcan1.Init.TxElmtSize = FDCAN_DATA_BYTES_8;            // 每个元素大小\r
\`\`\`\r
\r
发送FIFO和发送缓冲区的区别 ：\r
\r
- 发送缓冲区 ：每个缓冲区独立，可以单独请求发送\r
- 发送FIFO ：先进先出队列，自动按顺序发送\r
\r
\`\`\`\r
发送FIFO布局（8个元素，每个8字节数据）：\r
┌─────────────────────────────────────────────────────────┐\r
│ Tx FIFO元素0: 8字节头 + 8字节数据 = 16字节                │\r
│ Tx FIFO元素1: 16字节                                     │\r
│ ...                                                     │\r
│ Tx FIFO元素7: 16字节                                     │\r
└─────────────────────────────────────────────────────────┘\r
\r
总大小 = 8 × 16 = 128字节\r
\`\`\`\r
\r
##### 发送事件（Tx Events）\r
\r
\`\`\`c\r
hfdcan1.Init.TxEventsNbr = 0;  // 禁用\r
\`\`\`\r
\r
记录发送完成的事件，用于中断通知\r
\r
\r
\r
发送RAM总内存计算\r
\r
1. 滤波器区域：\r
   标准滤波器: 1 × 4字节 = 4字节\r
   扩展滤波器: 0 × 8字节 = 0字节\r
   滤波器区域总大小: 4字节\r
\r
2. 接收FIFO0：\r
   每个元素: 8字节头 + 8字节数据 = 16字节\r
   16个元素: 16 × 16 = 256字节\r
\r
3. 接收FIFO1：0字节\r
\r
4. 接收缓冲区：0字节\r
\r
5. 发送缓冲区：0字节\r
\r
6. 发送FIFO队列：\r
   每个元素: 8字节头 + 8字节数据 = 16字节\r
   8个元素: 8 × 16 = 128字节\r
\r
7. 发送事件：0字节\r
\r
FDCAN1总占用 = 4 + 256 + 128 = 388字节\r
\r
但实际上HAL库会有一些对齐和预留，所以实际占用是853字节\r
\r
\r
\r
##### Offset\r
\r
一般直接把消息RAM直接等分给3个FD_CAN\r
\r
或者根据利用率自行分配\r
\r
\`\`\`c\r
hfdcan1.Init.MessageRAMOffset = 0;\r
hfdcan2.Init.MessageRAMOffset = 853;\r
hfdcan3.Init.MessageRAMOffset = 1706;\r
\`\`\`\r
\r
Offset必须是4的倍数（32位对齐） 不能出现重叠（即不同的FD_CAN公用一块消息RAM）\r
\r
\r
\r
### 过滤器配置\r
\r
\`\`\`c\r
can_filter_init_structure.IdType = FDCAN_STANDARD_ID;      // 标准ID模式\r
can_filter_init_structure.FilterIndex = 0;                 // 滤波器索引0\r
can_filter_init_structure.FilterType = FDCAN_FILTER_MASK;  // 掩码模式\r
can_filter_init_structure.FilterConfig = FDCAN_FILTER_TO_RXFIFO0; // 匹配后存入FIFO0\r
can_filter_init_structure.FilterID1 = 0x00000000;          // 过滤ID1 = 0\r
can_filter_init_structure.FilterID2 = 0x00000000;          // 过滤掩码 = 0\r
\`\`\`\r
\r
配置的全通\r
\r
(收到的ID) & (FilterID2) == (FilterID1) & (FilterID2)\r
\r
- FilterID2 = 0x0000 时， 任何ID都能匹配 （全通）\r
- 当 FilterID2 = 0xFFFF 时，只有 FilterID1 指定的ID能通过（精确匹配）\r
\r
\r
\r
### 时钟\r
\r
\`\`\`c\r
PeriphClkInitStruct.PeriphClockSelection = RCC_PERIPHCLK_FDCAN;\r
PeriphClkInitStruct.FdcanClockSelection = RCC_FDCANCLKSOURCE_PLL;\r
\`\`\`\r
\r
RCC_FDCANCLKSOURCE_PLL 	125MHz（PLL1Q） 		高频、高精度 ，适合高速CAN通信\r
\r
RCC_FDCANCLKSOURCE_HSE 	外部晶振（通常8MHz） 	低频，波特率计算受限\r
\r
\r
\r
### 中断配置\r
\r
#### NVIC层中断（硬件级）\r
\r
每个FD_CAN开启了两个中断通道\r
\r
\`\`\`c\r
HAL_NVIC_SetPriority(FDCAN1_IT0_IRQn, 0, 0);  // 中断优先级最高\r
HAL_NVIC_EnableIRQ(FDCAN1_IT0_IRQn);\r
HAL_NVIC_SetPriority(FDCAN1_IT1_IRQn, 0, 0);\r
HAL_NVIC_EnableIRQ(FDCAN1_IT1_IRQn);\r
\`\`\`\r
\r
FDCAN1_IT0_IRQn 		接收相关 ：FIFO0/1满、接收缓冲区满、过滤器匹配等\r
\r
FDCAN1_IT1_IRQn 		发送/错误相关 ：发送完成、FIFO空、总线错误、仲裁丢失等\r
\r
\r
\r
#### HAL层中断通知（软件级）\r
\r
\`\`\`c\r
HAL_FDCAN_ActivateNotification(hfdcan, \r
    FDCAN_IT_RX_FIFO0_NEW_MESSAGE |   // 新消息到达FIFO0\r
    FDCAN_IT_BUS_OFF |                 // 总线离线\r
    FDCAN_IT_ERROR_PASSIVE |           // 错误被动状态\r
    FDCAN_IT_ARB_PROTOCOL_ERROR |      // 仲裁协议错误\r
    FDCAN_IT_DATA_PROTOCOL_ERROR,      // 数据协议错误\r
    0);\r
\`\`\`\r
\r
| 中断标志                      | 作用       | 触发场景             | 处理方式               |\r
| ----------------------------- | ---------- | -------------------- | ---------------------- |\r
| FDCAN_IT_RX_FIFO0_NEW_MESSAGE | 新消息到达 | 电机返回状态数据     | 在回调中读取消息并处理 |\r
| FDCAN_IT_BUS_OFF              | 总线离线   | CAN 总线短路 / 断路  | 重启 CAN 控制器        |\r
| FDCAN_IT_ERROR_PASSIVE        | 错误被动   | 累计错误达到阈值     | 记录错误，准备恢复     |\r
| FDCAN_IT_ARB_PROTOCOL_ERROR   | 仲裁协议错 | ID 发送冲突等        | 记录日志               |\r
| FDCAN_IT_DATA_PROTOCOL_ERROR  | 数据协议错 | 格式错误、CRC 错误等 | 记录日志               |\r
\r
\r
\r
两个中断通道\r
\r
- 处理接收中断通道\r
- 处理发送 接收错误的接收中断通道\r
\r
hal库中断函数的作用  处理硬件和软件之间的关系  分发机制\r
\r
硬件中断触发\r
    │\r
    ▼\r
进入 FDCAN1_IT0_IRQHandler() 或 FDCAN1_IT1_IRQHandler() 硬件中断层（Hardware） 匹配中断向量表\r
    │\r
    ▼\r
调用 HAL_FDCAN_IRQHandler(&hfdcan1)  HAL库层（Middleware）\r
    │\r
    ├─► 读取接收中断标志寄存器 (RxITR) \r
    │       │\r
    │       ├─ FIFO0新消息？→ 调用 HAL_FDCAN_RxFifo0Callback()	用户代码层（Application） \r
    │       ├─ FIFO1新消息？→ 调用 HAL_FDCAN_RxFifo1Callback()\r
    │       └─ ...\r
    │\r
    └─► 读取错误中断标志寄存器 (ErrITR)\r
            │\r
            ├─ 总线离线？→ 调用 HAL_FDCAN_ErrorStatusCallback()	用户代码层（Application） \r
            ├─ 错误被动？→ 调用 HAL_FDCAN_ErrorStatusCallback()\r
            └─ ...\r
\r
\r
\r
## Receive\r
\r
回调函数 callback\r
\r
\`\`\`c\r
void HAL_FDCAN_RxFifo0Callback(FDCAN_HandleTypeDef *hfdcan, uint32_t RxFifo0ITs)\r
{\r
    // 判断程序初始化完成\r
    if (!init_finished)\r
    {\r
        // 也得接收, 防止FIFO满\r
        if (hfdcan->Instance == FDCAN1)\r
        {\r
            while (HAL_FDCAN_GetRxMessage(hfdcan, FDCAN_RX_FIFO0, &CAN1_Manage_Object.Rx_Header, CAN1_Manage_Object.Rx_Buffer) == HAL_OK)\r
            {\r
\r
            }\r
        }\r
        \r
        return;\r
    }\r
\r
    // 选择回调函数\r
    if (hfdcan->Instance == FDCAN1)\r
    {\r
        while (HAL_FDCAN_GetRxMessage(hfdcan, FDCAN_RX_FIFO0, &CAN1_Manage_Object.Rx_Header, CAN1_Manage_Object.Rx_Buffer) == HAL_OK)\r
        {\r
            CAN1_Manage_Object.Rx_Timestamp = SYS_Timestamp.Get_Current_Timestamp();\r
\r
            if (CAN1_Manage_Object.Callback_Function != nullptr)\r
            {\r
                CAN1_Manage_Object.Callback_Function(CAN1_Manage_Object.Rx_Header, CAN1_Manage_Object.Rx_Buffer);\r
            }\r
        }\r
    }\r
    //这里只用了FDCAN1做演示 FDCAN2和FDCAN4一样的做法\r
}\r
\`\`\`\r
\r
\`\`\`c\r
/**\r
 * @brief CAN通信处理结构体\r
 */\r
struct Struct_CAN_Manage_Object\r
{\r
    FDCAN_HandleTypeDef *CAN_Handler;\r
    CAN_Callback Callback_Function;\r
    // 与接收相关的数据\r
    FDCAN_RxHeaderTypeDef Rx_Header;\r
    uint8_t Rx_Buffer[64];\r
    // 接收时间戳\r
    uint64_t Rx_Timestamp;\r
};\r
\`\`\`\r
\r
\`\`\`c\r
void CAN1_Callback(FDCAN_RxHeaderTypeDef &Header, uint8_t *Buffer)\r
{\r
    switch (Header.Identifier)\r
    {\r
    case (0x206):\r
    {\r
        motor.CAN_RxCpltCallback();\r
        break;\r
    }\r
    }\r
}\r
\`\`\`\r
\r
电机发送数据帧：\r
┌─────────────────────────────────────────────────┐\r
│  ID=0x206 | 数据长度=8 | 数据: [温度][角度][速度]... 													│\r
└─────────────────────────────────────────────────┘\r
        │\r
        ▼\r
HAL_FDCAN_GetRxMessage() 解析\r
        │\r
        ├─→ Header.Identifier = 0x206\r
        ├─→ Header.DataLength = 8\r
        └─→ Buffer = [温度][角度][速度]...\r
        │\r
        ▼\r
CAN1_Callback(Header, Buffer)\r
        │\r
        ▼\r
switch (Header.Identifier)  // 判断是0x206\r
        │\r
        ▼\r
motor.CAN_RxCpltCallback()  // 调用对应电机的处理函数  其实可以删除\r
        │\r
        ▼\r
Data_Process(Buffer)  // 解析数据内容  \r
\r
\r
\r
区分：FIFO 是"邮箱"，Buffer 是"取出来的信"，每次只处理一封信。\r
\r
\r
\r
## Transmit\r
\r
定时中断发送\r
\r
\`\`\`c\r
void TIM_1ms_CAN_PeriodElapsedCallback()\r
{\r
    static int mod2 = 0;\r
    mod2++;\r
    if (mod2 == 2)\r
    {\r
        mod2 = 0;\r
        // CAN_Transmit_Data(&hfdcan2, 0x1fe, CAN2_0x1fe_Tx_Data, 8);  // 被注释\r
    }\r
\r
    CAN_Transmit_Data(&hfdcan1, 0x1fe, CAN1_0x1fe_Tx_Data, 8);  // ← 真正发送！\r
}\r
\`\`\`\r
\r
\`\`\`c\r
uint8_t CAN_Transmit_Data(FDCAN_HandleTypeDef *hfdcan, uint16_t ID, uint8_t *Data, uint16_t Length)\r
{\r
    FDCAN_TxHeaderTypeDef tx_header;\r
    tx_header.Identifier = 0x1fe;           // 发送ID = 0x1FE\r
    tx_header.IdType = FDCAN_STANDARD_ID;\r
    tx_header.TxFrameType = FDCAN_DATA_FRAME;\r
    tx_header.DataLength = 8;                // 8字节\r
    // ... 其他配置 ...\r
\r
    return (HAL_FDCAN_AddMessageToTxFifoQ(hfdcan, &tx_header, Data));  // 加入发送FIFO\r
}\r
\`\`\`\r
\r
\r
\r
\r
\r
\r
\r
## 和Can比较\r
\r
Can协议\r
\r
<img src="/person_blog/notes-images/can-frame-format.png" alt="经典 CAN 帧格式示意图" style="max-width: 100%;" />
\r
FD_Can\r
\r
<img src="/person_blog/notes-images/can-fd-frame-format.png" alt="CAN FD 帧格式示意图" style="max-width: 100%;" />
\r
CAN FD传输速率是可变的：从控制场中的BRS位到ACK场之前（含CRC分界符）为可变速率，最高速率可达到8Mbps\r
CAN FD数据长度不同：CAN FD每个数据帧最多支持64个数据字节，而传统CAN最多支持8个数据字节，这减少了协议开销，并提高了协议效率。\r
CAN FD帧格式不同：CanFD新增了FDF、BRS、ESI位\r
FDF 位（Flexible Data Rate Format）：原 CAN 数据帧中的保留位 r，用来区别是 CAN 报文还是 CAN-FD 报文，FDF 位常为隐性 1，表示 CAN FD 报文；\r
BRS 位（ Bit Rate Switch）：表示位速率转换，当 BRS 为显性位 0时，数据段的位速率与仲裁段的位速率一致（恒定速率），当 BRS 为隐性位 1时速率可变（即 BSR 到 CRC 使用转换速率传输）；\r
ESI 位（Error State Indicator）：发送节点错误状态指示，主动错误时发送显性位 0 ，被动错误时发送隐性位 1 。\r
\r
`;export{n as default};

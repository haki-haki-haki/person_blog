const r=`# CRC16 算法说明（pc_client.c）\r
\r
本工程 PC 上位机通信使用 **CRC-16/ARC** 校验。\r
\r
---\r
\r
## 一、CRC 参数\r
\r
| 参数       | 值                            |\r
|------------|-------------------------------|\r
| 多项式     | \`0x8005\`（反向 \`0xA001\`）     |\r
| 初值       | \`0xFFFF\`                      |\r
| 反射输入   | 是                            |\r
| 反射输出   | 是                            |\r
\r
---\r
\r
## 二、代码结构\r
\r
\`\`\`\r
wCRC_Table_PC[256]                 ← 256 项常量表\r
        │\r
        ├──> Get_CRC16_Check_Sum_PC()        ← 计算 CRC\r
        │         │\r
        │         ├──> Verify_CRC16_Check_Sum_PC()  ← 接收端校验\r
        │         └──> Append_CRC16_Check_Sum_PC()  ← 附加 CRC（未使用）\r
\`\`\`\r
\r
---\r
\r
## 三、常量表\r
\r
\`\`\`c\r
static const uint16_t wCRC_Table_PC[256] = {\r
    0x0000, 0xC0C1, 0xC181, 0x0140, ...\r
};\r
\`\`\`\r
\r
- 索引：0 ~ 255（一个字节的全部取值）\r
- 值：16 位 CRC 变换量\r
- 占用：512 字节 ROM\r
\r
---\r
\r
## 四、核心函数 Get_CRC16_Check_Sum_PC\r
\r
\`\`\`c\r
uint16_t Get_CRC16_Check_Sum_PC(uint8_t *pchMessage, uint32_t dwLength, uint16_t wCRC)\r
{\r
    uint8_t chData;\r
    if (pchMessage == NULL) return 0xFFFF;\r
    while (dwLength--) {\r
        chData = *pchMessage++;\r
        wCRC = (wCRC >> 8) ^ wCRC_Table_PC[(wCRC ^ chData) & 0xFF];\r
    }\r
    return wCRC;\r
}\r
\`\`\`\r
\r
**核心一行拆解**：\r
\r
\`\`\`c\r
wCRC = (wCRC >> 8) ^ wCRC_Table_PC[(wCRC ^ chData) & 0xFF];\r
//      └─────┬────┘   └────────────┬────────┘\r
//      CRC 右移 8 位    索引 = (CRC ^ 字节) & 0xFF\r
//                        查表得到 16 位变换量\r
//      两者异或 = 新 CRC\r
\`\`\`\r
\r
**为什么要循环**：CRC 是串行算法，每字节依赖前一字节的结果，必须逐字节累积。\r
\r
---\r
\r
## 五、接收端校验函数\r
\r
\`\`\`c\r
uint32_t Verify_CRC16_Check_Sum_PC(uint8_t *pchMessage, uint32_t dwLength)\r
{\r
    uint16_t wExpected = Get_CRC16_Check_Sum_PC(pchMessage, dwLength - 2, 0xFFFF);\r
    return ((wExpected & 0xFF) == pchMessage[dwLength - 2] &&\r
            ((wExpected >> 8) & 0xFF) == pchMessage[dwLength - 1]);\r
}\r
\`\`\`\r
\r
**流程**：对数据部分重算 CRC，与末尾 2 字节比对，相同返回 1。\r
\r
---\r
\r
## 六、帧格式与调用\r
\r
### 6.1 帧格式\r
\r
\`\`\`\r
[0xAA][0x55][ver][type][seq][len][payload...][crc_lo][crc_hi]\r
 └─SOF─┘  └──────── CRC 范围 ──────────────┘  └──CRC──┘\r
\`\`\`\r
\r
- CRC 范围：\`ver\` 到 \`payload\` 末尾（不含 SOF 和 CRC 自身）\r
- 小端序追加\r
\r
### 6.2 发送端\r
\r
\`\`\`c\r
uint16_t crc = Get_CRC16_Check_Sum_PC(tx_buf + 2, total_len - 2, 0xFFFF);\r
tx_buf[total_len]     = crc & 0xFF;          // 低字节\r
tx_buf[total_len + 1] = (crc >> 8) & 0xFF;   // 高字节\r
HAL_UART_Transmit(&huart1, tx_buf, total_len + 2, 1000);\r
\`\`\`\r
\r
### 6.3 接收端\r
\r
\`\`\`c\r
if (Verify_CRC16_Check_Sum_PC(buf + 2, hdr->len + 6) == 0) {\r
    dart_crc_fail++;\r
    return;  // 校验失败丢弃\r
}\r
// 校验通过后解析 payload\r
\`\`\`\r
\r
---\r
\r
## 七、逐位计算 1 字节 CRC（对照参考）\r
\r
查表法把 8 次 bit 运算压缩成 1 次查表。以下是等价的逐位实现：\r
\r
\`\`\`c\r
uint16_t crc_byte_bitwise(uint16_t crc, uint8_t chData)\r
{\r
    uint8_t i;\r
    for (i = 0; i < 8; i++) {\r
        uint8_t bit = (crc ^ chData) & 0x0001;  // 判定位\r
        crc >>= 1;                               // CRC 右移\r
        if (bit) crc ^= 0xA001;                  // 判定为 1 则异或多项式\r
        chData >>= 1;                             // 字节右移\r
    }\r
    return crc;\r
}\r
\`\`\`\r
\r
**验证**：\`crc = 0xFFFF, chData = 0x01\`\r
\r
| 方法     | 结果     |\r
|----------|----------|\r
| 查表法   | \`0x807E\` |\r
| 逐位法   | \`0x807E\` |\r
\r
两者完全等价。\r
\r
---\r
\r
## 八、工程调用关系\r
\r
### 8.1 调用链路\r
\r
\`\`\`\r
┌─────────────── 业务层 ───────────────┐\r
│ ClientTask                            │\r
│   ├── Dart_SendSystemStatus           │  100ms 周期上报系统状态\r
│   ├── Dart_SendMotorStatus            │  50ms 周期上报电机状态\r
│   ├── Dart_SendlauncherStatus         │  100ms 周期上报发射机构状态\r
│   └── Dart_SendFrame (0x02)           │  心跳应答\r
└───────────────────────────────────────┘\r
                  ↓ 都调用\r
┌─────────────── 协议层 ───────────────┐\r
│ Dart_SendFrame(type, seq, payload, len) │\r
│   ├── 拼帧头 + payload                  │\r
│   ├── Get_CRC16_Check_Sum_PC  ← 计算 CRC │\r
│   └── HAL_UART_Transmit          ← 发送 │\r
└───────────────────────────────────────┘\r
\r
┌─────────────── 接收端 ───────────────┐\r
│ USART1_IRQHandler (DMA 空闲中断)     │\r
│   └── Dart_Read_Data                  │\r
│         └── Verify_CRC16_Check_Sum_PC ← 校验 CRC\r
└───────────────────────────────────────┘\r
\`\`\`\r
\r
### 8.2 实际调用代码\r
\r
**发送端**（\`pc_client.c:19 Dart_SendFrame\`）：\r
\r
\`\`\`c\r
// 所有业务发送函数最终都走这里\r
void Dart_SendFrame(uint8_t type, uint8_t seq, void *payload, uint8_t len)\r
{\r
    /* 拼接帧头 + payload */\r
    memcpy(tx_buf, &header, sizeof(header));\r
    memcpy(tx_buf + sizeof(header), payload, len);\r
\r
    /* 计算 CRC */\r
    uint16_t crc = Get_CRC16_Check_Sum_PC(tx_buf + 2, total_len - 2, CRC_INIT);\r
\r
    /* 追加到末尾并发送 */\r
    tx_buf[total_len]     = crc & 0xFF;\r
    tx_buf[total_len + 1] = (crc >> 8) & 0xFF;\r
    HAL_UART_Transmit(&huart1, tx_buf, total_len + 2, 1000);\r
}\r
\`\`\`\r
\r
**接收端**（\`pc_client.c:121 Dart_Read_Data\`）：\r
\r
\`\`\`c\r
void Dart_Read_Data(uint8_t *buf)\r
{\r
    if (buf[0] != FRAME_SOF1 || buf[1] != FRAME_SOF2) return;\r
\r
    DartFrameHeader_t *hdr = (DartFrameHeader_t *)buf;\r
\r
    /* CRC 校验：失败直接丢弃 */\r
    if (Verify_CRC16_Check_Sum_PC(buf + 2, hdr->len + 6) == 0) {\r
        dart_crc_fail++;\r
        return;\r
    }\r
\r
    /* 校验通过后解析 payload */\r
    switch (hdr->type) { ... }\r
}\r
\`\`\`\r
\r
### 8.3 调用场景汇总\r
\r
| 函数                          | 调用位置              | 作用                |\r
|-------------------------------|----------------------|---------------------|\r
| \`Get_CRC16_Check_Sum_PC\`      | \`Dart_SendFrame\`     | 发送前计算 CRC      |\r
| \`Verify_CRC16_Check_Sum_PC\`   | \`Dart_Read_Data\`     | 接收后校验 CRC      |\r
| \`Append_CRC16_Check_Sum_PC\`   | 无                   | 已封装但工程未使用   |\r
`;export{r as default};

const n=`# CRC16 算法说明（pc_client.c）

本工程 PC 上位机通信使用 **CRC-16/ARC** 校验。

---

## 一、CRC 参数

| 参数       | 值                            |
|------------|-------------------------------|
| 多项式     | \`0x8005\`（反向 \`0xA001\`）     |
| 初值       | \`0xFFFF\`                      |
| 反射输入   | 是                            |
| 反射输出   | 是                            |

---

## 二、代码结构

\`\`\`
wCRC_Table_PC[256]                 ← 256 项常量表
        │
        ├──> Get_CRC16_Check_Sum_PC()        ← 计算 CRC
        │         │
        │         ├──> Verify_CRC16_Check_Sum_PC()  ← 接收端校验
        │         └──> Append_CRC16_Check_Sum_PC()  ← 附加 CRC（未使用）
\`\`\`

---

## 三、常量表

\`\`\`c
static const uint16_t wCRC_Table_PC[256] = {
    0x0000, 0xC0C1, 0xC181, 0x0140, ...
};
\`\`\`

- 索引：0 ~ 255（一个字节的全部取值）
- 值：16 位 CRC 变换量
- 占用：512 字节 ROM

---

## 四、核心函数 Get_CRC16_Check_Sum_PC

\`\`\`c
uint16_t Get_CRC16_Check_Sum_PC(uint8_t *pchMessage, uint32_t dwLength, uint16_t wCRC)
{
    uint8_t chData;
    if (pchMessage == NULL) return 0xFFFF;
    while (dwLength--) {
        chData = *pchMessage++;
        wCRC = (wCRC >> 8) ^ wCRC_Table_PC[(wCRC ^ chData) & 0xFF];
    }
    return wCRC;
}
\`\`\`

**核心一行拆解**：

\`\`\`c
wCRC = (wCRC >> 8) ^ wCRC_Table_PC[(wCRC ^ chData) & 0xFF];
//      └─────┬────┘   └────────────┬────────┘
//      CRC 右移 8 位    索引 = (CRC ^ 字节) & 0xFF
//                        查表得到 16 位变换量
//      两者异或 = 新 CRC
\`\`\`

**为什么要循环**：CRC 是串行算法，每字节依赖前一字节的结果，必须逐字节累积。

---

## 五、接收端校验函数

\`\`\`c
uint32_t Verify_CRC16_Check_Sum_PC(uint8_t *pchMessage, uint32_t dwLength)
{
    uint16_t wExpected = Get_CRC16_Check_Sum_PC(pchMessage, dwLength - 2, 0xFFFF);
    return ((wExpected & 0xFF) == pchMessage[dwLength - 2] &&
            ((wExpected >> 8) & 0xFF) == pchMessage[dwLength - 1]);
}
\`\`\`

**流程**：对数据部分重算 CRC，与末尾 2 字节比对，相同返回 1。

---

## 六、帧格式与调用

### 6.1 帧格式

\`\`\`
[0xAA][0x55][ver][type][seq][len][payload...][crc_lo][crc_hi]
 └─SOF─┘  └──────── CRC 范围 ──────────────┘  └──CRC──┘
\`\`\`

- CRC 范围：\`ver\` 到 \`payload\` 末尾（不含 SOF 和 CRC 自身）
- 小端序追加

### 6.2 发送端

\`\`\`c
uint16_t crc = Get_CRC16_Check_Sum_PC(tx_buf + 2, total_len - 2, 0xFFFF);
tx_buf[total_len]     = crc & 0xFF;          // 低字节
tx_buf[total_len + 1] = (crc >> 8) & 0xFF;   // 高字节
HAL_UART_Transmit(&huart1, tx_buf, total_len + 2, 1000);
\`\`\`

### 6.3 接收端

\`\`\`c
if (Verify_CRC16_Check_Sum_PC(buf + 2, hdr->len + 6) == 0) {
    dart_crc_fail++;
    return;  // 校验失败丢弃
}
// 校验通过后解析 payload
\`\`\`

---

## 七、逐位计算 1 字节 CRC（对照参考）

查表法把 8 次 bit 运算压缩成 1 次查表。以下是等价的逐位实现：

\`\`\`c
uint16_t crc_byte_bitwise(uint16_t crc, uint8_t chData)
{
    uint8_t i;
    for (i = 0; i < 8; i++) {
        uint8_t bit = (crc ^ chData) & 0x0001;  // 判定位
        crc >>= 1;                               // CRC 右移
        if (bit) crc ^= 0xA001;                  // 判定为 1 则异或多项式
        chData >>= 1;                             // 字节右移
    }
    return crc;
}
\`\`\`

**验证**：\`crc = 0xFFFF, chData = 0x01\`

| 方法     | 结果     |
|----------|----------|
| 查表法   | \`0x807E\` |
| 逐位法   | \`0x807E\` |

两者完全等价。

---

## 八、工程调用关系

### 8.1 调用链路

\`\`\`
┌─────────────── 业务层 ───────────────┐
│ ClientTask                            │
│   ├── Dart_SendSystemStatus           │  100ms 周期上报系统状态
│   ├── Dart_SendMotorStatus            │  50ms 周期上报电机状态
│   ├── Dart_SendlauncherStatus         │  100ms 周期上报发射机构状态
│   └── Dart_SendFrame (0x02)           │  心跳应答
└───────────────────────────────────────┘
                  ↓ 都调用
┌─────────────── 协议层 ───────────────┐
│ Dart_SendFrame(type, seq, payload, len) │
│   ├── 拼帧头 + payload                  │
│   ├── Get_CRC16_Check_Sum_PC  ← 计算 CRC │
│   └── HAL_UART_Transmit          ← 发送 │
└───────────────────────────────────────┘

┌─────────────── 接收端 ───────────────┐
│ USART1_IRQHandler (DMA 空闲中断)     │
│   └── Dart_Read_Data                  │
│         └── Verify_CRC16_Check_Sum_PC ← 校验 CRC
└───────────────────────────────────────┘
\`\`\`

### 8.2 实际调用代码

**发送端**（\`pc_client.c:19 Dart_SendFrame\`）：

\`\`\`c
// 所有业务发送函数最终都走这里
void Dart_SendFrame(uint8_t type, uint8_t seq, void *payload, uint8_t len)
{
    /* 拼接帧头 + payload */
    memcpy(tx_buf, &header, sizeof(header));
    memcpy(tx_buf + sizeof(header), payload, len);

    /* 计算 CRC */
    uint16_t crc = Get_CRC16_Check_Sum_PC(tx_buf + 2, total_len - 2, CRC_INIT);

    /* 追加到末尾并发送 */
    tx_buf[total_len]     = crc & 0xFF;
    tx_buf[total_len + 1] = (crc >> 8) & 0xFF;
    HAL_UART_Transmit(&huart1, tx_buf, total_len + 2, 1000);
}
\`\`\`

**接收端**（\`pc_client.c:121 Dart_Read_Data\`）：

\`\`\`c
void Dart_Read_Data(uint8_t *buf)
{
    if (buf[0] != FRAME_SOF1 || buf[1] != FRAME_SOF2) return;

    DartFrameHeader_t *hdr = (DartFrameHeader_t *)buf;

    /* CRC 校验：失败直接丢弃 */
    if (Verify_CRC16_Check_Sum_PC(buf + 2, hdr->len + 6) == 0) {
        dart_crc_fail++;
        return;
    }

    /* 校验通过后解析 payload */
    switch (hdr->type) { ... }
}
\`\`\`

### 8.3 调用场景汇总

| 函数                          | 调用位置              | 作用                |
|-------------------------------|----------------------|---------------------|
| \`Get_CRC16_Check_Sum_PC\`      | \`Dart_SendFrame\`     | 发送前计算 CRC      |
| \`Verify_CRC16_Check_Sum_PC\`   | \`Dart_Read_Data\`     | 接收后校验 CRC      |
| \`Append_CRC16_Check_Sum_PC\`   | 无                   | 已封装但工程未使用   |
`;export{n as default};

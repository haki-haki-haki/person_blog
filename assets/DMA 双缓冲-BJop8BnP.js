const r=`[TOC]\r
\r
# DMA 双缓冲\r
\r
## 简易原理图\r
\r
\`\`\`mermaid\r
flowchart LR\r
    ADC[ADC转换] --> DMA[DMA双缓冲]\r
    DMA --> buf0[buffer0]\r
    DMA --> buf1[buffer1]\r
    buf0 & buf1 --> CPU[CPU处理]\r
\`\`\`\r
\r
单缓冲区和双缓冲区对比\r
\r
| 特性               | 单缓冲区模式             | 双缓冲区模式       |\r
| ------------------ | ------------------------ | ------------------ |\r
| **数据传输连续性** | 需要CPU及时处理          | 自动切换，无缝衔接 |\r
| **内存占用**       | 1×数据块大小             | 2×数据块大小       |\r
| **CPU干预频率**    | 每个数据块传输完成都需要 | 仅缓冲区切换时需要 |\r
| **适用场景**       | 低速率简单传输           | 高速实时数据流     |\r
\r
## 基础配置\r
\r
\`\`\`c\r
// DMA1_Stream5配置示例(以STM32F4为例)\r
DMA_HandleTypeDef hdma_adc;\r
    \r
hdma_adc.Instance = DMA1_Stream5;\r
hdma_adc.Init.Channel = DMA_CHANNEL_0;	//DMA1_Stream5 + DMA_CHANNEL_0 固定配对 ADC1\r
1. 两条代码分别是什么\r
hdma_adc.Init.Direction = DMA_PERIPH_TO_MEMORY; //传输方向：外设 → 内存\r
hdma_adc.Init.MemDataAlignment = DMA_MDATAALIGN_HALFWORD;//内存位宽 每次 DMA 往内存写 2 字节\r
hdma_adc.Init.MemInc = DMA_MINC_ENABLE; //内存地址自增\r
hdma_adc.Init.Mode = DMA_CIRCULAR;// 循环模式\r
hdma_adc.Init.PeriphDataAlignment = DMA_PDATAALIGN_HALFWORD;\r
hdma_adc.Init.PeriphInc = DMA_PINC_DISABLE;\r
hdma_adc.Init.Priority = DMA_PRIORITY_HIGH;//优先级\r
hdma_adc.Init.FIFOMode = DMA_FIFOMODE_DISABLE;\r
hdma_adc.Init.MemBurst = DMA_MBURST_SINGLE;\r
hdma_adc.Init.PeriphBurst = DMA_PBURST_SINGLE;\r
\r
// 关键双缓冲区配置\r
hdma_adc.Instance->M0AR = (uint32_t)buffer0; // 内存地址0\r
hdma_adc.Instance->M1AR = (uint32_t)buffer1; // 内存地址1\r
hdma_adc.Instance->CR |= DMA_SxCR_DBM;// 启用双缓冲\r
\r
\`\`\`\r
\r
## ADC双缓冲采集\r
\r
### 硬件\r
\r
STM32F407 ---- 模拟信号源\r
PA0(ADC1_IN0) <-- 信号输入\r
DMA1_Stream0--> 双缓冲区\r
\r
\`\`\`c\r
#define BUFFER_SIZE 1024\r
uint16_t adcBuffer0[BUFFER_SIZE];\r
uint16_t adcBuffer1[BUFFER_SIZE];\r
volatile uint8_t currentBuffer = 0; // 当前活动缓冲区标志\r
\r
void ADC1_DMA_Init(void) {\r
// 1. ADC初始化\r
ADC_HandleTypeDef hadc1;\r
hadc1.Instance = ADC1;\r
hadc1.Init.ClockPrescaler = ADC_CLOCK_SYNC_PCLK_DIV4;\r
hadc1.Init.Resolution = ADC_RESOLUTION_12B;\r
hadc1.Init.ScanConvMode = ENABLE;\r
hadc1.Init.ContinuousConvMode = ENABLE;\r
hadc1.Init.DiscontinuousConvMode = DISABLE;\r
hadc1.Init.NbrOfConversion = 1;\r
hadc1.Init.DMAContinuousRequests = ENABLE;\r
HAL_ADC_Init(&hadc1);\r
\r
// 2. DMA双缓冲配置\r
hdma_adc1.Instance = DMA2_Stream0;\r
hdma_adc1.Init.Channel = DMA_CHANNEL_0;\r
hdma_adc1.Init.Direction = DMA_PERIPH_TO_MEMORY;\r
hdma_adc1.Init.PeriphInc = DMA_PINC_DISABLE;\r
hdma_adc1.Init.MemInc = DMA_MINC_ENABLE;\r
hdma_adc1.Init.PeriphDataAlignment = DMA_PDATAALIGN_HALFWORD;\r
hdma_adc1.Init.MemDataAlignment = DMA_MDATAALIGN_HALFWORD;\r
hdma_adc1.Init.Mode = DMA_CIRCULAR;\r
hdma_adc1.Init.Priority = DMA_PRIORITY_HIGH;\r
hdma_adc1.Init.FIFOMode = DMA_FIFOMODE_DISABLE;\r
hdma_adc1.Init.MemBurst = DMA_MBURST_SINGLE;\r
hdma_adc1.Init.PeriphBurst = DMA_PBURST_SINGLE;\r
HAL_DMA_Init(&hdma_adc1);\r
\r
// 3. 关联ADC和DMA\r
__HAL_LINKDMA(&hadc1, DMA_Handle, hdma_adc1);\r
\r
// 4. 启动双缓冲传输\r
HAL_ADC_Start_DMA(&hadc1, (uint32_t*)adcBuffer0, BUFFER_SIZE);\r
HAL_DMAEx_MultiBufferStart_IT(&hdma_adc1,\r
(uint32_t)&ADC1->DR,\r
(uint32_t)adcBuffer0,\r
(uint32_t)adcBuffer1,\r
BUFFER_SIZE);\r
}\r
\r
// DMA中断回调函数\r
void HAL_ADC_ConvHalfCpltCallback(ADC_HandleTypeDef* hadc) {\r
currentBuffer = 0; // 前半段完成，表示Buffer0已满\r
Process_Buffer(adcBuffer0); // 处理Buffer1\r
}\r
\r
void HAL_ADC_ConvCpltCallback(ADC_HandleTypeDef* hadc) {\r
currentBuffer = 1; // 后半段完成，表示Buffer1已满\r
Process_Buffer(adcBuffer1); // 处理Buffer0\r
}\r
\r
// 示例处理函数\r
void Process_Buffer(uint16_t* buf) {\r
for(int i=0; i<BUFFER_SIZE; i++) {\r
buf[i] = buf[i] * 3300 / 4095; // 转换为mV\r
}\r
}\r
\r
\`\`\`\r
\r
## 串口DMA接收\r
\r
### 单缓冲弊端\r
\r
假设配置了256字节得缓冲区\r
\r
\`\`\`c\r
uint8_t rx_buffer[256];\r
HAL_UART_Receive_DMA(&huart1, rx_buffer, 256);\r
\r
\`\`\`\r
\r
数据自动填满缓冲区后触发 \`RxCpltCallback \`，然后你在回调里处理数据。 由于处理数据需要时间，但是仍然在接受，而且没处理完，数据仍然在到来，会覆盖原本的数据。第257个字节来了 → 写入 \`rx_buffer[0]\`。\r
\r
### 硬件双缓冲\r
\r
\`\`\`c\r
#define RX_BUF_LEN 128\r
// 双缓冲两块接收区\r
uint8_t rx_buf0[RX_BUF_LEN];\r
uint8_t rx_buf1[RX_BUF_LEN];\r
// 就绪标志\r
volatile uint8_t rx_ready = 0; // 1=buf0就绪 2=buf1就绪\r
\r
UART_HandleTypeDef huart1;\r
DMA_HandleTypeDef hdma_usart1_rx;\r
\r
//部分DMA初始化\r
// 绑定串口与DMA\r
    __HAL_LINKDMA(&huart1, hdmarx, hdma_usart1_rx);\r
\r
    // 开启串口空闲中断\r
    __HAL_UART_ENABLE_IT(&huart1, UART_IT_IDLE);\r
\r
    // 启动DMA双缓冲接收(带中断)\r
    HAL_DMAEx_MultiBufferStart_IT(&hdma_usart1_rx,\r
        (uint32_t)&USART1->DR,\r
        (uint32_t)rx_buf0,\r
        (uint32_t)rx_buf1,\r
        RX_BUF_LEN);\r
\r
// 空闲中断回调\r
void HAL_UART_IdleCpltCallback(UART_HandleTypeDef *huart)\r
{\r
    if(huart->Instance == USART1)\r
    {\r
        // 获取当前正在写入的缓冲区\r
        if(hdma_usart1_rx.Instance->CR & DMA_SxCR_CT)\r
        {\r
            // CT=1 当前DMA写buf1，buf0已经收完整包\r
            rx_ready = 1;\r
        }\r
        else\r
        {\r
            // CT=0 当前DMA写buf0，buf1已经收完整包\r
            rx_ready = 2;\r
        }\r
        // 清除空闲中断标志\r
        __HAL_UART_CLEAR_IDLEFLAG(&huart1);\r
    }\r
}\r
\r
\`\`\`\r
\r
DMA双缓冲传输完成回调\r
\r
\`\`\`c\r
// M0AR(buf0)填满触发TC全传输中断\r
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)\r
{\r
    if (huart->Instance == USART1)\r
    {\r
        rx_ready = 1; // buf0可用\r
    }\r
}\r
\r
// M1AR(buf1)填满触发HT半传输中断\r
void HAL_UART_RxHalfCpltCallback(UART_HandleTypeDef *huart)\r
{\r
    if (huart->Instance == USART1)\r
    {\r
        rx_ready = 2; // buf1可用\r
    }\r
}\r
\r
// 自定义数据解析函数\r
void Process_UART_Data(uint8_t *data, uint16_t len)\r
{\r
    // 在这里做协议解析、打印、数据运算\r
    HAL_UART_Transmit(&huart1, data, len, 100);\r
}\r
\`\`\`\r
\r
### 软件双缓冲\r
\r
只用**1 个数组**，不开 DMA 双缓冲 DBM，靠数组前后两半模拟两块缓冲区；只用普通循环 DMA。\r
\r
数组长度RX_BUF_LEN,前半段/2，后半段/2.\r
\r
\`\`\`c\r
#define RX_BUF_LEN 256\r
uint8_t rx_buf[RX_BUF_LEN]; // 只一个数组，软件对半拆分\r
volatile uint8_t rx_flag = 0; // 1=前半就绪，2=后半就绪\r
\r
UART_HandleTypeDef huart1;\r
DMA_HandleTypeDef hdma_usart1_rx;\r
\r
void USART1_SoftDoubleBuf_Init(void)\r
{\r
    // 串口初始化省略，和硬件双缓冲一致\r
    \r
    // DMA配置：Mode = DMA_CIRCULAR 循环模式，不开启DBM\r
    hdma_usart1_rx.Instance = DMA2_Stream2;\r
    hdma_usart1_rx.Init.Channel = DMA_CHANNEL_4;\r
    hdma_usart1_rx.Init.Direction = DMA_PERIPH_TO_MEMORY;\r
    hdma_usart1_rx.Init.PeriphInc = DMA_PINC_DISABLE;\r
    hdma_usart1_rx.Init.MemInc = DMA_MINC_ENABLE;\r
    hdma_usart1_rx.Init.PeriphDataAlignment = DMA_PDATAALIGN_BYTE;\r
    hdma_usart1_rx.Init.MemDataAlignment = DMA_MDATAALIGN_BYTE;\r
    hdma_usart1_rx.Init.Mode = DMA_CIRCULAR; // 循环，无DBM\r
    hdma_usart1_rx.Init.Priority = DMA_PRIORITY_MEDIUM;\r
    hdma_usart1_rx.Init.FIFOMode = DMA_FIFOMODE_DISABLE;\r
    hdma_usart1_rx.Init.MemBurst = DMA_MBURST_SINGLE;\r
    hdma_usart1_rx.Init.PeriphBurst = DMA_PBURST_SINGLE;\r
    HAL_DMA_Init(&hdma_usart1_rx);\r
\r
    __HAL_LINKDMA(&huart1, hdmarx, hdma_usart1_rx);\r
    __HAL_UART_ENABLE_IT(&huart1, UART_IT_IDLE);\r
\r
    // 普通循环DMA启动，不是MultiBuffer\r
    HAL_UART_Receive_DMA(&huart1, rx_buf, RX_BUF_LEN);\r
}\r
\r
// 半传输：前半段 rx_buf[0~127] 满\r
void HAL_UART_RxHalfCpltCallback(UART_HandleTypeDef *huart)\r
{\r
    if(huart->Instance == USART1)\r
        rx_flag = 1;\r
}\r
// 全传输：后半段 rx_buf[128~255] 满\r
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)\r
{\r
    if(huart->Instance == USART1)\r
        rx_flag = 2;\r
}\r
\r
// 空闲中断\r
void HAL_UART_IdleCpltCallback(UART_HandleTypeDef *huart)\r
{\r
    __HAL_UART_CLEAR_IDLEFLAG(huart);\r
    rx_flag = 3; // 不定长帧标记\r
}\r
\r
// 主循环\r
while(1)\r
{\r
    uint8_t flag = rx_flag;\r
    if(flag == 1)\r
    {\r
        Process(rx_buf, RX_BUF_LEN/2);\r
        rx_flag = 0;\r
    }\r
    else if(flag == 2)\r
    {\r
        Process(rx_buf + RX_BUF_LEN/2, RX_BUF_LEN/2);\r
        rx_flag = 0;\r
    }\r
}\r
\`\`\`\r
\r
### 软硬件区分\r
\r
软件双缓冲（单数组对半）\r
\r
- HT：数组前一半填满\r
\r
- TC：数组后一半填满\r
\r
  两块区域共享同一块内存，存在覆盖风险\r
\r
  \r
\r
  硬件双缓冲（两块独立内存）\r
\r
- TC：M0AR (buf0) 完整填满\r
\r
- HT：M1AR (buf1) 完整填满\r
\r
  \r
\r
  两块内存完全隔离，DMA 写一块、CPU 读另一块，不会互相覆盖\r
\r
**\`HAL_UART_RxCpltCallback\`、\`HAL_UART_RxHalfCpltCallback\` 都是 HAL 库预先定义的弱函数**。\r
\r
不管你开不开硬件 DBM 双缓冲，只要 DMA 是循环模式 CIRCULAR，HT 半传输、TC 全传输中断本身就存在，硬件自带，和 DBM 无关。\r
\r
### HT TC中断\r
\r
前提配置：\r
\r
DMA 模式配置为 \`DMA_CIRCULAR\` 循环模式\r
\r
HAL 初始化时开启了传输完成中断（带_IT 的启动函数）\r
\r
**TC 传输完成**：NDTR 计数降到 0，一整段长度收满\r
\r
**HT 半传输完成**：NDTR 计数走到一半长度\r
\r
## 环形缓冲区（FIFO）\r
\r
双缓冲也会出现丢包得问题，在软件的双缓冲上会出现某一帧被缓冲区截断得情况，在硬件双缓冲会出现某一帧的部分被覆盖得情况，这时候可以采用环形FIFO来减少丢包的问题\r
\r
整体架构\r
\r
底层：DMA 硬件双缓冲 \`buf0 / buf1\`，DMA 自动搬运字节\r
\r
分包层：TC/HT/IDLE 仅置标志，识别哪块缓冲区收完\r
\r
缓存层：环形 FIFO，缓存多包，防止 DMA 覆盖未处理数据\r
\r
业务层：主循环读取 FIFO 解析数据\r
\r
宏与变量\r
\r
\`\`\`c\r
#include "stm32f4xx_hal.h"\r
\r
// DMA双缓冲单块长度\r
#define DMA_BUF_LEN 128\r
// 环形FIFO总大小\r
#define FIFO_TOTAL_LEN 1024\r
\r
// DMA双缓冲两块RAM\r
uint8_t dma_buf0[DMA_BUF_LEN];\r
uint8_t dma_buf1[DMA_BUF_LEN];\r
\r
// 环形FIFO\r
uint8_t uart_fifo[FIFO_TOTAL_LEN];\r
uint16_t fifo_wr = 0;\r
uint16_t fifo_rd = 0;\r
\r
// 缓冲区就绪标记 0无数据 1=buf0就绪 2=buf1就绪\r
volatile uint8_t buf_flag = 0;\r
\r
UART_HandleTypeDef huart1;\r
DMA_HandleTypeDef hdma_usart1_rx;\r
\`\`\`\r
\r
初始化省略\r
\r
DMA 缓冲区数据拷贝进环形 FIFO\r
\r
\`\`\`c\r
// 拷贝数据到环形缓冲区\r
static void Copy_To_Fifo(uint8_t *src, uint16_t len)\r
{\r
    for(uint16_t i = 0; i < len; i++)\r
    {\r
        // 判断FIFO是否满，满则丢弃防止溢出\r
        uint16_t next_wr = fifo_wr + 1;\r
        if(next_wr >= FIFO_TOTAL_LEN) next_wr = 0;\r
        if(next_wr == fifo_rd)\r
        {\r
            return; // FIFO满，直接退出\r
        }\r
\r
        uart_fifo[fifo_wr] = src[i];\r
        fifo_wr = next_wr;\r
    }\r
}\r
\`\`\`\r
\r
DMA 传输完成回调（仅置标记）\r
\r
\`\`\`c\r
// buf0填满触发TC\r
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)\r
{\r
    if(huart->Instance == USART1)\r
        buf_flag = 1;\r
}\r
// buf1填满触发HT\r
void HAL_UART_RxHalfCpltCallback(UART_HandleTypeDef *huart)\r
{\r
    if(huart->Instance == USART1)\r
        buf_flag = 2;\r
}\r
\`\`\`\r
\r
空闲中断回调\r
\r
\`\`\`c\r
void HAL_UART_IdleCpltCallback(UART_HandleTypeDef *huart)\r
{\r
    if(huart->Instance != USART1) return;\r
    __HAL_UART_CLEAR_IDLEFLAG(huart);\r
\r
    // CT=1 当前DMA写buf1 → buf0已收完\r
    if(hdma_usart1_rx.Instance->CR & DMA_SxCR_CT)\r
        buf_flag = 1;\r
    else\r
        buf_flag = 2;\r
}\r
\`\`\`\r
\r
主函数处理\r
\r
\`\`\`c\r
int main(void)\r
{\r
    HAL_Init();\r
    SystemClock_Config();\r
    MX_GPIO_Init();\r
    USART1_DMA_DoubleBuf_Init();\r
\r
    while(1)\r
    {\r
        // 快照读取标记，防止中断覆盖丢失\r
        uint8_t flag = buf_flag;\r
        if(flag != 0)\r
        {\r
            if(flag == 1)\r
            {\r
                Copy_To_Fifo(dma_buf0, DMA_BUF_LEN);\r
            }\r
            else if(flag == 2)\r
            {\r
                Copy_To_Fifo(dma_buf1, DMA_BUF_LEN);\r
            }\r
            buf_flag = 0; // 拷贝完成清除标记\r
        }\r
\r
        // 从环形FIFO取出数据解析\r
        if(fifo_wr != fifo_rd)\r
        {\r
            uint8_t dat = uart_fifo[fifo_rd];\r
            fifo_rd++;\r
            if(fifo_rd >= FIFO_TOTAL_LEN)\r
                fifo_rd = 0;\r
\r
            /*\r
            fifo_wr = (fifo_wr + 1) % FIFO_TOTAL_LEN; if判断可以 取余操作也可以\r
            */\r
            \r
            \r
            // 这里写你的协议解析、打印、业务逻辑\r
            // Example: HAL_UART_Transmit(&huart1, &dat, 1, 10);\r
        }\r
    }\r
}\r
\`\`\`\r
`;export{r as default};

const r=`# Dart 上位机通信协议\r
\r
## 数据结构\r
\r
### 帧头\r
\r
\`\`\`c\r
typedef __packed struct {\r
    uint8_t  sof1;   // 0xAA 固定魔数，用来找帧头\r
    uint8_t  sof2;   // 0x55\r
    uint8_t  ver;    // 协议版本号，便于以后升级\r
    uint8_t  type;   // 命令类型（0x01心跳、0x10模式控制...）\r
    uint8_t  seq;    // 序号，配对请求和响应\r
    uint8_t  len;    // 后面 payload 的字节数\r
} DartFrameHeader_t;\r
\`\`\`\r
\r
seq 单字节帧序列号\r
\r
1. 请求 <--> 应答匹配\r
\r
   上位机发送帧 seq = x 下位机收到回应帧 seq = 5\r
\r
2. 丢吧检测\r
\r
   seq = 上一次seq + 1\r
\r
3. 过滤重复包\r
\r
### 完整帧\r
\r
\`\`\`c\r
#define DART_MAX_PAYLOAD_SIZE 128\r
typedef __packed struct {\r
    DartFrameHeader_t header;\r
    uint8_t           payload[128];\r
    uint16_t          crc16;\r
} DartFrame_t;\r
\`\`\`\r
\r
#### type\r
\r
告诉数据段装的哪种playload\r
\r
一般是枚举\r
\r
\r
\r
### payload 数据段\r
\r
和type关系\r
\r
\`\`\`c\r
//Playload 	 帧头 type=0x10 时，payload 是 CmdModeControl_t\r
typedef __packed struct {\r
    uint8_t mode;       // ← 这个 mode 字段填什么？就用下面的枚举\r
    uint8_t reserved[3];//保留位\r
} CmdModeControl_t;\r
\r
//Type   mode 字段的取值字典\r
typedef enum {\r
    DART_STOP=0x00,     // mode=0 表示停止\r
    DART_MANUAL=0x01,   // mode=1 表示手动\r
    DART_AUTO=0x02      // mode=2 表示自动\r
} DART_state_t;\r
\`\`\`\r
\r
### DartCommInfo_t\r
\r
实例 一般一个\r
\r
\`\`\`c\r
DartCommInfo_t DART1 = {0}; \r
\`\`\`\r
\r
本质作用 ：把整个上位机通信相关的所有状态集中在一个地方管理，让协议层、业务层、其他任务之间有一个 统一的交换枢纽。\r
\r
既有接收端的处理，记录前一次接收和当前接收之后解析的一些状态，也有向上位机的上报，还有给其他任务的标志位。\r
\r
---\r
\r
一块共享数据结构解耦协议层和业务层\r
\r
\r
\r
## 处理函数\r
\r
### Dart_SendFrame\r
\r
\`\`\`c\r
void Dart_SendFrame(uint8_t type, uint8_t seq, void *payload, uint8_t len)\r
{\r
    uint8_t tx_buf[256];\r
    DartFrameHeader_t header = { 0xAA, 0x55, 1, type, seq, len };\r
    memcpy(tx_buf, &header, sizeof(header));           // 1.塞帧头\r
    if (len > 0 && payload) memcpy(tx_buf+sizeof(header), payload, len); // 2.塞payload\r
    // 3. 算 CRC（从 ver 字段开始算）\r
    uint16_t crc = Get_CRC16_Check_Sum_PC(tx_buf+2, total_len-2, CRC_INIT);\r
    tx_buf[total_len]   = crc & 0xFF;                  // 4.小端塞CRC\r
    tx_buf[total_len+1] = (crc >> 8) & 0xFF;\r
    HAL_UART_Transmit(&huart1, tx_buf, total_len+2, 1000); // 5.发送\r
}\r
\`\`\`\r
\r
#### 业务发送函数\r
\r
本质上是playload 的组织 最终都要走 Dart_SendFrame 来最终的发送\r
\r
形参一般都是结构体和状态标志位 \r
\r
反馈状态\r
\r
\`\`\`c\r
void Dart_SendSystemStatus(uint8_t dart_status, uint8_t dev_mode,\r
                           uint8_t current_stage, uint8_t dart_number)\r
{\r
    RespSystemStatus_t status;        // ① 在栈上开一个结构体变量\r
    static uint8_t seq = 0;\r
\r
    status.dart_status   = dart_status;        // ② 填字段\r
    status.dev_mode      = dev_mode;\r
    status.current_stage = current_stage;\r
    status.dart_number   = dart_number;\r
    status.reserved[0]   = 0;\r
    status.reserved[1]   = 0;\r
\r
    Dart_SendFrame(0x20, seq++, &status, sizeof(status));  // ③ 把地址传进去\r
}\r
\`\`\`\r
\r
反馈电机\r
\r
结构体是bs_can里面定义的接收的结构体\r
\r
\`\`\`c\r
void Dart_SendMotorStatus(uint8_t motor_id, MOTOR_RECEIVE_DATA *motor, ...)\r
{\r
    RespMotorStatus_t status;                    // ① 开结构体\r
\r
    status.motor_id     = motor_id;              // ② 填字段\r
    status.temperature  = (int8_t)motor->motor_temputer_fdb;\r
    status.electric     = motor->motor_current_fdb;\r
    status.speed        = motor->motor_speed_fdb;\r
    status.angle        = motor->motor_angle_fdb;\r
    status.abs_angle    = (int32_t)angle->angle;\r
\r
    Dart_SendFrame(0x23, seq++, &status, sizeof(status));  // ③ 传地址+大小\r
}\r
\`\`\`\r
\r
\r
\r
### Dart_Read_Data\r
\r
接收函数 协议解析 \r
\r
\`\`\`c\r
/* ==================== 接收解析函数 ==================== */\r
int resp1;\r
int heartbeat_count;\r
void Dart_Read_Data(uint8_t *buf)\r
{\r
    dart_read_called++;\r
    \r
    // 1. 帧头检查\r
    if (buf[0] != FRAME_SOF1 || buf[1] != FRAME_SOF2) {\r
        dart_sof_fail++;\r
        return;\r
    }\r
\r
    DartFrameHeader_t *hdr = (DartFrameHeader_t *)buf;\r
\r
    // 2. 计算整帧长度：帧头(6) + payload(len) + CRC16(2)\r
    uint16_t frame_len = sizeof(DartFrameHeader_t) + hdr->len + 2;\r
\r
    // 3. 边界检查：防止越界（假设缓冲区至少 256 字节）\r
    if (frame_len > 256) {\r
        return;\r
    }\r
\r
    // 4. CRC16 校验（从 ver 到 payload 末尾，不包括 CRC 自身）\r
    //    Verify_CRC16_Check_Sum 期望传入长度 = 数据长度 + 2（CRC本身）\r
    //    这里传入 frame_len - 2，函数内部会取出最后2字节作为CRC比较\r
    if (Verify_CRC16_Check_Sum_PC(buf + 2, hdr->len + 6) == 0) {\r
        dart_crc_fail++;\r
        return;\r
    }\r
\r
    // 5. 版本检查（文档要求返回错误，但为避免干扰调试，先注释）\r
    if (hdr->ver != 1) {\r
        Dart_SendError(hdr->type, ERR_VERSION, 0);\r
        return;\r
    }\r
\r
    // 6. 根据 type 处理 payload\r
    uint8_t *payload_start = buf + sizeof(DartFrameHeader_t);\r
    switch (hdr->type) {\r
        case 0x01: // 心跳请求（无 payload）\r
        {\r
           heartbeat_count++;\r
           DART1.last_type = 0x01;\r
           DART1.frame_received = 1;\r
           break;\r
        }\r
\r
        case 0x10: // 模式控制\r
					  \r
            if (hdr->len < 1) break;\r
				    resp1++;\r
            memcpy(&DART1.last_command.cmd_mode, payload_start, sizeof(CmdModeControl_t));\r
            DART1.last_type = hdr->type;\r
            DART1.last_seq  = hdr->seq;\r
            DART1.frame_received = 1;\r
            break;\r
\r
        case 0x11: // 开发者模式\r
            if (hdr->len < 1) break;\r
            memcpy(&DART1.last_command.cmd_dev, payload_start, sizeof(CmdDevMode_t));\r
            DART1.last_type = hdr->type;\r
            DART1.last_seq  = hdr->seq;\r
            DART1.frame_received = 1;\r
				    switch(DART1.last_command.cmd_dev.enable)\r
					 {\r
							case DEV_ENABLE:\r
							DART1.dev_mode=0;\r
						 \r
						  case DEV_DISABLE:\r
							DART1.dev_mode=1;\r
						}\r
            break;\r
\r
        case 0x12: // 阶段控制\r
            if (hdr->len < 1) break;\r
            memcpy(&DART1.last_command.cmd_stage, payload_start, sizeof(CmdStageControl_t));\r
            DART1.last_type = hdr->type;\r
            DART1.last_seq  = hdr->seq;\r
            DART1.frame_received = 1;\r
				    switch(DART1.last_command.cmd_stage.action)\r
					 {\r
							case 0x00:\r
							DART1.stage_flag=CHANGE_DONE;\r
						  break;\r
							\r
						  case 0X01:\r
							DART1.stage_flag=CHANGE_RESET;\r
							break;\r
							\r
							default:\r
              DART1.stage_flag=CHANGE_NOT;\r
						}\r
            break;\r
				\r
\r
        case 0x13: // 动作控制\r
				{\r
            if (hdr->len < 1) break;\r
            memcpy(&DART1.last_command.cmd_action, payload_start, sizeof(CmdActionControl_t));\r
            DART1.last_type = hdr->type;\r
            DART1.last_seq  = hdr->seq;\r
            DART1.frame_received = 1;\r
			switch (DART1.last_command.cmd_action.action)\r
           {\r
              case ACTION_FIRE:\r
                   DART1.action_flag = ACTION_FIRE;\r
                   break;\r
\r
              case ACTION_AIM_UP:\r
                   DART1.action_flag = ACTION_AIM_UP;\r
                   break;\r
\r
              case ACTION_AIM_DOWN:\r
                   DART1.action_flag = ACTION_AIM_DOWN;\r
                   break;\r
\r
              case ACTION_LR:\r
                   if (DART1.last_command.cmd_action.value == DIR_RIGHT)\r
                       DART1.action_flag = ACTION_LR;\r
                   else if (DART1.last_command.cmd_action.value == DIR_LEFT)\r
                       DART1.action_flag = ACTION_LR;\r
                       DART1.dir_flag = (uint8_t)DART1.last_command.cmd_action.value;\r
                   break;\r
\r
              default:\r
                   DART1.action_flag = ACTION_NONE;\r
                   break;\r
            }\r
            break;\r
				}\r
        case 0x14: // 四发飞镖参数命令 (v1.1)\r
        {\r
            if (hdr->len < 1) break;\r
            CmdDartParam_t *cmd = (CmdDartParam_t *)payload_start;\r
            if (cmd->dart_count != 4) {\r
                Dart_SendError(hdr->type, ERR_PARAM, 0);\r
                return;\r
            }\r
            memcpy(&DART1.last_command.cmd_dart_param, payload_start, sizeof(CmdDartParam_t));\r
            DART1.last_type = hdr->type;\r
            DART1.last_seq  = hdr->seq;\r
            DART1.frame_received = 1;\r
            break;\r
        }\r
\r
        default:\r
            Dart_SendError(hdr->type, ERR_INVALID_CMD, 0);\r
            break;\r
    }\r
\r
    // 7. 粘包处理：检查是否还有下一帧\r
    if (frame_len < 256 && buf[frame_len] == FRAME_SOF1) {\r
        Dart_Read_Data(buf + frame_len);\r
    }\r
}\r
\`\`\`\r
\r
根据type处理playload那里不少都是对DartCommInfo_t的填充（全局实例DART1的填充），完成不同层级之间的关系  \r
\r
eg case 不同的type 从buf里面提取出不同的数据填充进DartCommInfo_t，方便外部函数的调用，同时记录当前接收的状态\r
\r
\r
\r
\r
\r
\r
\r
### DMA+空闲终中断\r
\r
\`\`\`c\r
int usart1 = 0;\r
\r
void USART1_IRQHandler(void)\r
{\r
    usart1++;\r
    uint8_t res;\r
    uint16_t recv_len;\r
\r
    if (huart1.Instance->SR & UART_FLAG_IDLE)\r
    {\r
        res = res;\r
        res = USART1->SR;\r
        res = USART1->DR;\r
\r
        __HAL_DMA_DISABLE(&hdma_usart1_rx);\r
        recv_len = 256 - __HAL_DMA_GET_COUNTER(&hdma_usart1_rx);\r
\r
        /* 先拷贝再重启，顺序不能反 */\r
        if (recv_len > 0)\r
        {   \r
					  frame_interval = HAL_GetTick() - last_recv_tick;\r
					  last_recv_tick = HAL_GetTick();\r
            memcpy(usart1_rx_temp, DART1.rx_buffer, recv_len);\r
            Dart_Read_Data(usart1_rx_temp);\r
        }\r
				else\r
        {\r
            /* 没有收到数据，重置为默认无动作 */\r
            DART1.last_command.cmd_action.action = 0x04;\r
					  DART1.last_command.cmd_stage.action= 0x04;\r
            DART1.frame_received = 0;\r
        }\r
\r
        memset(DART1.rx_buffer, 0, 256);\r
        __HAL_DMA_CLEAR_FLAG(&hdma_usart1_rx, DMA_FLAG_TCIF2_6);\r
        __HAL_DMA_SET_COUNTER(&hdma_usart1_rx, 256);\r
        dma_init_ret=HAL_UART_Receive_DMA(&huart1, DART1.rx_buffer, 256);\r
        __HAL_DMA_ENABLE(&hdma_usart1_rx);\r
    }\r
}\r
\`\`\`\r
\r
剩下的是查表 计算校验\r
\r
\r
\r
### client_task.c\r
\r
调度的作用  大多都是起上报的作用 飞镖上报给上位机自己的各种状态\r
\r
\`\`\`c\r
void ClientTask(void  * argument)\r
{\r
    uint32_t last_system_tick     = 0;\r
    uint32_t last_motor_tick      = 0;\r
	\r
	for(;;)\r
	{\r
        uint32_t now = HAL_GetTick();		\r
		    /* 遥控器在线状态检测 */\r
        if (now - RC_last_recv_tick > RC_OFFLINE_TIMEOUT)// 超时则认为离线\r
        {\r
           RC_recive_flag = 0;  // 超时清零\r
         }				\r
        /* 点动超时复位，20ms检查一次 */\r
        if (now - last_recv_tick > ACTION_HOLD_TIME)\r
        {\r
            DART1.action_flag = ACTION_NONE;\r
            DART1.dir_flag    = 0;\r
					  DART1.stage_flag  = CHANGE_NOT;\r
        }\r
        /* 心跳应答，收到就回，无需周期限制 */\r
        if (DART1.last_type == 0x01 && DART1.frame_received)\r
        {\r
            RespHeartbeat_t resp;\r
            resp.device_state     = 1;\r
            resp.protocol_version = 1;\r
            resp.uptime_sec       = now / 1000;\r
            memset(resp.reserved, 0, 2);\r
					  DART1.response=1;\r
            Dart_SendFrame(0x02, DART1.last_seq, &resp, sizeof(resp));\r
            DART1.frame_received  = 0;\r
            DART1.last_type       = 0;\r
        }\r
        /* 系统状态上报，100ms一次 */\r
        if (now - last_system_tick >= 100)\r
        {\r
            last_system_tick = now;\r
            Dart_SendSystemStatus(\r
                DART1.sys_status,\r
                DART1.dev_mode,\r
                DART1.sys_stage,\r
                DART1.dart_number\r
            );\r
					  Dart_SendlauncherStatus(\r
					      DART1.launcher_status,\r
					      DART1.launcher_stage,\r
					      DART1.launcher_motor_status,\r
					      DART1.trigger_locked\r
					  );\r
        }\r
        /* 电机状态上报，50ms一次 */\r
        if (now - last_motor_tick >= 50)\r
        {\r
            last_motor_tick = now;\r
            Dart_SendMotorStatus(0x03, &dart.motor_rx[M3], &dart.motor_angle[M3], motor_yaw_state_motion);    //M3为yaw电机\r
            Dart_SendMotorStatus(0x04, &dart.motor_rx[M4], &dart.motor_angle[M4], motor_pitch_state_motion);  //M4为pitch电机 \r
        }						\r
        osDelay(10);  // 任务最小粒度10ms\r
     }\r
}\r
\r
\`\`\`\r
\r
\r
\r
\r
\r
\r
\r
## 错误码\r
\r
\`\`\`c\r
typedef enum {\r
    ERR_CRC          = 0x01,  // CRC 校验失败\r
    ERR_SOF          = 0x02,  // 帧头错误（不是 AA 55）\r
    ERR_VERSION      = 0x03,  // 协议版本不对\r
    ERR_LENGTH       = 0x04,  // 长度异常\r
    ERR_INVALID_CMD  = 0x05,  // 不认识的命令 type\r
    ERR_STATE_FORBID = 0x06,  // 当前状态不允许此操作\r
    ERR_BUSY         = 0x07,  // 设备忙\r
    ERR_PARAM        = 0x08,  // 参数错误\r
    ERR_PERMISSION   = 0x09,  // 权限不足\r
    ERR_INTERNAL     = 0x0A   // 内部错误\r
} ErrorCode_t;\r
\`\`\`\r
\r
结构体  错误帧的数据段组成\r
\r
\`\`\`c\r
typedef __packed struct {\r
    uint8_t  ref_type;      // 哪个命令出错\r
    uint8_t  error_code;    // 错误码\r
    uint16_t detail;        // 错误详情\r
} RespError_t;              // 共 4 字节\r
\`\`\`\r
\r
\`\`\`c\r
void Dart_SendError(uint8_t ref_type, uint8_t err_code, uint16_t detail)\r
{\r
    RespError_t err;\r
    err.ref_type   = ref_type;      // 引起错误的原命令 type\r
    err.error_code = err_code;      // 错误码\r
    err.detail     = detail;        // 错误详情（可选）\r
    Dart_SendFrame(0x7F, DART1.last_seq, &err, sizeof(err));\r
}\r
\`\`\`\r
\r
发送错误帧\r
\r
\r
\r
## 交互\r
\r
DART1数据来源\r
\r
写入 1、上位机的解析写入\r
\r
​	 2、dart_task and dart_ctrl 写入\r
\r
读出 1、dart_ctrl控制\r
\r
​	 2、协议读出上报\r
\r
\r
\r
`;export{r as default};

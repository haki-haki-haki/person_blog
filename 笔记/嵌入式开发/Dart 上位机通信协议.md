# Dart 上位机通信协议

## 数据结构

### 帧头

```c
typedef __packed struct {
    uint8_t  sof1;   // 0xAA 固定魔数，用来找帧头
    uint8_t  sof2;   // 0x55
    uint8_t  ver;    // 协议版本号，便于以后升级
    uint8_t  type;   // 命令类型（0x01心跳、0x10模式控制...）
    uint8_t  seq;    // 序号，配对请求和响应
    uint8_t  len;    // 后面 payload 的字节数
} DartFrameHeader_t;
```

seq 单字节帧序列号

1. 请求 <--> 应答匹配

   上位机发送帧 seq = x 下位机收到回应帧 seq = 5

2. 丢吧检测

   seq = 上一次seq + 1

3. 过滤重复包

### 完整帧

```c
#define DART_MAX_PAYLOAD_SIZE 128
typedef __packed struct {
    DartFrameHeader_t header;
    uint8_t           payload[128];
    uint16_t          crc16;
} DartFrame_t;
```

#### type

告诉数据段装的哪种playload

一般是枚举



### payload 数据段

和type关系

```c
//Playload 	 帧头 type=0x10 时，payload 是 CmdModeControl_t
typedef __packed struct {
    uint8_t mode;       // ← 这个 mode 字段填什么？就用下面的枚举
    uint8_t reserved[3];//保留位
} CmdModeControl_t;

//Type   mode 字段的取值字典
typedef enum {
    DART_STOP=0x00,     // mode=0 表示停止
    DART_MANUAL=0x01,   // mode=1 表示手动
    DART_AUTO=0x02      // mode=2 表示自动
} DART_state_t;
```

### DartCommInfo_t

实例 一般一个

```c
DartCommInfo_t DART1 = {0}; 
```

本质作用 ：把整个上位机通信相关的所有状态集中在一个地方管理，让协议层、业务层、其他任务之间有一个 统一的交换枢纽。

既有接收端的处理，记录前一次接收和当前接收之后解析的一些状态，也有向上位机的上报，还有给其他任务的标志位。

---

一块共享数据结构解耦协议层和业务层



## 处理函数

### Dart_SendFrame

```c
void Dart_SendFrame(uint8_t type, uint8_t seq, void *payload, uint8_t len)
{
    uint8_t tx_buf[256];
    DartFrameHeader_t header = { 0xAA, 0x55, 1, type, seq, len };
    memcpy(tx_buf, &header, sizeof(header));           // 1.塞帧头
    if (len > 0 && payload) memcpy(tx_buf+sizeof(header), payload, len); // 2.塞payload
    // 3. 算 CRC（从 ver 字段开始算）
    uint16_t crc = Get_CRC16_Check_Sum_PC(tx_buf+2, total_len-2, CRC_INIT);
    tx_buf[total_len]   = crc & 0xFF;                  // 4.小端塞CRC
    tx_buf[total_len+1] = (crc >> 8) & 0xFF;
    HAL_UART_Transmit(&huart1, tx_buf, total_len+2, 1000); // 5.发送
}
```

#### 业务发送函数

本质上是playload 的组织 最终都要走 Dart_SendFrame 来最终的发送

形参一般都是结构体和状态标志位 

反馈状态

```c
void Dart_SendSystemStatus(uint8_t dart_status, uint8_t dev_mode,
                           uint8_t current_stage, uint8_t dart_number)
{
    RespSystemStatus_t status;        // ① 在栈上开一个结构体变量
    static uint8_t seq = 0;

    status.dart_status   = dart_status;        // ② 填字段
    status.dev_mode      = dev_mode;
    status.current_stage = current_stage;
    status.dart_number   = dart_number;
    status.reserved[0]   = 0;
    status.reserved[1]   = 0;

    Dart_SendFrame(0x20, seq++, &status, sizeof(status));  // ③ 把地址传进去
}
```

反馈电机

结构体是bs_can里面定义的接收的结构体

```c
void Dart_SendMotorStatus(uint8_t motor_id, MOTOR_RECEIVE_DATA *motor, ...)
{
    RespMotorStatus_t status;                    // ① 开结构体

    status.motor_id     = motor_id;              // ② 填字段
    status.temperature  = (int8_t)motor->motor_temputer_fdb;
    status.electric     = motor->motor_current_fdb;
    status.speed        = motor->motor_speed_fdb;
    status.angle        = motor->motor_angle_fdb;
    status.abs_angle    = (int32_t)angle->angle;

    Dart_SendFrame(0x23, seq++, &status, sizeof(status));  // ③ 传地址+大小
}
```



### Dart_Read_Data

接收函数 协议解析 

```c
/* ==================== 接收解析函数 ==================== */
int resp1;
int heartbeat_count;
void Dart_Read_Data(uint8_t *buf)
{
    dart_read_called++;
    
    // 1. 帧头检查
    if (buf[0] != FRAME_SOF1 || buf[1] != FRAME_SOF2) {
        dart_sof_fail++;
        return;
    }

    DartFrameHeader_t *hdr = (DartFrameHeader_t *)buf;

    // 2. 计算整帧长度：帧头(6) + payload(len) + CRC16(2)
    uint16_t frame_len = sizeof(DartFrameHeader_t) + hdr->len + 2;

    // 3. 边界检查：防止越界（假设缓冲区至少 256 字节）
    if (frame_len > 256) {
        return;
    }

    // 4. CRC16 校验（从 ver 到 payload 末尾，不包括 CRC 自身）
    //    Verify_CRC16_Check_Sum 期望传入长度 = 数据长度 + 2（CRC本身）
    //    这里传入 frame_len - 2，函数内部会取出最后2字节作为CRC比较
    if (Verify_CRC16_Check_Sum_PC(buf + 2, hdr->len + 6) == 0) {
        dart_crc_fail++;
        return;
    }

    // 5. 版本检查（文档要求返回错误，但为避免干扰调试，先注释）
    if (hdr->ver != 1) {
        Dart_SendError(hdr->type, ERR_VERSION, 0);
        return;
    }

    // 6. 根据 type 处理 payload
    uint8_t *payload_start = buf + sizeof(DartFrameHeader_t);
    switch (hdr->type) {
        case 0x01: // 心跳请求（无 payload）
        {
           heartbeat_count++;
           DART1.last_type = 0x01;
           DART1.frame_received = 1;
           break;
        }

        case 0x10: // 模式控制
					  
            if (hdr->len < 1) break;
				    resp1++;
            memcpy(&DART1.last_command.cmd_mode, payload_start, sizeof(CmdModeControl_t));
            DART1.last_type = hdr->type;
            DART1.last_seq  = hdr->seq;
            DART1.frame_received = 1;
            break;

        case 0x11: // 开发者模式
            if (hdr->len < 1) break;
            memcpy(&DART1.last_command.cmd_dev, payload_start, sizeof(CmdDevMode_t));
            DART1.last_type = hdr->type;
            DART1.last_seq  = hdr->seq;
            DART1.frame_received = 1;
				    switch(DART1.last_command.cmd_dev.enable)
					 {
							case DEV_ENABLE:
							DART1.dev_mode=0;
						 
						  case DEV_DISABLE:
							DART1.dev_mode=1;
						}
            break;

        case 0x12: // 阶段控制
            if (hdr->len < 1) break;
            memcpy(&DART1.last_command.cmd_stage, payload_start, sizeof(CmdStageControl_t));
            DART1.last_type = hdr->type;
            DART1.last_seq  = hdr->seq;
            DART1.frame_received = 1;
				    switch(DART1.last_command.cmd_stage.action)
					 {
							case 0x00:
							DART1.stage_flag=CHANGE_DONE;
						  break;
							
						  case 0X01:
							DART1.stage_flag=CHANGE_RESET;
							break;
							
							default:
              DART1.stage_flag=CHANGE_NOT;
						}
            break;
				

        case 0x13: // 动作控制
				{
            if (hdr->len < 1) break;
            memcpy(&DART1.last_command.cmd_action, payload_start, sizeof(CmdActionControl_t));
            DART1.last_type = hdr->type;
            DART1.last_seq  = hdr->seq;
            DART1.frame_received = 1;
			switch (DART1.last_command.cmd_action.action)
           {
              case ACTION_FIRE:
                   DART1.action_flag = ACTION_FIRE;
                   break;

              case ACTION_AIM_UP:
                   DART1.action_flag = ACTION_AIM_UP;
                   break;

              case ACTION_AIM_DOWN:
                   DART1.action_flag = ACTION_AIM_DOWN;
                   break;

              case ACTION_LR:
                   if (DART1.last_command.cmd_action.value == DIR_RIGHT)
                       DART1.action_flag = ACTION_LR;
                   else if (DART1.last_command.cmd_action.value == DIR_LEFT)
                       DART1.action_flag = ACTION_LR;
                       DART1.dir_flag = (uint8_t)DART1.last_command.cmd_action.value;
                   break;

              default:
                   DART1.action_flag = ACTION_NONE;
                   break;
            }
            break;
				}
        case 0x14: // 四发飞镖参数命令 (v1.1)
        {
            if (hdr->len < 1) break;
            CmdDartParam_t *cmd = (CmdDartParam_t *)payload_start;
            if (cmd->dart_count != 4) {
                Dart_SendError(hdr->type, ERR_PARAM, 0);
                return;
            }
            memcpy(&DART1.last_command.cmd_dart_param, payload_start, sizeof(CmdDartParam_t));
            DART1.last_type = hdr->type;
            DART1.last_seq  = hdr->seq;
            DART1.frame_received = 1;
            break;
        }

        default:
            Dart_SendError(hdr->type, ERR_INVALID_CMD, 0);
            break;
    }

    // 7. 粘包处理：检查是否还有下一帧
    if (frame_len < 256 && buf[frame_len] == FRAME_SOF1) {
        Dart_Read_Data(buf + frame_len);
    }
}
```

根据type处理playload那里不少都是对DartCommInfo_t的填充（全局实例DART1的填充），完成不同层级之间的关系  

eg case 不同的type 从buf里面提取出不同的数据填充进DartCommInfo_t，方便外部函数的调用，同时记录当前接收的状态







### DMA+空闲终中断

```c
int usart1 = 0;

void USART1_IRQHandler(void)
{
    usart1++;
    uint8_t res;
    uint16_t recv_len;

    if (huart1.Instance->SR & UART_FLAG_IDLE)
    {
        res = res;
        res = USART1->SR;
        res = USART1->DR;

        __HAL_DMA_DISABLE(&hdma_usart1_rx);
        recv_len = 256 - __HAL_DMA_GET_COUNTER(&hdma_usart1_rx);

        /* 先拷贝再重启，顺序不能反 */
        if (recv_len > 0)
        {   
					  frame_interval = HAL_GetTick() - last_recv_tick;
					  last_recv_tick = HAL_GetTick();
            memcpy(usart1_rx_temp, DART1.rx_buffer, recv_len);
            Dart_Read_Data(usart1_rx_temp);
        }
				else
        {
            /* 没有收到数据，重置为默认无动作 */
            DART1.last_command.cmd_action.action = 0x04;
					  DART1.last_command.cmd_stage.action= 0x04;
            DART1.frame_received = 0;
        }

        memset(DART1.rx_buffer, 0, 256);
        __HAL_DMA_CLEAR_FLAG(&hdma_usart1_rx, DMA_FLAG_TCIF2_6);
        __HAL_DMA_SET_COUNTER(&hdma_usart1_rx, 256);
        dma_init_ret=HAL_UART_Receive_DMA(&huart1, DART1.rx_buffer, 256);
        __HAL_DMA_ENABLE(&hdma_usart1_rx);
    }
}
```

剩下的是查表 计算校验



### client_task.c

调度的作用  大多都是起上报的作用 飞镖上报给上位机自己的各种状态

```c
void ClientTask(void  * argument)
{
    uint32_t last_system_tick     = 0;
    uint32_t last_motor_tick      = 0;
	
	for(;;)
	{
        uint32_t now = HAL_GetTick();		
		    /* 遥控器在线状态检测 */
        if (now - RC_last_recv_tick > RC_OFFLINE_TIMEOUT)// 超时则认为离线
        {
           RC_recive_flag = 0;  // 超时清零
         }				
        /* 点动超时复位，20ms检查一次 */
        if (now - last_recv_tick > ACTION_HOLD_TIME)
        {
            DART1.action_flag = ACTION_NONE;
            DART1.dir_flag    = 0;
					  DART1.stage_flag  = CHANGE_NOT;
        }
        /* 心跳应答，收到就回，无需周期限制 */
        if (DART1.last_type == 0x01 && DART1.frame_received)
        {
            RespHeartbeat_t resp;
            resp.device_state     = 1;
            resp.protocol_version = 1;
            resp.uptime_sec       = now / 1000;
            memset(resp.reserved, 0, 2);
					  DART1.response=1;
            Dart_SendFrame(0x02, DART1.last_seq, &resp, sizeof(resp));
            DART1.frame_received  = 0;
            DART1.last_type       = 0;
        }
        /* 系统状态上报，100ms一次 */
        if (now - last_system_tick >= 100)
        {
            last_system_tick = now;
            Dart_SendSystemStatus(
                DART1.sys_status,
                DART1.dev_mode,
                DART1.sys_stage,
                DART1.dart_number
            );
					  Dart_SendlauncherStatus(
					      DART1.launcher_status,
					      DART1.launcher_stage,
					      DART1.launcher_motor_status,
					      DART1.trigger_locked
					  );
        }
        /* 电机状态上报，50ms一次 */
        if (now - last_motor_tick >= 50)
        {
            last_motor_tick = now;
            Dart_SendMotorStatus(0x03, &dart.motor_rx[M3], &dart.motor_angle[M3], motor_yaw_state_motion);    //M3为yaw电机
            Dart_SendMotorStatus(0x04, &dart.motor_rx[M4], &dart.motor_angle[M4], motor_pitch_state_motion);  //M4为pitch电机 
        }						
        osDelay(10);  // 任务最小粒度10ms
     }
}

```







## 错误码

```c
typedef enum {
    ERR_CRC          = 0x01,  // CRC 校验失败
    ERR_SOF          = 0x02,  // 帧头错误（不是 AA 55）
    ERR_VERSION      = 0x03,  // 协议版本不对
    ERR_LENGTH       = 0x04,  // 长度异常
    ERR_INVALID_CMD  = 0x05,  // 不认识的命令 type
    ERR_STATE_FORBID = 0x06,  // 当前状态不允许此操作
    ERR_BUSY         = 0x07,  // 设备忙
    ERR_PARAM        = 0x08,  // 参数错误
    ERR_PERMISSION   = 0x09,  // 权限不足
    ERR_INTERNAL     = 0x0A   // 内部错误
} ErrorCode_t;
```

结构体  错误帧的数据段组成

```c
typedef __packed struct {
    uint8_t  ref_type;      // 哪个命令出错
    uint8_t  error_code;    // 错误码
    uint16_t detail;        // 错误详情
} RespError_t;              // 共 4 字节
```

```c
void Dart_SendError(uint8_t ref_type, uint8_t err_code, uint16_t detail)
{
    RespError_t err;
    err.ref_type   = ref_type;      // 引起错误的原命令 type
    err.error_code = err_code;      // 错误码
    err.detail     = detail;        // 错误详情（可选）
    Dart_SendFrame(0x7F, DART1.last_seq, &err, sizeof(err));
}
```

发送错误帧



## 交互

DART1数据来源

写入 1、上位机的解析写入

​	 2、dart_task and dart_ctrl 写入

读出 1、dart_ctrl控制

​	 2、协议读出上报




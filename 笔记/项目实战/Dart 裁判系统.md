# Dart 裁判系统

## 外设+中断

USART6+DMA2

USART6_IRQHandler + DMA2_Stream1_IRQHandler

额外 GPIO	PG4 — 收到有效帧头 0xA5 时拉低，调试指示灯



## 通信协议

### 整体帧格式

┌──────┬────────────┬─────┬──────┬──
│ SOF  │ DataLength │ Seq │ CRC8 │ CmdID  │    Data      │ CRC16 │
│ 1B   │    2B      │ 1B  │  1B  │  2B    │    n 字节    │  2B   │
│ 0xA5 │  小端序    │序号  │帧头校 │ 命令码 │  实际数据  │帧尾校 │
└──────┴────────────┴─────┴──────┴──



### 相关 宏 结构体 变量 枚举

#### 定义字节数

```c
#define    LEN_HEADER    5        //帧头长
#define    LEN_CMDID     2        //命令码长度
#define    LEN_TAIL      2	      //帧尾CRC16
```

#### 通信协议数组的偏移量

```c
//通信协议格式
typedef enum  
{
	FRAME_HEADER         = 0,
	CMD_ID               = 5,
	DATA                 = 7,
}JudgeFrameOffset;
```

#### 帧头

```c
// frame_header 格式
typedef enum
{
	SOF_t          = 0,//起始位
	DATA_LENGTH_t  = 1,//帧内数据长度,根据这个来获取数据长度
	SEQ_t          = 3,//包序号
	CRC8_t         = 4 //CRC8	
}	FrameHeaderOffset;
```

`SEQ_t`

裁判系统每一帧 Seq 自增 1（到 255 后归零），参与校验。

- 检测丢帧
- 检测重复帧

```c
typedef __packed struct
{
	uint8_t  SOF;
	uint16_t DataLength;
	uint8_t  Seq;
	uint8_t  CRC8;	
}xFrameHeader;


memcpy(&REF.FrameHeader, buf, 5);
```

FrameHeaderOffset 枚举 → 命名偏移量
xFrameHeader 结构体   → 用 __packed 直接映射到原始字节



#### 命令码

官方给出

```c
//命令码ID
typedef enum
{
	ID_game_state                          = 0x0001, 			//比赛状态数据
	ID_game_result                         = 0x0002,			//比赛结果数据
	ID_game_robot_survivors                = 0x0003,			//比赛机器人血量数据
	ID_game_missile_state                  = 0x0004, 			//飞镖发射状态
	ID_game_buff                           = 0x0005,			//buff
	
	ID_event_data  				          = 0x0101,			   //场地事件数据 
	ID_supply_projectile_action   	       = 0x0102,			//场地补给站动作标识数据
	ID_supply_warm                         = 0x0104,			//裁判系统警告数据
	ID_missile_shoot_time                  = 0x0105, 			//飞镖发射口倒计时
	
	ID_game_robot_state    			      = 0x0201,			   //机器人状态数据
	ID_power_heat_data    			      = 0x0202,			   //实时功率热量数据
	ID_game_robot_pos        		      = 0x0203,			   //机器人位置数据
	ID_buff_musk					     = 0x0204,			 //机器人增益数据
	ID_aerial_robot_energy			      = 0x0205,			  //空中机器人支援时间数据
	ID_robot_hurt					     = 0x0206,			 //伤害状态数据
	ID_shoot_data					     = 0x0207,			 //实时射击数据
	ID_bullet_remaining                    = 0x0208,		   //允许发射数
	ID_rfid_status						 = 0x0209,			 //机器人RFID状态，1Hz
	
  
	ID_robot_interactive_header_data	   = 0x0301,		    //机器人交互数据，——发送方触发——发送 10Hz
	ID_controller_interactive_header_data  = 0x0302,			//自定义控制器交互数据接口，通过——客户端触发——发送 30Hz
	ID_map_interactive_header_data         = 0x0303,			//客户端小地图交互数据，——触发发送——
	ID_keyboard_information                = 0x0304,			//键盘、鼠标信息，通过——图传串口——发送
	ID_map_robot_data                      = 0x0305,             //接收地图机器人数据
	ID_custom_info						 = 0X0308			  //发送自定义消息
	
}CmdID;
```

#### 占据字节

飞镖只需要0x0001 和 0x0002 两个命令码 因此此枚举的ext只列举了两个

```c
//数据段长度
typedef enum
{
	/* Std 静态固定不变 */  
	LEN_FRAME_HEAD 	                  = 5,	// 帧头长度
	LEN_CMD_ID 		                  = 2,	// 命令码长度
	LEN_FRAME_TAIL 	                  = 2,	// 帧尾CRC16
	/* Ext 动态 根据命令码的不同数据data长度不同*/  
	LEN_game_state       			= 11,	//0x0001
    LEN_game_dart_state     		 =  4,	//0x0002

}JudgeDataLength;   
```

#### 数据data段

##### CmdID=0x0001

game_status_t

11字节

```c
/* ID: 0x0001  Byte:  11    比赛状态数据 */
typedef __packed struct 
{ 
	//位域
	uint8_t game_type : 4;		// 只用 1 字节中的低 4 位
	uint8_t game_progress : 4;  // 只用 1 字节中的高 4 位
	uint16_t stage_remain_time; //剩余时间  2字节
  uint64_t SyncTimeStamp;     	//同步时间戳  8字节
}game_status_t; 
```

作用 判断发射

```c
memcpy(&REF.GameState, buf + 7, 11);
REF.GameState.game_type     = 比赛类型
REF.GameState.game_progress = 比赛阶段(用来触发自动发射)
```

##### CmdID=0x020A

dart_client_cmd_t

4字节

```c
typedef __packed struct {
    uint8_t dart_launch_opening_status;  // 发射口状态 发射舱门开关
    uint8_t reserved;                    // 保留  协议必须的保留位置 占位作用
    uint16_t target_change_time;         // 目标变化时间  目标（前哨站/基地）位置在上次变化后已经过了多少毫秒  没有使用
    uint16_t latest_launch_cmd_time;     // 发射命令时间  最新发射命令时间
} dart_client_cmd_t;                     // 总共: 1+1+2+2 = 6 字节
                                         // 但 LEN_game_dart_state=4！
```

buf[7]  buf[8]  buf[9]  buf[10]  buf[11]  buf[12]  分别对应

 [0] ← buf[7]   dart_launch_opening_status      
    [1] ← buf[8]   reserved                     
    [2] ← buf[9]   target_change_time  低字节   
    [3] ← buf[10]  target_change_time  高字节  



#### Referee_info_t

解析后存放容器

解析后的缓存区，是各种帧数据的"目的地"

```c
typedef struct{
	xFrameHeader		  FrameHeader;				// 帧头信息
	game_status_t          GameState;				//buf[7..17] 数据段
	dart_client_cmd_t      dartstate;				//buf[7..10] 数据段
	CmdID				  cmdid;                    //命令码
	bool flag;
    
} Referee_info_t;
```



### 小端序

<!--低八位在前 高八位在后-->

如0x0001  buf[2]  buf[0] 对应0x01  buf[1] 对应0x00

移位操作 uint16_4 num = buf[1] >> 8 | buf[0] ;



2026VGD飞镖裁判系统中有		

​	`//读出来低字节 低八位  高八位舍去  在飞镖中可以舍去`

​     judge_length = ReadFromUsart[DATA_LENGTH_t] + LEN_HEADER + LEN_CMDID + LEN_TAIL;   `//统计一帧数据长度,用于CR16校验`



## 函数

### read_data

```c
//uint8_t *ReadFromUsart 	指向 刚从串口收到的原始数据缓冲区
void Referee_Read_Data(uint8_t *ReadFromUsart )
{	
	uint16_t judge_length;//统计一帧数据长度 	
	int CmdID = 0;//数据命令码解析			 
	memcpy(&REF.FrameHeader,ReadFromUsart,LEN_HEADER);   //储存帧头数据	
	if(ReadFromUsart[SOF_t] == JUDGE_FRAME_HEADER)                   //判断帧头是否为0xa5
	{
		p++;
		HAL_GPIO_WritePin(GPIOG,GPIO_PIN_4,GPIO_PIN_RESET);
		if(Verify_CRC8_Check_Sum( ReadFromUsart, LEN_HEADER ) == TRUE)  //帧头CRC校验
		{
			//读出来低字节 低八位  高八位舍去  在飞镖中可以舍去
			judge_length = ReadFromUsart[DATA_LENGTH_t] + LEN_HEADER + LEN_CMDID + LEN_TAIL;	//统计一帧数据长度,用于CR16校验		
			if(Verify_CRC16_Check_Sum(ReadFromUsart,judge_length) == TRUE)//帧尾CRC16校验
			{
				//小端序			
				CmdID = (ReadFromUsart[6] << 8 | ReadFromUsart[5]);//解析数据命令码,将数据拷贝到相应结构体中(注意拷贝数据的长度)				
				switch(CmdID)
				{
					case 0x0001:
							 memcpy(&REF.GameState, (ReadFromUsart + DATA), LEN_game_state);
							 break;				
					case 0x020A:    //0x0003
							 memcpy(&REF.dartstate, (ReadFromUsart + DATA),   LEN_game_dart_state );
							 break;	
				}					
			}
		}
		//首地址加帧长度,指向CRC16下一字节,用来判断是否为0xA5,用来判断一个数据包是否有多帧数据
		if(*(ReadFromUsart + sizeof(xFrameHeader) + LEN_CMDID + REF.FrameHeader.DataLength + LEN_TAIL) == 0xA5)
		{
			//如果一个数据包出现了多帧数据,则再次读取
			Referee_Read_Data(ReadFromUsart + sizeof(xFrameHeader) + LEN_CMDID + REF.FrameHeader.DataLength + LEN_TAIL);
		}
	}
}
```

### demo

- 0x0001  原始字节流20

偏移:  0    1    2    3    4    5    6    7 ...... 16   17   18   19
     [A5] [0B] [00] [01] [XX] [01] [00] ─── 11字节数据 ─── [??] [??]
      SOF  DataLen  Seq CRC8  CmdID                          CRC16

- 0x020A  原始字节流13

偏移:  0    1    2    3    4    5    6    7    8    9   10   11   12
     [A5] [04] [00] [01] [XX] [0A] [02] [01] [02] [00] [00] [??] [??]
      SOF  DataLen  Seq CRC8  CmdID   ─── 4字节数据 ───  CRC16(2字节)
      ↑          ↑                   ↑                        ↑
      帧头5字节   DataLength=0x0004   数据段                  帧尾2字节





### usart中断

```c
int usart6 = 0;
uint8_t Usart6_Buffer_Rx[ USART6_BUFFER_RX_LEN ] = {0};

void USART6_IRQHandler(void)
{ 
	usart6++; 
  uint8_t res;
	
	REF.flag=TRUE;
	
	/*
	1 个字节 = 1 起始位 + 8 数据位 + 1 停止位 = 10 个比特位
	1 比特时间 = 1/115200 ≈ 8.68 微秒
	1 字节时间 ≈ 86.8 微秒
	*/

    
    //低位第四位是空闲中断   UART_FLAG_IDLE   十进制是16  除了第四位是1其余全部为0  
	if(huart6.Instance->SR & UART_FLAG_IDLE)
	{
		res=res;
		res = USART6->SR ;
		res = USART6->DR ; //残留的字节  因为要等待一个字节的时间才会置空闲标志位触发中断
		//先读 SR、再读 DR 这个特定组合 才会清零空闲标志位
		__HAL_DMA_DISABLE(&hdma_usart6_rx);
		
		HAL_UART_Receive_DMA(&huart6,Usart6_Buffer_Rx,200);
		
		res=USART6_BUFFER_RX_LEN-__HAL_DMA_GET_COUNTER(&hdma_usart6_rx);
		
		Referee_Read_Data(Usart6_Buffer_Rx);
		
		memset(Usart6_Buffer_Rx, 0, USART6_BUFFER_RX_LEN);	// 读完之后内容清零

		//重启 DMA 前的清理工作
		__HAL_DMA_CLEAR_FLAG(&hdma_usart6_rx,DMA_FLAG_TCIF1_5);		  //清 DMA 的"传输完成"中断标志
		__HAL_DMA_SET_COUNTER(&hdma_usart6_rx,USART6_BUFFER_RX_LEN); //把 DMA 的 NDTR 计数器重置为 200。
		__HAL_DMA_ENABLE(&hdma_usart6_rx);
	}
}
```

---

基本流程：

空闲终端触发 判断 清除空闲标志位 失能DMA 而这共用一个缓冲区  读数据 清零缓冲区 重启DMA  一帧一帧读 单缓冲区



SR 寄存器 (32位):

bit31 ──────────── bit10 ── bit9 ── bit8 ── bit7 ── bit6 ── bit5 ── bit4 ── bit3 ── bit2 ── bit1 ── bit0
   			(保留不用)        CTS     LBD     TXE     TC     RXNE    IDLE    ORE     NE     FE     PE



### 校验crc

```c
uint16_t CRC_INIT = 0xffff;
const unsigned char CRC8_INIT_UI = 0xff; 
```

计算crc

```c
unsigned char Get_CRC8_Check_Sum_UI(unsigned char *pchMessage,unsigned int dwLength,unsigned char ucCRC8) 
{ 
unsigned char ucIndex; 
while (dwLength--) 
{ 
ucIndex = ucCRC8^(*pchMessage++); 
ucCRC8 = CRC8_TAB_UI[ucIndex]; 
} 
return(ucCRC8); 
}
```



校验

```c
unsigned int Verify_CRC8_Check_Sum(unsigned char *pchMessage, unsigned int dwLength)
{
		unsigned char ucExpected = 0;
		if ((pchMessage == 0) || (dwLength <= 2)) return 0;
		ucExpected = Get_CRC8_Check_Sum (pchMessage, dwLength-1, CRC8_INIT_UI);
		return ( ucExpected == pchMessage[dwLength-1] );
}
```


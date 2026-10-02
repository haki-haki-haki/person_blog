const t=`# Dart 裁判系统\r
\r
## 外设+中断\r
\r
USART6+DMA2\r
\r
USART6_IRQHandler + DMA2_Stream1_IRQHandler\r
\r
额外 GPIO	PG4 — 收到有效帧头 0xA5 时拉低，调试指示灯\r
\r
\r
\r
## 通信协议\r
\r
### 整体帧格式\r
\r
┌──────┬────────────┬─────┬──────┬──\r
│ SOF  │ DataLength │ Seq │ CRC8 │ CmdID  │    Data      │ CRC16 │\r
│ 1B   │    2B      │ 1B  │  1B  │  2B    │    n 字节    │  2B   │\r
│ 0xA5 │  小端序    │序号  │帧头校 │ 命令码 │  实际数据  │帧尾校 │\r
└──────┴────────────┴─────┴──────┴──\r
\r
\r
\r
### 相关 宏 结构体 变量 枚举\r
\r
#### 定义字节数\r
\r
\`\`\`c\r
#define    LEN_HEADER    5        //帧头长\r
#define    LEN_CMDID     2        //命令码长度\r
#define    LEN_TAIL      2	      //帧尾CRC16\r
\`\`\`\r
\r
#### 通信协议数组的偏移量\r
\r
\`\`\`c\r
//通信协议格式\r
typedef enum  \r
{\r
	FRAME_HEADER         = 0,\r
	CMD_ID               = 5,\r
	DATA                 = 7,\r
}JudgeFrameOffset;\r
\`\`\`\r
\r
#### 帧头\r
\r
\`\`\`c\r
// frame_header 格式\r
typedef enum\r
{\r
	SOF_t          = 0,//起始位\r
	DATA_LENGTH_t  = 1,//帧内数据长度,根据这个来获取数据长度\r
	SEQ_t          = 3,//包序号\r
	CRC8_t         = 4 //CRC8	\r
}	FrameHeaderOffset;\r
\`\`\`\r
\r
\`SEQ_t\`\r
\r
裁判系统每一帧 Seq 自增 1（到 255 后归零），参与校验。\r
\r
- 检测丢帧\r
- 检测重复帧\r
\r
\`\`\`c\r
typedef __packed struct\r
{\r
	uint8_t  SOF;\r
	uint16_t DataLength;\r
	uint8_t  Seq;\r
	uint8_t  CRC8;	\r
}xFrameHeader;\r
\r
\r
memcpy(&REF.FrameHeader, buf, 5);\r
\`\`\`\r
\r
FrameHeaderOffset 枚举 → 命名偏移量\r
xFrameHeader 结构体   → 用 __packed 直接映射到原始字节\r
\r
\r
\r
#### 命令码\r
\r
官方给出\r
\r
\`\`\`c\r
//命令码ID\r
typedef enum\r
{\r
	ID_game_state                          = 0x0001, 			//比赛状态数据\r
	ID_game_result                         = 0x0002,			//比赛结果数据\r
	ID_game_robot_survivors                = 0x0003,			//比赛机器人血量数据\r
	ID_game_missile_state                  = 0x0004, 			//飞镖发射状态\r
	ID_game_buff                           = 0x0005,			//buff\r
	\r
	ID_event_data  				          = 0x0101,			   //场地事件数据 \r
	ID_supply_projectile_action   	       = 0x0102,			//场地补给站动作标识数据\r
	ID_supply_warm                         = 0x0104,			//裁判系统警告数据\r
	ID_missile_shoot_time                  = 0x0105, 			//飞镖发射口倒计时\r
	\r
	ID_game_robot_state    			      = 0x0201,			   //机器人状态数据\r
	ID_power_heat_data    			      = 0x0202,			   //实时功率热量数据\r
	ID_game_robot_pos        		      = 0x0203,			   //机器人位置数据\r
	ID_buff_musk					     = 0x0204,			 //机器人增益数据\r
	ID_aerial_robot_energy			      = 0x0205,			  //空中机器人支援时间数据\r
	ID_robot_hurt					     = 0x0206,			 //伤害状态数据\r
	ID_shoot_data					     = 0x0207,			 //实时射击数据\r
	ID_bullet_remaining                    = 0x0208,		   //允许发射数\r
	ID_rfid_status						 = 0x0209,			 //机器人RFID状态，1Hz\r
	\r
  \r
	ID_robot_interactive_header_data	   = 0x0301,		    //机器人交互数据，——发送方触发——发送 10Hz\r
	ID_controller_interactive_header_data  = 0x0302,			//自定义控制器交互数据接口，通过——客户端触发——发送 30Hz\r
	ID_map_interactive_header_data         = 0x0303,			//客户端小地图交互数据，——触发发送——\r
	ID_keyboard_information                = 0x0304,			//键盘、鼠标信息，通过——图传串口——发送\r
	ID_map_robot_data                      = 0x0305,             //接收地图机器人数据\r
	ID_custom_info						 = 0X0308			  //发送自定义消息\r
	\r
}CmdID;\r
\`\`\`\r
\r
#### 占据字节\r
\r
飞镖只需要0x0001 和 0x0002 两个命令码 因此此枚举的ext只列举了两个\r
\r
\`\`\`c\r
//数据段长度\r
typedef enum\r
{\r
	/* Std 静态固定不变 */  \r
	LEN_FRAME_HEAD 	                  = 5,	// 帧头长度\r
	LEN_CMD_ID 		                  = 2,	// 命令码长度\r
	LEN_FRAME_TAIL 	                  = 2,	// 帧尾CRC16\r
	/* Ext 动态 根据命令码的不同数据data长度不同*/  \r
	LEN_game_state       			= 11,	//0x0001\r
    LEN_game_dart_state     		 =  4,	//0x0002\r
\r
}JudgeDataLength;   \r
\`\`\`\r
\r
#### 数据data段\r
\r
##### CmdID=0x0001\r
\r
game_status_t\r
\r
11字节\r
\r
\`\`\`c\r
/* ID: 0x0001  Byte:  11    比赛状态数据 */\r
typedef __packed struct \r
{ \r
	//位域\r
	uint8_t game_type : 4;		// 只用 1 字节中的低 4 位\r
	uint8_t game_progress : 4;  // 只用 1 字节中的高 4 位\r
	uint16_t stage_remain_time; //剩余时间  2字节\r
  uint64_t SyncTimeStamp;     	//同步时间戳  8字节\r
}game_status_t; \r
\`\`\`\r
\r
作用 判断发射\r
\r
\`\`\`c\r
memcpy(&REF.GameState, buf + 7, 11);\r
REF.GameState.game_type     = 比赛类型\r
REF.GameState.game_progress = 比赛阶段(用来触发自动发射)\r
\`\`\`\r
\r
##### CmdID=0x020A\r
\r
dart_client_cmd_t\r
\r
4字节\r
\r
\`\`\`c\r
typedef __packed struct {\r
    uint8_t dart_launch_opening_status;  // 发射口状态 发射舱门开关\r
    uint8_t reserved;                    // 保留  协议必须的保留位置 占位作用\r
    uint16_t target_change_time;         // 目标变化时间  目标（前哨站/基地）位置在上次变化后已经过了多少毫秒  没有使用\r
    uint16_t latest_launch_cmd_time;     // 发射命令时间  最新发射命令时间\r
} dart_client_cmd_t;                     // 总共: 1+1+2+2 = 6 字节\r
                                         // 但 LEN_game_dart_state=4！\r
\`\`\`\r
\r
buf[7]  buf[8]  buf[9]  buf[10]  buf[11]  buf[12]  分别对应\r
\r
 [0] ← buf[7]   dart_launch_opening_status      \r
    [1] ← buf[8]   reserved                     \r
    [2] ← buf[9]   target_change_time  低字节   \r
    [3] ← buf[10]  target_change_time  高字节  \r
\r
\r
\r
#### Referee_info_t\r
\r
解析后存放容器\r
\r
解析后的缓存区，是各种帧数据的"目的地"\r
\r
\`\`\`c\r
typedef struct{\r
	xFrameHeader		  FrameHeader;				// 帧头信息\r
	game_status_t          GameState;				//buf[7..17] 数据段\r
	dart_client_cmd_t      dartstate;				//buf[7..10] 数据段\r
	CmdID				  cmdid;                    //命令码\r
	bool flag;\r
    \r
} Referee_info_t;\r
\`\`\`\r
\r
\r
\r
### 小端序\r
\r
<!--低八位在前 高八位在后-->\r
\r
如0x0001  buf[2]  buf[0] 对应0x01  buf[1] 对应0x00\r
\r
移位操作 uint16_4 num = buf[1] >> 8 | buf[0] ;\r
\r
\r
\r
2026VGD飞镖裁判系统中有		\r
\r
​	\`//读出来低字节 低八位  高八位舍去  在飞镖中可以舍去\`\r
\r
​     judge_length = ReadFromUsart[DATA_LENGTH_t] + LEN_HEADER + LEN_CMDID + LEN_TAIL;   \`//统计一帧数据长度,用于CR16校验\`\r
\r
\r
\r
## 函数\r
\r
### read_data\r
\r
\`\`\`c\r
//uint8_t *ReadFromUsart 	指向 刚从串口收到的原始数据缓冲区\r
void Referee_Read_Data(uint8_t *ReadFromUsart )\r
{	\r
	uint16_t judge_length;//统计一帧数据长度 	\r
	int CmdID = 0;//数据命令码解析			 \r
	memcpy(&REF.FrameHeader,ReadFromUsart,LEN_HEADER);   //储存帧头数据	\r
	if(ReadFromUsart[SOF_t] == JUDGE_FRAME_HEADER)                   //判断帧头是否为0xa5\r
	{\r
		p++;\r
		HAL_GPIO_WritePin(GPIOG,GPIO_PIN_4,GPIO_PIN_RESET);\r
		if(Verify_CRC8_Check_Sum( ReadFromUsart, LEN_HEADER ) == TRUE)  //帧头CRC校验\r
		{\r
			//读出来低字节 低八位  高八位舍去  在飞镖中可以舍去\r
			judge_length = ReadFromUsart[DATA_LENGTH_t] + LEN_HEADER + LEN_CMDID + LEN_TAIL;	//统计一帧数据长度,用于CR16校验		\r
			if(Verify_CRC16_Check_Sum(ReadFromUsart,judge_length) == TRUE)//帧尾CRC16校验\r
			{\r
				//小端序			\r
				CmdID = (ReadFromUsart[6] << 8 | ReadFromUsart[5]);//解析数据命令码,将数据拷贝到相应结构体中(注意拷贝数据的长度)				\r
				switch(CmdID)\r
				{\r
					case 0x0001:\r
							 memcpy(&REF.GameState, (ReadFromUsart + DATA), LEN_game_state);\r
							 break;				\r
					case 0x020A:    //0x0003\r
							 memcpy(&REF.dartstate, (ReadFromUsart + DATA),   LEN_game_dart_state );\r
							 break;	\r
				}					\r
			}\r
		}\r
		//首地址加帧长度,指向CRC16下一字节,用来判断是否为0xA5,用来判断一个数据包是否有多帧数据\r
		if(*(ReadFromUsart + sizeof(xFrameHeader) + LEN_CMDID + REF.FrameHeader.DataLength + LEN_TAIL) == 0xA5)\r
		{\r
			//如果一个数据包出现了多帧数据,则再次读取\r
			Referee_Read_Data(ReadFromUsart + sizeof(xFrameHeader) + LEN_CMDID + REF.FrameHeader.DataLength + LEN_TAIL);\r
		}\r
	}\r
}\r
\`\`\`\r
\r
### demo\r
\r
- 0x0001  原始字节流20\r
\r
偏移:  0    1    2    3    4    5    6    7 ...... 16   17   18   19\r
     [A5] [0B] [00] [01] [XX] [01] [00] ─── 11字节数据 ─── [??] [??]\r
      SOF  DataLen  Seq CRC8  CmdID                          CRC16\r
\r
- 0x020A  原始字节流13\r
\r
偏移:  0    1    2    3    4    5    6    7    8    9   10   11   12\r
     [A5] [04] [00] [01] [XX] [0A] [02] [01] [02] [00] [00] [??] [??]\r
      SOF  DataLen  Seq CRC8  CmdID   ─── 4字节数据 ───  CRC16(2字节)\r
      ↑          ↑                   ↑                        ↑\r
      帧头5字节   DataLength=0x0004   数据段                  帧尾2字节\r
\r
\r
\r
\r
\r
### usart中断\r
\r
\`\`\`c\r
int usart6 = 0;\r
uint8_t Usart6_Buffer_Rx[ USART6_BUFFER_RX_LEN ] = {0};\r
\r
void USART6_IRQHandler(void)\r
{ \r
	usart6++; \r
  uint8_t res;\r
	\r
	REF.flag=TRUE;\r
	\r
	/*\r
	1 个字节 = 1 起始位 + 8 数据位 + 1 停止位 = 10 个比特位\r
	1 比特时间 = 1/115200 ≈ 8.68 微秒\r
	1 字节时间 ≈ 86.8 微秒\r
	*/\r
\r
    \r
    //低位第四位是空闲中断   UART_FLAG_IDLE   十进制是16  除了第四位是1其余全部为0  \r
	if(huart6.Instance->SR & UART_FLAG_IDLE)\r
	{\r
		res=res;\r
		res = USART6->SR ;\r
		res = USART6->DR ; //残留的字节  因为要等待一个字节的时间才会置空闲标志位触发中断\r
		//先读 SR、再读 DR 这个特定组合 才会清零空闲标志位\r
		__HAL_DMA_DISABLE(&hdma_usart6_rx);\r
		\r
		HAL_UART_Receive_DMA(&huart6,Usart6_Buffer_Rx,200);\r
		\r
		res=USART6_BUFFER_RX_LEN-__HAL_DMA_GET_COUNTER(&hdma_usart6_rx);\r
		\r
		Referee_Read_Data(Usart6_Buffer_Rx);\r
		\r
		memset(Usart6_Buffer_Rx, 0, USART6_BUFFER_RX_LEN);	// 读完之后内容清零\r
\r
		//重启 DMA 前的清理工作\r
		__HAL_DMA_CLEAR_FLAG(&hdma_usart6_rx,DMA_FLAG_TCIF1_5);		  //清 DMA 的"传输完成"中断标志\r
		__HAL_DMA_SET_COUNTER(&hdma_usart6_rx,USART6_BUFFER_RX_LEN); //把 DMA 的 NDTR 计数器重置为 200。\r
		__HAL_DMA_ENABLE(&hdma_usart6_rx);\r
	}\r
}\r
\`\`\`\r
\r
---\r
\r
基本流程：\r
\r
空闲终端触发 判断 清除空闲标志位 失能DMA 而这共用一个缓冲区  读数据 清零缓冲区 重启DMA  一帧一帧读 单缓冲区\r
\r
\r
\r
SR 寄存器 (32位):\r
\r
bit31 ──────────── bit10 ── bit9 ── bit8 ── bit7 ── bit6 ── bit5 ── bit4 ── bit3 ── bit2 ── bit1 ── bit0\r
   			(保留不用)        CTS     LBD     TXE     TC     RXNE    IDLE    ORE     NE     FE     PE\r
\r
\r
\r
### 校验crc\r
\r
\`\`\`c\r
uint16_t CRC_INIT = 0xffff;\r
const unsigned char CRC8_INIT_UI = 0xff; \r
\`\`\`\r
\r
计算crc\r
\r
\`\`\`c\r
unsigned char Get_CRC8_Check_Sum_UI(unsigned char *pchMessage,unsigned int dwLength,unsigned char ucCRC8) \r
{ \r
unsigned char ucIndex; \r
while (dwLength--) \r
{ \r
ucIndex = ucCRC8^(*pchMessage++); \r
ucCRC8 = CRC8_TAB_UI[ucIndex]; \r
} \r
return(ucCRC8); \r
}\r
\`\`\`\r
\r
\r
\r
校验\r
\r
\`\`\`c\r
unsigned int Verify_CRC8_Check_Sum(unsigned char *pchMessage, unsigned int dwLength)\r
{\r
		unsigned char ucExpected = 0;\r
		if ((pchMessage == 0) || (dwLength <= 2)) return 0;\r
		ucExpected = Get_CRC8_Check_Sum (pchMessage, dwLength-1, CRC8_INIT_UI);\r
		return ( ucExpected == pchMessage[dwLength-1] );\r
}\r
\`\`\`\r
\r
`;export{t as default};

const r=`# DM 电机代码移植说明\r
\r
## 一、移植做了什么\r
\r
从一个裸机 DM 电机例程中，提取了 5 组核心代码（CAN底层、电机驱动、电机控制、PID），合并到你的 FreeRTOS H7 模板工程中。\r
\r
\`\`\`\r
源项目（裸机）                          目标项目（FreeRTOS 模板）\r
─────────────────────────────────      ─────────────────────────────────\r
User/bsp_fdcan.h/c      ──合并──▶      BSP/Inc/bsp_can.h  / BSP/Src/bsp_can.c\r
User/dm_motor_drv.h/c   ──合并──▶      Components/Device/Inc/Motor.h / Src/Motor.c\r
User/dm_motor_ctrl.h/c  ──新建──▶      Components/Device/Inc/dm_motor_ctrl.h / Src/dm_motor_ctrl.c\r
User/pid.h/c            ──合并──▶      Components/Controller/Inc/PID.h / Src/PID.c\r
User/delay.h/c          ──丢弃──▶      （FreeRTOS 用 osDelay() 替代）\r
\`\`\`\r
\r
---\r
\r
## 二、每个文件的作用\r
\r
### 1. bsp_can.h / bsp_can.c — CAN/FDCAN 底层驱动\r
\r
**作用**：\r
- 定义了 CAN 通信的模式（传统CAN / CAN-FD with BRS）和波特率（125K~5M）\r
- \`bsp_can_init()\` — 初始化 CAN 过滤器和水位线中断，接收 DM 电机数据\r
- \`bsp_fdcan_set_baud()\` — **运行时动态切换波特率**（DM 电机支持在线改波特率）\r
- \`fdcanx_send_data()\` — 封装 HAL 库发送，支持 8/12/16/20/24/32/48/64 字节数据长度\r
- \`fdcanx_receive()\` — 封装 HAL 库接收，自动解算数据长度\r
- \`HAL_FDCAN_RxFifo0WatermarkCallback()\` — 接收到数据后的中断回调\r
- \`HAL_FDCAN_ErrorStatusCallback()\` — CAN 总线错误恢复（Bus-Off 自动恢复）\r
\r
**为什么需要**：HAL 库的 CAN 操作比较底层，这套封装简化了"发数据帧"和"收数据帧"的操作，同时支持动态改波特率。\r
\r
---\r
\r
### 2. Motor.h / Motor.c — 电机驱动层（协议帧编解码）\r
\r
**作用**：\r
- 定义了 DM 电机的 4 种控制模式：\r
\r
| 模式 | ID偏移 | 发送内容 | 用途 |\r
|------|--------|---------|------|\r
| MIT 模式 | +0x000 | 位置 + 速度 + KP + KD + 扭矩 | 力矩/阻抗控制，关节常用 |\r
| POS 模式 | +0x100 | 位置(float) + 速度(float) | 位置控制 |\r
| SPD 模式 | +0x200 | 速度(float) | 速度控制 |\r
| PSI 模式 | +0x300 | 位置(float) + 速度(uint16) + 电流(uint16) | 混控模式 |\r
\r
- 定义了 DM 电机全部可读写寄存器（\`dm_rid_e\` 枚举，共 45 个）\r
- 核心数据结构：\r
  - \`dm_motor_t\` — 单个电机的完整信息（ID、反馈数据、控制指令、寄存器参数）\r
  - \`dm_esc_inf_t\` — 电调寄存器参数（UV值、扭矩系数、限幅、PID参数等）\r
  - \`dm_motor_ctrl_t\` — 控制指令（模式、位置/速度/扭矩/电流设定值）\r
- 关键函数：\r
  - \`dm_motor_enable()\` / \`dm_motor_disable()\` — 电机使能/禁用（发 0xFC/0xFD 指令）\r
  - \`dm_motor_ctrl_send()\` — 根据当前模式发送对应控制帧\r
  - \`dm_motor_fbdata()\` — 解析电机返回的反馈数据（位置/速度/扭矩/温度）\r
  - \`read_motor_data()\` — 读电机寄存器（协议帧：\`[ID_L, ID_H, 0x33, RID]\`）\r
  - \`write_motor_data()\` — 写电机寄存器（协议帧：\`[ID_L, ID_H, 0x55, RID, D0~D3]\`）\r
  - \`save_motor_data()\` — 保存写入的参数到电机 Flash\r
  - \`uint_to_float()\` / \`float_to_uint()\` — 定点数与浮点数互转\r
\r
**为什么需要**：DM 电机的通信协议比较复杂（多种模式、整型/浮点混用、寄存器操作），这套代码把协议编解码全部封装好了，上层只需调用 \`dm_motor_ctrl_send()\` 就能发出正确的 CAN 帧。\r
\r
---\r
\r
### 3. dm_motor_ctrl.h / dm_motor_ctrl.c — 电机控制层\r
\r
**作用**：\r
- \`dm_motor_init()\` — 初始化所有电机结构体（清零），配置 Motor1 默认参数（ID=0x01, MIT模式, PMAX=12.5, VMAX=30, TMAX=10）\r
- \`read_all_motor_data()\` — **状态机驱动**的寄存器参数读取，每次调用读一个寄存器，读完自动推进到下一个。共 45 个寄存器，轮询一遍获取电机全部配置\r
- \`receive_motor_data()\` — 接收电机返回的寄存器数据，存入 \`dm_motor_t.tmp\` 结构体\r
- \`fdcan2_rx_callback()\` — **弱回调重写**，CAN2 收到数据后根据 CAN ID 分发给对应电机\r
\r
**为什么需要**：DM 电机启动后需要读取它的当前参数配置（PMax、VMax、TMax 等），这些参数决定后续定点数转换的范围。状态机方式可以非阻塞地逐个读取。\r
\r
---\r
\r
### 4. PID.h / PID.c — PID 控制器\r
\r
**作用**：\r
- 在原有复杂 PID 基础上，追加了一套**简化版 PID**（\`pid_para_t\` 结构 + 6 个函数）：\r
\r
| 函数 | 作用 |\r
|------|------|\r
| \`pid_para_init()\` | 清零 PID 所有变量 |\r
| \`pid_limit_init()\` | 设置积分限幅和输出限幅 |\r
| \`pid_clear()\` | 清除历史误差和积分项 |\r
| \`pid_reset()\` | 运行时修改 KP/KI/KD |\r
| \`parallel_pid_ctrl()\` | **并联式 PID**（P + I + D 并行走） |\r
| \`serial_pid_ctrl()\` | **串级式 PID**（P 算完再走 I，常用于速度环） |\r
\r
**并联 vs 串级 区别**：\r
- 并联：\`Output = KP×Err + KI×∫Err + KD×dErr\`，三个支路独立\r
- 串级：\`Output = KP×Err + KI×∫(KP×Err)\`，积分项作用在 P 输出上，响应更平滑\r
\r
**为什么需要**：原模板的 PID 功能强大但复杂（函数指针、错误检测、LPF滤波），这套简化版适合快速上手调试 DM 电机。\r
\r
---\r
\r
## 三、移植常见坑（本次踩过的）\r
\r
### 坑 1：\`static\` 声明不一致\r
\r
**现象**：\r
\`\`\`\r
error: static declaration of 'uint_to_float' follows non-static declaration\r
\`\`\`\r
\r
**原因**：C 语言中，一个函数的**前置声明**和**实际定义**必须 \`static\` 属性一致。我把实际定义处的 \`static\` 去掉了，但忘了去掉前面声明处的 \`static\`。\r
\r
**教训**：修改函数可见性时，**声明和定义要一起改**。\r
\r
---\r
\r
### 坑 2：ARM Compiler V5 → V6 编译器不兼容\r
\r
**现象**：\r
\`\`\`\r
error: use of undeclared identifier 'SystemCoreClock'\r
Error: L6218E: Undefined symbol __get_IPSR\r
\`\`\`\r
\r
**原因**：ARM Compiler V5（armcc）和 V6（armclang）是完全不同的编译器，预定义宏不同：\r
- V5 定义 \`__CC_ARM\`\r
- V6 定义 \`__clang__\`\r
- 但 FreeRTOS 和 CMSIS-RTOS 的某些旧版本代码只判断了 \`__CC_ARM\`，导致 V6 下跳过关键代码。\r
\r
**教训**：\r
1. 换编译器版本时，检查所有 \`#if defined(__CC_ARM)\` 的地方，考虑是否要加 \`|| defined(__clang__)\`\r
2. \`FreeRTOSConfig.h\` 中 \`SystemCoreClock\` 的 \`extern\` 要确保对所有编译器都生效\r
3. \`cmsis_os.c\` 的编译器分支要覆盖 ARMCLANG，include 正确的 CMSIS 头文件\r
\r
---\r
\r
### 坑 3：HAL 弱回调（Weak Callback）不能重复定义\r
\r
**现象**：链接时报 \`multiple definition\`\r
\r
**原因**：STM32 HAL 库的 \`HAL_FDCAN_RxFifo0Callback()\` 等函数用 \`__weak\` 修饰，用户只能定义**一次**来重写。原模板的 \`bsp_can.c\` 和 DM 例程的 \`bsp_fdcan.c\` 都会定义这些回调。\r
\r
**本次处理**：\r
- 原模板的 \`HAL_FDCAN_RxFifo0Callback\`（FIFO0 新消息）已存在，不动它\r
- DM 的接收改用 \`HAL_FDCAN_RxFifo0WatermarkCallback\`（水位线中断），是不同的 HAL 回调，不会冲突\r
- \`HAL_FDCAN_ErrorStatusCallback\` 之前没有定义过，直接追加\r
\r
**教训**：合并两个 HAL 项目时，先 grep 所有 \`HAL_xxxCallback\`，确认没有重复定义。\r
\r
---\r
\r
### 坑 4：FreeRTOS port 文件和芯片内核不匹配\r
\r
**现象**：工程 FreeRTOS 用的是 \`ARM_CM4F/port.c\`（Cortex-M4），但芯片是 H723（Cortex-M7）。\r
\r
**原因**：可能是 CubeMX 自动生成时没选对核心，或者从 F4 工程迁移时没改过来。\r
\r
**本次状态**：编译没报错（因为没触发到差异代码），但**运行时可能有隐患**（M4 和 M7 的 FPU 寄存器保存逻辑不同）。\r
\r
**建议**：\r
1. Keil 工程中移除 \`ARM_CM4F/port.c\`\r
2. 添加 \`ARM_CM7/r0p1/port.c\`（FreeRTOS 源码中有）\r
3. 同时换掉 \`portmacro.h\`\r
\r
---\r
\r
### 坑 5：CAN 口绑定问题\r
\r
**说明**：移植时我把 DM 电机通信硬编码绑定到了 \`hfdcan2\`（因为原模板就是用 CAN2 做 FD-CAN 电机通信）。\r
\r
- 如果你的硬件 CAN2 接了 DM 电机 → 不用改\r
- 如果接了 CAN1 → 全局搜索替换 \`hfdcan2\` 为 \`hfdcan1\`\r
- 如果接了 CAN3 → 替换为 \`hfdcan3\`\r
\r
**涉及的文件**：\r
- \`BSP/Src/bsp_can.c\`（\`can_filter_init\` 里 \`&hfdcan2\`）\r
- \`Components/Device/Src/Motor.c\`（\`read_motor_data\` 等函数里 \`&hfdcan2\`）\r
- \`Components/Device/Src/dm_motor_ctrl.c\`（\`fdcan2_rx_callback\` 里 \`&hfdcan2\`）\r
\r
---\r
\r
## 四、初始化调用流程\r
\r
\`\`\`\r
main()\r
  ├─ HAL_Init()\r
  ├─ SystemClock_Config()\r
  ├─ MX_FDCAN1_Init()     ← HAL 层初始化 CAN 外设时钟和引脚\r
  ├─ MX_FDCAN2_Init()     ← 同上（DM 电机用这个）\r
  ├─ MX_FDCAN3_Init()\r
  ├─ MCU_Init()\r
  ├─ bsp_can_init()       ← [新增] 配置滤波器 + 启动 CAN2 + 使能水位线中断\r
  ├─ dm_motor_init()      ← [新增] 清零电机结构体 + 配置 Motor1 默认参数\r
  ├─ MX_FREERTOS_Init()\r
  └─ osKernelStart()\r
       ├─ CAN_Task         ← 已有的 CAN 发送任务（可在此调用 dm_motor_ctrl_send）\r
       └─ Control_Task     ← 已有的控制任务（可在此做 PID 计算）\r
\`\`\`\r
\r
---\r
\r
## 五、快速上手 DM 电机控制\r
\r
\`\`\`c\r
// 1. 使能 Motor1（MIT 模式）\r
dm_motor_enable(&hfdcan2, &dm_motor[DM_Motor1]);\r
\r
// 2. 发送 MIT 控制指令（位置=0, 速度=0, KP=100, KD=5, 扭矩=0）\r
dm_motor[DM_Motor1].ctrl.pos_set = 0.0f;\r
dm_motor[DM_Motor1].ctrl.vel_set = 0.0f;\r
dm_motor[DM_Motor1].ctrl.kp_set  = 100.0f;\r
dm_motor[DM_Motor1].ctrl.kd_set  = 5.0f;\r
dm_motor[DM_Motor1].ctrl.tor_set = 0.0f;\r
dm_motor_ctrl_send(&hfdcan2, &dm_motor[DM_Motor1]);\r
\r
// 3. 读取反馈数据（在 fdcan2_rx_callback 中自动解析）\r
float pos = dm_motor[DM_Motor1].para.pos;  // 当前位置\r
float vel = dm_motor[DM_Motor1].para.vel;  // 当前速度\r
float tor = dm_motor[DM_Motor1].para.tor;  // 当前扭矩\r
\r
// 4. 读取电机参数（状态机方式，一次读一个寄存器）\r
read_all_motor_data(&dm_motor[DM_Motor1]);\r
// 收到回复后 receive_motor_data() 自动存入 .tmp 结构体\r
\r
// 5. 禁用电机\r
dm_motor_disable(&hfdcan2, &dm_motor[DM_Motor1]);\r
\`\`\`\r
`;export{r as default};

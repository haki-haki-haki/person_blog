const r=`# OpenOCD \`stlink.cfg\` 配置详解\r
\r
> 本文档基于你的项目 \`light_test\`，OpenOCD 版本 0.12.0。\r
\r
---\r
\r
## 一、你的 stlink.cfg 逐行解释\r
\r
文件路径：\`D:\\vgd\\light_test\\stlink.cfg\`\r
\r
\`\`\`tcl\r
# 1. 加载ST-Link硬件接口\r
source [find interface/stlink.cfg]\r
\`\`\`\r
\r
这行告诉 OpenOCD："我要用 ST-Link 调试器"。\`source\` 命令会加载 OpenOCD 安装目录下的 \`scripts/interface/stlink.cfg\`，里面定义了 ST-Link 的 USB VID/PID、驱动类型等。\r
\r
\`\`\`tcl\r
# 2. 指定适配器驱动\r
adapter driver st-link\r
\`\`\`\r
\r
显式指定驱动程序。OpenOCD 支持两种 ST-Link 驱动方式：\r
- \`adapter driver hla\` — 高层抽象层驱动（High-Level Adapter，老版本默认）\r
- \`adapter driver st-link\` — 原生 st-link 驱动（推荐，更稳定）\r
\r
\`\`\`tcl\r
# 3. 通信速度\r
adapter speed 4000\r
\`\`\`\r
\r
SWD/JTAG 通信时钟频率，单位 **kHz**。\`4000\` = 4MHz。\r
\r
| 速度 | 适用场景 |\r
|------|---------|\r
| 1000 | 杜邦线连接，最稳定 |\r
| 4000 | 稳定性和速度的平衡 |\r
| 8000 | 短排线/PCB 连接，高速烧录 |\r
| 12000+ | 仅 ST-Link V3 支持 |\r
\r
\`\`\`tcl\r
# 4. 加载STM32F1芯片配置\r
source [find target/stm32f1x.cfg]\r
\`\`\`\r
\r
告诉 OpenOCD 目标芯片是 STM32F1 系列。这里定义了 Flash 地址、RAM 地址、内核类型等。\r
\r
---\r
\r
## 二、换调试器\r
\r
### 常用调试器对照表\r
\r
| 调试器 | 替换第1行 | 替换第2行 |\r
|--------|----------|----------|\r
| **ST-Link V2**（你当前） | \`source [find interface/stlink.cfg]\` | \`adapter driver st-link\` |\r
| **ST-Link V2-1**（Nucleo板载） | \`source [find interface/stlink-v2-1.cfg]\` | \`adapter driver st-link\` |\r
| **ST-Link V3** | \`source [find interface/stlink.cfg]\` | \`adapter driver st-link\` |\r
| **DAP-Link / CMSIS-DAP** | \`source [find interface/cmsis-dap.cfg]\` | \`adapter driver cmsis-dap\` |\r
| **J-Link** | \`source [find interface/jlink.cfg]\` | \`adapter driver jlink\` |\r
\r
### DAP-Link 完整示例\r
\r
\`\`\`tcl\r
source [find interface/cmsis-dap.cfg]\r
adapter driver cmsis-dap\r
adapter speed 4000\r
source [find target/stm32f1x.cfg]\r
\`\`\`\r
\r
### J-Link 完整示例\r
\r
\`\`\`tcl\r
source [find interface/jlink.cfg]\r
adapter driver jlink\r
adapter speed 4000\r
source [find target/stm32f1x.cfg]\r
\`\`\`\r
\r
### 指定调试器序列号（多个调试器同时插时）\r
\r
\`\`\`tcl\r
# ST-Link\r
adapter serial "xxxxxxxxxxxx"\r
\r
# DAP-Link\r
cmsis_dap_serial "xxxxxxxxxxxx"\r
\r
# J-Link\r
adapter serial "xxxxxxxxxxxx"\r
\`\`\`\r
\r
---\r
\r
## 三、换芯片\r
\r
### STM32 系列对照表\r
\r
| 芯片系列 | 替换第4行 |\r
|----------|----------|\r
| STM32F0 | \`source [find target/stm32f0x.cfg]\` |\r
| **STM32F1**（你当前） | \`source [find target/stm32f1x.cfg]\` |\r
| STM32F2 | \`source [find target/stm32f2x.cfg]\` |\r
| STM32F3 | \`source [find target/stm32f3x.cfg]\` |\r
| STM32F4 | \`source [find target/stm32f4x.cfg]\` |\r
| STM32F7 | \`source [find target/stm32f7x.cfg]\` |\r
| STM32G0 | \`source [find target/stm32g0x.cfg]\` |\r
| STM32G4 | \`source [find target/stm32g4x.cfg]\` |\r
| STM32H7 | \`source [find target/stm32h7x.cfg]\` |\r
| STM32H7 双Bank | \`source [find target/stm32h7x_dual_bank.cfg]\` |\r
| STM32L0 | \`source [find target/stm32l0.cfg]\` |\r
| STM32L1 | \`source [find target/stm32l1.cfg]\` |\r
| STM32L4 | \`source [find target/stm32l4x.cfg]\` |\r
| STM32L5 | \`source [find target/stm32l5x.cfg]\` |\r
| STM32WB | \`source [find target/stm32wbx.cfg]\` |\r
| STM32WL | \`source [find target/stm32wlx.cfg]\` |\r
| STM32U5 | \`source [find target/stm32u5x.cfg]\` |\r
\r
### 非 STM32 芯片\r
\r
| 芯片 | 第4行 |\r
|------|------|\r
| nRF51 | \`source [find target/nrf51.cfg]\` |\r
| nRF52 | \`source [find target/nrf52.cfg]\` |\r
| ESP32 | \`source [find target/esp32.cfg]\` |\r
| RP2040 (树莓派Pico) | \`source [find target/rp2040.cfg]\` |\r
| GD32VF103 (RISC-V) | \`source [find target/gd32vf103.cfg]\` |\r
| i.MX RT 系列 | \`source [find target/imxrt.cfg]\` |\r
| Kinetis (K40) | \`source [find target/k40.cfg]\` |\r
\r
---\r
\r
## 四、常用可配置参数\r
\r
你可以在 \`stlink.cfg\` 中**在任何 \`source\` 语句之前**设置这些变量来覆盖默认值：\r
\r
\`\`\`tcl\r
# ====== 芯片识别 ======\r
# 指定芯片名称（默认为 stm32f1x）\r
set CHIPNAME stm32f103c8\r
\r
# 指定 CPU TAP ID（调试接口 ID），通常不需要手动设\r
set CPUTAPID 0x1ba01477\r
\r
# ====== 内存大小 ======\r
# 工作区大小（RAM 中用于 Flash 烧录的缓冲区，默认 0x1000 = 4KB）\r
set WORKAREASIZE 0x1000\r
\r
# Flash 大小（0 = 自动检测）\r
set FLASH_SIZE 0x20000    ;# 128KB\r
\r
# ====== 通信速度 ======\r
adapter speed 4000        ;# 你的当前设置\r
adapter speed 1000        ;# 降低速度提高稳定性\r
\r
# ====== 复位配置 ======\r
# 复位后的延迟（ms）\r
adapter srst delay 100\r
\r
# 复位类型\r
reset_config srst_nogate  ;# 你的当前设置（SRST 不门控）\r
\r
# 其它复位选项：\r
# reset_config none               # 不连复位线\r
# reset_config srst_only          # 只连 SRST\r
# reset_config trst_and_srst      # JTAG 全部连接时\r
\`\`\`\r
\r
---\r
\r
## 五、特殊命令（写在 stlink.cfg 里或命令行传参）\r
\r
### 烧录后运行\r
\r
\`\`\`tcl\r
# 添加到最后\r
init\r
reset init\r
\`\`\`\r
\r
### 复位模式\r
\r
| 命令 | 效果 |\r
|------|------|\r
| \`reset_config srst_nogate\` | 复位时不门控 JTAG（默认，推荐） |\r
| \`reset_config srst_only\` | 只用 SRST 复位 |\r
| \`reset_config none\` | 不复位 |\r
| \`cortex_m reset_config sysresetreq\` | 用内核的 SYSRESETREQ 软件复位 |\r
\r
### 传输协议选择\r
\r
\`\`\`tcl\r
transport select swd     ;# 用 SWD（2线，推荐，速度快）\r
transport select jtag    ;# 用 JTAG（5线，老式接口）\r
\`\`\`\r
\r
### TPIU 跟踪（高级调试）\r
\r
stm32f1x.cfg 内置了 TPIU（Trace Port Interface Unit）配置，可以配合逻辑分析仪获取指令跟踪信息，一般用不到。\r
\r
---\r
\r
## 六、完整配置示例\r
\r
### 示例1：ST-Link V2 + STM32F103C8T6（你当前）\r
\r
\`\`\`tcl\r
source [find interface/stlink.cfg]\r
adapter driver st-link\r
adapter speed 4000\r
source [find target/stm32f1x.cfg]\r
transport select swd\r
\`\`\`\r
\r
### 示例2：DAP-Link + STM32F407VGT6\r
\r
\`\`\`tcl\r
source [find interface/cmsis-dap.cfg]\r
adapter driver cmsis-dap\r
adapter speed 5000\r
source [find target/stm32f4x.cfg]\r
transport select swd\r
\`\`\`\r
\r
### 示例3：J-Link + nRF52832\r
\r
\`\`\`tcl\r
source [find interface/jlink.cfg]\r
adapter driver jlink\r
adapter speed 4000\r
source [find target/nrf52.cfg]\r
transport select swd\r
\`\`\`\r
\r
### 示例4：ST-Link V3 + 高速烧录\r
\r
\`\`\`tcl\r
source [find interface/stlink.cfg]\r
adapter driver st-link\r
adapter speed 12000\r
source [find target/stm32f1x.cfg]\r
transport select swd\r
\`\`\`\r
\r
### 示例5：多 ST-Link 时指定序列号\r
\r
\`\`\`tcl\r
source [find interface/stlink.cfg]\r
adapter driver st-link\r
adapter serial "xxxxxxxxxxxx"\r
adapter speed 4000\r
source [find target/stm32f1x.cfg]\r
\`\`\`\r
\r
---\r
\r
## 七、你拥有的可用调试器配置文件\r
\r
你的 OpenOCD 安装里 \`scripts/interface/\` 目录下包含：\r
\r
| 文件 | 调试器 |\r
|------|--------|\r
| \`stlink.cfg\` | ST-Link V1/V2/V2-1/V3（通用） |\r
| \`stlink-v1.cfg\` | ST-Link V1 专用 |\r
| \`stlink-v2.cfg\` | ST-Link V2 专用 |\r
| \`stlink-v2-1.cfg\` | ST-Link V2-1 专用（Nucleo 板载） |\r
| \`stlink-dap.cfg\` | ST-Link 的 CMSIS-DAP 兼容模式 |\r
| \`cmsis-dap.cfg\` | 通用 DAP-Link |\r
| \`jlink.cfg\` | J-Link |\r
| \`ftdi/\` | FTDI 系列（FT2232、FT232H 等） |\r
| \`picoprobe.cfg\` | 树莓派 Pico 做的调试器 |\r
| \`ulink.cfg\` | Keil ULINK 系列 |\r
\r
---\r
\r
## 八、常见问题\r
\r
### Q: 烧录失败提示 "Error: init mode failed"\r
\r
降低速度试试：\`adapter speed 1000\`\r
\r
### Q: 换了芯片后还能用原来的 stlink.cfg 吗？\r
\r
不能用。必须把 \`source [find target/stm32f1x.cfg]\` 改成对应芯片的配置文件。\r
\r
### Q: Flash 识别的大小和 datasheet 不一样？\r
\r
正常。比如你的是 STM32F103C8T6 标称 64KB，但 OpenOCD 检测到 128KB。因为 ST 经常用同一颗晶元，只是通过 marking 区分型号。\r
\r
### Q: 能不用配置文件直接在命令行跑吗？\r
\r
可以，CLion 实际执行的命令类似：\r
\r
\`\`\`bash\r
openocd.exe \\\r
  -f interface/stlink.cfg \\\r
  -f target/stm32f1x.cfg \\\r
  -c "program light_test.elf verify reset exit"\r
\`\`\`\r
`;export{r as default};

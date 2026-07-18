# OpenOCD `stlink.cfg` 配置详解

> 本文档基于你的项目 `light_test`，OpenOCD 版本 0.12.0。

---

## 一、你的 stlink.cfg 逐行解释

文件路径：`D:\vgd\light_test\stlink.cfg`

```tcl
# 1. 加载ST-Link硬件接口
source [find interface/stlink.cfg]
```

这行告诉 OpenOCD："我要用 ST-Link 调试器"。`source` 命令会加载 OpenOCD 安装目录下的 `scripts/interface/stlink.cfg`，里面定义了 ST-Link 的 USB VID/PID、驱动类型等。

```tcl
# 2. 指定适配器驱动
adapter driver st-link
```

显式指定驱动程序。OpenOCD 支持两种 ST-Link 驱动方式：
- `adapter driver hla` — 高层抽象层驱动（High-Level Adapter，老版本默认）
- `adapter driver st-link` — 原生 st-link 驱动（推荐，更稳定）

```tcl
# 3. 通信速度
adapter speed 4000
```

SWD/JTAG 通信时钟频率，单位 **kHz**。`4000` = 4MHz。

| 速度 | 适用场景 |
|------|---------|
| 1000 | 杜邦线连接，最稳定 |
| 4000 | 稳定性和速度的平衡 |
| 8000 | 短排线/PCB 连接，高速烧录 |
| 12000+ | 仅 ST-Link V3 支持 |

```tcl
# 4. 加载STM32F1芯片配置
source [find target/stm32f1x.cfg]
```

告诉 OpenOCD 目标芯片是 STM32F1 系列。这里定义了 Flash 地址、RAM 地址、内核类型等。

---

## 二、换调试器

### 常用调试器对照表

| 调试器 | 替换第1行 | 替换第2行 |
|--------|----------|----------|
| **ST-Link V2**（你当前） | `source [find interface/stlink.cfg]` | `adapter driver st-link` |
| **ST-Link V2-1**（Nucleo板载） | `source [find interface/stlink-v2-1.cfg]` | `adapter driver st-link` |
| **ST-Link V3** | `source [find interface/stlink.cfg]` | `adapter driver st-link` |
| **DAP-Link / CMSIS-DAP** | `source [find interface/cmsis-dap.cfg]` | `adapter driver cmsis-dap` |
| **J-Link** | `source [find interface/jlink.cfg]` | `adapter driver jlink` |

### DAP-Link 完整示例

```tcl
source [find interface/cmsis-dap.cfg]
adapter driver cmsis-dap
adapter speed 4000
source [find target/stm32f1x.cfg]
```

### J-Link 完整示例

```tcl
source [find interface/jlink.cfg]
adapter driver jlink
adapter speed 4000
source [find target/stm32f1x.cfg]
```

### 指定调试器序列号（多个调试器同时插时）

```tcl
# ST-Link
adapter serial "xxxxxxxxxxxx"

# DAP-Link
cmsis_dap_serial "xxxxxxxxxxxx"

# J-Link
adapter serial "xxxxxxxxxxxx"
```

---

## 三、换芯片

### STM32 系列对照表

| 芯片系列 | 替换第4行 |
|----------|----------|
| STM32F0 | `source [find target/stm32f0x.cfg]` |
| **STM32F1**（你当前） | `source [find target/stm32f1x.cfg]` |
| STM32F2 | `source [find target/stm32f2x.cfg]` |
| STM32F3 | `source [find target/stm32f3x.cfg]` |
| STM32F4 | `source [find target/stm32f4x.cfg]` |
| STM32F7 | `source [find target/stm32f7x.cfg]` |
| STM32G0 | `source [find target/stm32g0x.cfg]` |
| STM32G4 | `source [find target/stm32g4x.cfg]` |
| STM32H7 | `source [find target/stm32h7x.cfg]` |
| STM32H7 双Bank | `source [find target/stm32h7x_dual_bank.cfg]` |
| STM32L0 | `source [find target/stm32l0.cfg]` |
| STM32L1 | `source [find target/stm32l1.cfg]` |
| STM32L4 | `source [find target/stm32l4x.cfg]` |
| STM32L5 | `source [find target/stm32l5x.cfg]` |
| STM32WB | `source [find target/stm32wbx.cfg]` |
| STM32WL | `source [find target/stm32wlx.cfg]` |
| STM32U5 | `source [find target/stm32u5x.cfg]` |

### 非 STM32 芯片

| 芯片 | 第4行 |
|------|------|
| nRF51 | `source [find target/nrf51.cfg]` |
| nRF52 | `source [find target/nrf52.cfg]` |
| ESP32 | `source [find target/esp32.cfg]` |
| RP2040 (树莓派Pico) | `source [find target/rp2040.cfg]` |
| GD32VF103 (RISC-V) | `source [find target/gd32vf103.cfg]` |
| i.MX RT 系列 | `source [find target/imxrt.cfg]` |
| Kinetis (K40) | `source [find target/k40.cfg]` |

---

## 四、常用可配置参数

你可以在 `stlink.cfg` 中**在任何 `source` 语句之前**设置这些变量来覆盖默认值：

```tcl
# ====== 芯片识别 ======
# 指定芯片名称（默认为 stm32f1x）
set CHIPNAME stm32f103c8

# 指定 CPU TAP ID（调试接口 ID），通常不需要手动设
set CPUTAPID 0x1ba01477

# ====== 内存大小 ======
# 工作区大小（RAM 中用于 Flash 烧录的缓冲区，默认 0x1000 = 4KB）
set WORKAREASIZE 0x1000

# Flash 大小（0 = 自动检测）
set FLASH_SIZE 0x20000    ;# 128KB

# ====== 通信速度 ======
adapter speed 4000        ;# 你的当前设置
adapter speed 1000        ;# 降低速度提高稳定性

# ====== 复位配置 ======
# 复位后的延迟（ms）
adapter srst delay 100

# 复位类型
reset_config srst_nogate  ;# 你的当前设置（SRST 不门控）

# 其它复位选项：
# reset_config none               # 不连复位线
# reset_config srst_only          # 只连 SRST
# reset_config trst_and_srst      # JTAG 全部连接时
```

---

## 五、特殊命令（写在 stlink.cfg 里或命令行传参）

### 烧录后运行

```tcl
# 添加到最后
init
reset init
```

### 复位模式

| 命令 | 效果 |
|------|------|
| `reset_config srst_nogate` | 复位时不门控 JTAG（默认，推荐） |
| `reset_config srst_only` | 只用 SRST 复位 |
| `reset_config none` | 不复位 |
| `cortex_m reset_config sysresetreq` | 用内核的 SYSRESETREQ 软件复位 |

### 传输协议选择

```tcl
transport select swd     ;# 用 SWD（2线，推荐，速度快）
transport select jtag    ;# 用 JTAG（5线，老式接口）
```

### TPIU 跟踪（高级调试）

stm32f1x.cfg 内置了 TPIU（Trace Port Interface Unit）配置，可以配合逻辑分析仪获取指令跟踪信息，一般用不到。

---

## 六、完整配置示例

### 示例1：ST-Link V2 + STM32F103C8T6（你当前）

```tcl
source [find interface/stlink.cfg]
adapter driver st-link
adapter speed 4000
source [find target/stm32f1x.cfg]
transport select swd
```

### 示例2：DAP-Link + STM32F407VGT6

```tcl
source [find interface/cmsis-dap.cfg]
adapter driver cmsis-dap
adapter speed 5000
source [find target/stm32f4x.cfg]
transport select swd
```

### 示例3：J-Link + nRF52832

```tcl
source [find interface/jlink.cfg]
adapter driver jlink
adapter speed 4000
source [find target/nrf52.cfg]
transport select swd
```

### 示例4：ST-Link V3 + 高速烧录

```tcl
source [find interface/stlink.cfg]
adapter driver st-link
adapter speed 12000
source [find target/stm32f1x.cfg]
transport select swd
```

### 示例5：多 ST-Link 时指定序列号

```tcl
source [find interface/stlink.cfg]
adapter driver st-link
adapter serial "xxxxxxxxxxxx"
adapter speed 4000
source [find target/stm32f1x.cfg]
```

---

## 七、你拥有的可用调试器配置文件

你的 OpenOCD 安装里 `scripts/interface/` 目录下包含：

| 文件 | 调试器 |
|------|--------|
| `stlink.cfg` | ST-Link V1/V2/V2-1/V3（通用） |
| `stlink-v1.cfg` | ST-Link V1 专用 |
| `stlink-v2.cfg` | ST-Link V2 专用 |
| `stlink-v2-1.cfg` | ST-Link V2-1 专用（Nucleo 板载） |
| `stlink-dap.cfg` | ST-Link 的 CMSIS-DAP 兼容模式 |
| `cmsis-dap.cfg` | 通用 DAP-Link |
| `jlink.cfg` | J-Link |
| `ftdi/` | FTDI 系列（FT2232、FT232H 等） |
| `picoprobe.cfg` | 树莓派 Pico 做的调试器 |
| `ulink.cfg` | Keil ULINK 系列 |

---

## 八、常见问题

### Q: 烧录失败提示 "Error: init mode failed"

降低速度试试：`adapter speed 1000`

### Q: 换了芯片后还能用原来的 stlink.cfg 吗？

不能用。必须把 `source [find target/stm32f1x.cfg]` 改成对应芯片的配置文件。

### Q: Flash 识别的大小和 datasheet 不一样？

正常。比如你的是 STM32F103C8T6 标称 64KB，但 OpenOCD 检测到 128KB。因为 ST 经常用同一颗晶元，只是通过 marking 区分型号。

### Q: 能不用配置文件直接在命令行跑吗？

可以，CLion 实际执行的命令类似：

```bash
openocd.exe \
  -f interface/stlink.cfg \
  -f target/stm32f1x.cfg \
  -c "program light_test.elf verify reset exit"
```

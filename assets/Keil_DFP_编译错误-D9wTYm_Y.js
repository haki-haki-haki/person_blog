const n=`# Keil STM32 编译报错 "\\_Pos is undefined" 解决教程

> 本文档记录一次完整的 Keil STM32F4 工程编译问题排查与解决过程，可作为以后遇到类似问题的参考手册。

***

## 一、问题现象

打开一个开源 STM32F4 工程，Rebuild 后报大量类似错误：

\`\`\`
error: #20: identifier "ADC_JSQR_JL_Pos" is undefined\r
error: #20: identifier "RCC_CR_HSITRIM_Pos" is undefined\r
error: #20: identifier "RCC_PLLCFGR_PLLN_Pos" is undefined\r
error: #20: identifier "CAN_FMR_CAN2SB" is undefined\r
...
\`\`\`

**特征**：所有报错都是 \`XXX_Pos is undefined\` 形式，且都来自 HAL/LL 驱动文件（\`stm32f4xx_hal_rcc.c\`、\`stm32f4xx_ll_adc.h\` 等），不是用户代码的问题。

***

## 二、核心概念扫盲

### 1. 什么是 DFP（Device Family Pack）？

**DFP = Device Family Pack（设备家族包）**，是 Keil 为支持某一系列 MCU 而提供的软件包。

它包含：

- **设备头文件**：\`stm32f4xx.h\`、\`stm32f407xx.h\` 等，定义了芯片寄存器的位地址、中断号等
- **启动文件**：\`startup_stm32f407xx.s\`
- **Flash 算法**：用于下载程序到芯片 Flash
- **调试配置**：调试器需要的芯片信息

**DFP 版本直接决定了设备头文件的新旧。** 老版本 DFP 的头文件缺少新宏定义，就会导致编译报错。

DFP 的安装位置：

\`\`\`
C:\\Keil_v5\\ARM\\PACK\\Keil\\STM32F4xx_DFP\\<版本号>\\Device\\Include\\
\`\`\`

### 2. 什么是 \`_Pos\` 宏？

CMSIS（Cortex Microcontroller Software Interface Standard）规范中，寄存器位定义有两种写法：

**老写法（DFP 1.0.8 及更早）：**

\`\`\`c
#define  ADC_JSQR_JL     ((uint32_t)0x00300000)   // 只有掩码
\`\`\`

**新写法（DFP 2.x 及以后）：**

\`\`\`c
#define  ADC_JSQR_JL_Pos    (20U)                              // 位位置
#define  ADC_JSQR_JL_Msk    (0x3UL << ADC_JSQR_JL_Pos)         // 掩码 = 0x00300000
\`\`\`

新的 HAL/LL 驱动代码使用 \`ADC_JSQR_JL_Pos\` 这种带 \`_Pos\` 后缀的宏，如果你的 DFP 头文件太老（只有掩码，没有 \`_Pos\`），就会报 \`is undefined\`。

### 3. Keil 的头文件搜索顺序

Keil 编译时，头文件搜索顺序是：

1. **DFP 包的 Include 目录**（最高优先级，由 Device 选择自动添加）
2. **工程配置的 IncludePath**（Options for Target -> C/C++ -> Include Paths）
3. **编译器自带的系统目录**

这就是为什么即使工程 IncludePath 里配了 \`../Drivers/CMSIS/Device/ST/STM32F4xx/Include\`，如果这个目录不存在，编译器会回退到 DFP 目录找头文件。**DFP 目录的优先级最高。**

### 4. STM32 头文件层级结构

\`\`\`
stm32f4xx.h          (顶层选择器，根据 STM32F407xx 宏决定包含哪个)\r
  └── stm32f407xx.h   (真正的寄存器定义，1.2MB，包含所有 _Pos 宏)\r
system_stm32f4xx.h    (系统时钟相关声明)
\`\`\`

工程中 \`#define STM32F407xx\` 这个宏，会让 \`stm32f4xx.h\` 自动 \`#include "stm32f407xx.h"\`。

***

## 三、本次问题的根因

| 项目                | 版本               | 说明                          |
| ----------------- | ---------------- | --------------------------- |
| Keil μVision      | V5.24.2.0 (2017) | 偏老                          |
| STM32F4xx\\_DFP    | **1.0.8**        | **太老，无** **\`_Pos\`** **宏定义** |
| HAL 驱动            | V1.8.1 (新版)      | 使用 \`_Pos\` 宏                 |
| 仓库自带 CMSIS/Device | **缺失**           | 工程路径配了但目录不存在                |

**根因**：新版 HAL 驱动使用 \`_Pos\` 宏，但 DFP 1.0.8 的设备头文件只有老式掩码定义，没有 \`_Pos\` 宏。

***

## 四、解决方法

### 方法 A：覆盖 DFP 目录的旧头文件（本次使用，最简单）

#### 步骤 1：下载新版设备头文件

从 ST 官方 GitHub 仓库下载，**共三个文件**：

| 文件                  | 下载地址                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| stm32f4xx.h         | <https://raw.githubusercontent.com/STMicroelectronics/cmsis-device-f4/master/Include/stm32f4xx.h>        |
| stm32f407xx.h       | <https://raw.githubusercontent.com/STMicroelectronics/cmsis-device-f4/master/Include/stm32f407xx.h>      |
| system\\_stm32f4xx.h | <https://raw.githubusercontent.com/STMicroelectronics/cmsis-device-f4/master/Include/system_stm32f4xx.h> |

> **关于 raw 链接和 github.com 链接的区别：**
>
> \`raw.githubusercontent.com\` 是 GitHub 的「原始文件直链域名」，只返回文件纯文本，不带网页 UI，适合直接下载。
>
> \`github.com\` 链接带网页界面、代码高亮、按钮，适合浏览查代码。
>
> | 用途          | 链接格式                                                                                              |
> | ----------- | ------------------------------------------------------------------------------------------------- |
> | 浏览代码（带高亮界面） | \`https://github.com/STMicroelectronics/cmsis-device-f4/blob/master/Include/stm32f4xx.h\`           |
> | 下载文件（纯文本直链） | \`https://raw.githubusercontent.com/STMicroelectronics/cmsis-device-f4/master/Include/stm32f4xx.h\` |
>
> **转换方法**：raw 直链 -> 浏览界面，把 \`raw.githubusercontent.com\` 替换成 \`github.com\`，并在仓库路径中间加上 \`/blob/\`。
>
> 如果想用浏览器正常浏览代码，用 \`github.com/.../blob/...\` 链接；
> 如果想右键另存为下载文件，用 \`raw.githubusercontent.com/...\` 链接。

**仓库主页**：<https://github.com/STMicroelectronics/cmsis-device-f4>

> 如果 GitHub 打不开，可用国内镜像：
>
> - Gitee：<https://gitee.com/mirrors/cmsis-device-f4>
> - jsDelivr CDN：\`https://cdn.jsdelivr.net/gh/STMicroelectronics/cmsis-device-f4@master/Include/stm32f4xx.h\`

#### 步骤 2：备份并覆盖 DFP 旧文件

找到你的 DFP 安装目录（通常是）：

\`\`\`
C:\\Keil_v5\\ARM\\PACK\\Keil\\STM32F4xx_DFP\\1.0.8\\Device\\Include\\
\`\`\`

操作：

1. **备份**：把旧的 \`stm32f4xx.h\` 重命名为 \`stm32f4xx.h.bak\`
2. **覆盖**：把下载的三个新文件复制到这个目录
3. **验证**：确认 \`stm32f407xx.h\` 大小约 1.2MB（说明是完整版）

覆盖后目录结构：

\`\`\`
C:\\Keil_v5\\ARM\\PACK\\Keil\\STM32F4xx_DFP\\1.0.8\\Device\\Include\\
  ├── stm32f4xx.h          (12KB,  新版选择器)
  ├── stm32f407xx.h        (1.2MB, 新版寄存器定义，含8363个_Pos宏)
  ├── system_stm32f4xx.h   (2.2KB, 新版)
  ├── stm32f4xx.h.bak          (旧版备份)
  └── system_stm32f4xx.h.bak   (旧版备份)
\`\`\`

#### 步骤 3：验证文件版本

用记事本打开下载的 \`stm32f407xx.h\`，搜索 \`ADC_JSQR_JL_Pos\`：

- ✅ 能搜到 \`#define ADC_JSQR_JL_Pos (20U)\` -> 版本正确
- ❌ 搜不到 -> 版本错误，重新下载

#### 步骤 4：Rebuild

回到 Keil，\`Project -> Rebuild all target files\`，错误应全部消失。

***

### 方法 B：补全工程缺失的 CMSIS 目录（不碰 DFP）

如果不想动 DFP 目录，可以把新文件放到工程内：

1. 创建目录：

\`\`\`
<工程目录>\\Drivers\\CMSIS\\Device\\ST\\STM32F4xx\\Include\\
\`\`\`

1. 放入下载的三个文件
2. 确认工程 IncludePath 包含该路径：
   - \`Options for Target -> C/C++ -> Include Paths\` 中应该有 \`../Drivers/CMSIS/Device/ST/STM32F4xx/Include\`

> **注意**：此方法的前提是工程 IncludePath 优先级高于 DFP。但 Keil 实际上会把 DFP 路径加在最前面，所以**方法 B 在某些 Keil 版本可能无效，方法 A 更可靠。**

***

### 方法 C：升级 DFP 到 2.x（正规方案，需要联网或离线包）

1. 下载 \`Keil.STM32F4xx_DFP.2.13.0.pack\` 或更高版本
   - 官网：<https://www.keil.arm.com/packs/stm32f4xx_dfp-keil/versions/>
2. 双击 \`.pack\` 文件自动安装
3. 可能需要同时更新 CMSIS 包

> **注意**：DFP 2.x 可能要求较新版本的 Keil，老版 Keil（如 5.24）可能装不上，此时用方法 A。

***

### 方法 D：升级 Keil MDK（终极方案）

1. 下载新版 MDK：<https://www.keil.arm.com/demo/eval/keil-mdk/>
2. 覆盖安装到 \`C:\\Keil_v5\\\`
3. 导入 License
4. 安装新版 DFP

> 适合以后长期开发 STM32 的场景。

***

## 五、如何快速诊断类似问题

遇到 STM32 工程编译报错，按以下步骤排查：

### 1. 看 build log 中的编译器版本

\`\`\`
IDE-Version: µVision V5.24.2.0       ← Keil 版本
C Compiler: Armcc.exe V5.06 update 5  ← 编译器版本
\`\`\`

### 2. 看报错来源

- 报错在 **HAL 驱动文件**（\`stm32f4xx_hal_*.c\`）→ 通常是头文件版本问题
- 报错在 **用户代码** → 检查自己的代码
- 报错 \`cannot open source input file\` → include 路径问题

### 3. 检查 DFP 版本

\`\`\`
C:\\Keil_v5\\ARM\\PACK\\Keil\\STM32F4xx_DFP\\<版本号>\\
\`\`\`

### 4. 检查 build log 中实际使用的头文件路径

\`\`\`
C:\\Keil_v5\\ARM\\PACK\\Keil\\STM32F4xx_DFP\\1.0.8\\Device\\Include\\stm32f4xx.h(170): warning...
\`\`\`

↑ 这行告诉你编译器实际用的是哪个头文件。

### 5. 验证头文件内容

用记事本打开 \`stm32f407xx.h\`，搜索 \`_Pos\`：

- 有大量结果（8000+）→ 新版，没问题
- 搜不到 → 老版，需要升级

***

## 六、PowerShell 下载脚本（自动化）

如果需要在一台电脑上自动下载这三个文件，可保存以下脚本为 \`download.ps1\` 运行：

\`\`\`powershell
$dir = Read-Host "请输入目标目录路径"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$files = @("stm32f4xx.h", "stm32f407xx.h", "system_stm32f4xx.h")
$baseUrl = "https://raw.githubusercontent.com/STMicroelectronics/cmsis-device-f4/master/Include"

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $out = Join-Path $dir $file
    Write-Host "Downloading $file ..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -TimeoutSec 60
        $size = (Get-Item $out).Length
        Write-Host "  OK: $size bytes"
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)"
    }
}
Write-Host "Done. Files in $dir:"
Get-ChildItem $dir | Format-Table Name, Length
\`\`\`

运行：

\`\`\`powershell
powershell -ExecutionPolicy Bypass -File download.ps1
\`\`\`

***

## 七、相关链接汇总

| 资源                        | 地址                                                            |
| ------------------------- | ------------------------------------------------------------- |
| cmsis-device-f4 仓库（设备头文件） | <https://github.com/STMicroelectronics/cmsis-device-f4>       |
| STM32CubeF4 仓库（完整固件包）     | <https://github.com/STMicroelectronics/STM32CubeF4>           |
| STM32F4 HAL 驱动仓库          | <https://github.com/STMicroelectronics/stm32f4xx_hal_driver>  |
| Keil DFP 下载页              | <https://www.keil.arm.com/packs/stm32f4xx_dfp-keil/versions/> |
| Keil MDK 下载页              | <https://www.keil.arm.com/demo/eval/keil-mdk/>                |
| ST 官网固件包                  | <https://www.st.com/en/embedded-software/stm32cubef4.html>    |

***

## 八、本次解决过程总结

1. **发现问题**：开源 STM32F4 工程编译报大量 \`XXX_Pos is undefined\`
2. **诊断根因**：DFP 1.0.8 太老，设备头文件无 \`_Pos\` 宏，而 HAL V1.8.1 需要这些宏
3. **确认缺失**：工程配置了 \`../Drivers/CMSIS/Device/ST/STM32F4xx/Include\` 路径，但该目录在仓库中不存在
4. **下载文件**：从 \`STMicroelectronics/cmsis-device-f4\` 仓库下载三个头文件
5. **首次尝试**：放入工程目录 → 失败，因为 DFP 目录优先级更高
6. **最终解决**：备份 DFP 1.0.8 旧文件，用新文件覆盖 → Rebuild 成功

**关键教训**：Keil 中 DFP 的 Include 路径优先级最高，直接覆盖 DFP 目录的文件是最有效的方案。
`;export{n as default};

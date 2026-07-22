# C extra

## 常量后缀

```c
typedef enum 
{
  HAL_OK       = 0x00U,
  HAL_ERROR    = 0x01U,
  HAL_BUSY     = 0x02U,
  HAL_TIMEOUT  = 0x03U
} HAL_StatusTypeDef;
```

U 后缀只表示 无符号

0x00U 中的 U 仅表示这是一个 unsigned int 类型的常量，但并没有指定它是多少位。

枚举的实际大小取决于编译器和平台 在 STM32（ARM Cortex-M4）上，默认情况下：整形一般都是32位 

---

32位操作在ARM上效率最高，8位反而需要额外的指令来处理

```C
// 写法1：直接写十六进制字面量
HAL_OK = 0x00U;       // 编译器推断为 unsigned int (32位)

// 写法2：显式指定类型
HAL_OK = (uint8_t)0;  // 强制转换为8位

// 写法3：用十进制
HAL_OK = 0U;          // 同样是32位无符号整数，值为0
```

## union联合体

联合体（共用体）`union`：**所有成员共享同一块内存空间**，同一时刻只能有效使用其中一个成员；占用内存大小 = 占用最大字节的成员长度。

和结构体`struct`区别：结构体成员独立分配内存，联合体共用内存。

单片机外设寄存器、CAN、串口、ADC 数据经常：

- 整体是 16 位 / 32 位整数
- 又需要单独取高字节、低字节、单字节

```c
// 32位数据，既可整体读写，也可单独访问4个字节
union Data32
{
    uint32_t val;
    uint8_t byte[4];
};

void Test(void)
{
    union Data32 data;
    data.val = 0x12345678;
    uint8_t low1 = data.byte[0]; // 低字节
    uint8_t high1 = data.byte[3];// 高字节
}
```

```c
// 一帧4字节数据
union Frame
{
    uint8_t buf[4];    // 串口收发原始字节流
    uint32_t raw;      // 整体32位值
    float f;           // 浮点传感器数据
};

// 串口收到4字节存入buf，直接读float就是传感器值
union Frame frame;
UART_Read(frame.buf,4);
float temp = frame.f;
```

通信收发缓冲区是字节数组，但业务数据是 16/32 位整型、浮点。

联合体实现**字节数组 ↔ 数值类型无缝转换**，不用手动拼接高低字节。

## _weak弱函数

`__weak` 是 **ARM GCC 编译器扩展语法**，标准 C 语言本身没有这个关键字，只在 STM32、单片机嵌入式开发常用。

库中先定义一个空的`__weak`默认函数；

用户工程里写**同名普通函数**，会自动覆盖弱函数；

如果用户不实现，程序自动使用库内弱函数，不会报未定义错误

demo 

文件1

```c
// lib.c
#include <stdio.h>
#define UNUSED(x) (void)(x)

// 弱函数
__weak void HAL_WWDG_Callback(void)
{
    printf("执行库里面的弱函数（默认空逻辑）\r\n");
}

// 底层固定调用入口
void WWDG_ISR(void)
{
    HAL_WWDG_Callback();
}
```

文件2

```c
#include <stdio.h>

// 强函数，自动覆盖上面的弱函数
void HAL_WWDG_Callback(void)
{
    printf("执行用户写的强函数，覆盖库弱函数\r\n");
}

extern void WWDG_ISR(void);

int main(void)
{
    WWDG_ISR();
    return 0;
}
```

输出 执行用户写的强函数，覆盖库弱函数

多用于库提供回调接口（WWDG、EXTI、UART、TIM 所有 HAL 回调）；



## 宏

```c
#ifndef user_malloc
#ifdef _CMSIS_OS_H
#define user_malloc pvPortMalloc
#else
#define user_malloc malloc
#endif
#endif
```

两种分配内存的方式 

裸机			 malloc

 FreeRTOS		pvPortMalloc
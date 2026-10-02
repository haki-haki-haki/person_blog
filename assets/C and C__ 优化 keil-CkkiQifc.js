const n=`# C/C++ 优化 keil\r
\r
## 编译器优化选项\r
\r
### 代码体积\r
\r
- -Ospace\r
\r
  Keil编译器默认配置，主要目的是减少代码体积\r
\r
### 执行速度\r
\r
- -Otime\r
\r
  目的是加快执行速度  优化等级及调试信息\r
\r
- -O0\r
\r
  最少的优化，可以最大程度上配合产生代码调试信息，可以在任何代码行打断点，特别是死代码处。\r
\r
- -O1\r
\r
  有限的优化，去除无用的inline和无用的[static函数](https://zhida.zhihu.com/search?content_id=1947492&content_type=Article&match_order=1&q=static函数&zhida_source=entity)、死代码消除等，在影响到调试信息的地方均不进行优化。在适当的代码体积和充分的调试之间平衡，代码编写阶段最常用的优化等级。\r
\r
- -O2\r
\r
高度优化，调试信息不友好，有可能会修改代码和函数调用执行流程，自动对函数进行内联等。\r
\r
- -O3\r
\r
最大程度优化，产生极少量的调试信息。会进行更多代码优化，例如[循环展开](https://zhida.zhihu.com/search?content_id=1947492&content_type=Article&match_order=1&q=循环展开&zhida_source=entity)，更激进的[函数内联](https://zhida.zhihu.com/search?content_id=1947492&content_type=Article&match_order=1&q=函数内联&zhida_source=entity)等。\r
\r
## 循环展开\r
\r
### 普通循环\r
\r
32位判断1\r
\r
\`\`\`c\r
int countbit1(unsigned int n)\r
{\r
    int bits = 0;\r
    while (n != 0)\r
    {\r
        if (n & 1) bits++;\r
             n >>= 1;\r
    }\r
    return bits;\r
}\r
\`\`\`\r
\r
### 循环展开\r
\r
\`\`\`c\r
int countbit2(unsigned int n)\r
{\r
    int bits = 0;\r
    while (n != 0)\r
    {\r
        if (n & 1) bits++;\r
        if (n & 2) bits++;\r
        if (n & 4) bits++;\r
        if (n & 8) bits++;\r
            n >>= 4;\r
    }\r
    return bits;\r
}\r
\`\`\`\r
\r
---\r
\r
代码的循环展开减少循环体的执行次数，但在一定程度上增大了体积，一般循环展开4个一组。\r
\r
在-O3优化等级下，编译器会适当进行循环展开。\r
\r
### CPU 流水线阻塞\r
\r
<!--CPU 靠流水线并行执行多条指令，提前预取下一条指令。但条件跳转是不确定的：CPU 不知道下一条走循环内还是跳出循环。每一轮循环都要经历一次判断 + 跳转，频繁打断流水线，产生巨大等待损耗。循环控制指令本身执行耗时很低，真正拖慢速度的是跳转带来的流水线失效、预取失效。-->\r
\r
### 内联\r
\r
**编译器在函数内联时的决策**\r
\r
如果优化选项是 -Ospace , 则编译器会倾向于比较少的内联，以减少代码体积；如果优化选项为 -Otime , 则编译器则会倾向于更多的内联，但也会避免代码体积的大量增加。\r
\r
一般决定内联都是由编译器决定\r
\r
\`-O0\` 无优化：几乎不会内联，不管写没写 inline\r
\r
\`-O2 / -O3\` 高优化：编译器自动做自动内联\r
\r
哪怕你函数没加 inline，短小频繁调用的函数，编译器主动帮你展开\r
\r
函数越小越好内联，函数很大不会内联；\r
\r
static静态函数更容易内联（当前文件调用，不多）\r
\r
外部全局函数很难内联\r
\r
函数递归，包含多循环多判断不会内联\r
\r
## volatile\r
\r
作用：	告诉编译器：**这个变量的值随时可能被程序外部修改**（硬件、中断、别的线程），**禁止编译器缓存它到寄存器**，每次使用必须真实从内存重新读取。\r
\r
### 反例\r
\r
\`\`\`c\r
int buffer_full; // 普通全局变量\r
int read_stream(void)\r
{\r
    int count = 0;\r
    while (!buffer_full) { count++; }\r
    return count;\r
}\r
\`\`\`\r
\r
开 \`-O2\` 编译器优化逻辑：\r
\r
1. 函数开头只从内存读一次 \`buffer_full\`，放到 CPU 寄存器里；\r
2. 编译器认为代码内部没有任何地方修改 \`buffer_full\`，认定它永远不变；\r
3. 循环判断直接复用寄存器里的值，**再也不访问内存**。\r
\r
场景问题：如果 \`buffer_full\` 是**中断里置 1**，中断触发改了内存的值，但主循环永远看不到，死循环卡死。\r
\r
### 正例\r
\r
\`\`\`c\r
volatile int buffer_full;\r
\`\`\`\r
\r
编译器强制规则：**每次用到 buffer_full，都必须重新从内存加载，不能用寄存器缓存**。\r
\r
每一轮循环开头都会访问内存拿最新值，中断修改后主函数能立刻感知。\r
\r
常见使用：\r
\r
- 中断服务函数修改的全局标志变量\r
- 多线程共享无锁变量\r
\r
## 数据对齐特性\r
\r
### 自然对齐\r
\r
CPU 硬件规定：**每种基础类型，必须存放在自身大小整数倍的地址上**\r
\r
CPU 原生读写对齐地址的数据，一条指令就能完成，速度最快。\r
\r
demo:\r
\r
\`char\` 1 字节：任意地址都能放（对齐 1）\r
\r
\`short\` 2 字节：地址必须是 0、2、4、6… 偶数\r
\r
\`int\` 4 字节：地址必须是 0、4、8、12…4 的倍数\r
\r
\`long long\` 8 字节：地址必须是 8 的倍数\r
\r
\`\`\`c\r
struct example_st {\r
    int a;    // 4字节\r
    char b;   // 1字节\r
    int c;    // 4字节\r
};\r
\r
/*\r
\r
0x00~0x03  int a    4B\r
0x04       char b   1B\r
0x05~0x07  【填充空隙3字节，空白】\r
0x08~0x0B  int c    4B\r
\r
*/\r
\r
\`\`\`\r
\r
### packed\r
\r
取消所有自动填充，成员紧紧挨着，不留空隙，允许非对齐存储\r
\r
\`\`\`c\r
__packed struct mystruct {\r
    char c;  // 1B\r
    short s; // 2B\r
};\r
\r
/*\r
\r
0x00 c\r
0x01~0x02 s\r
\r
*/\r
\`\`\`\r
\r
单个成员打包\r
\r
\`\`\`c\r
struct mystruct {\r
    char c;\r
    __packed short s;\r
};\r
\`\`\`\r
\r
---\r
\r
非对齐访问很慢,不推荐随便用\r
\r
CPU 只能**高效读取对齐地址数据**：\r
\r
- 对齐 \`short\`（0x02）：1 条汇编指令读完\r
- 非对齐 \`short\`（0x01）：CPU 要分两次读内存，拼接高低字节，多好几条指令，速度大幅下降\r
\r
只有固定协议、二进制报文场景才用：\r
\r
串口 / 网络通信协议、Flash 存储帧格式，文档严格规定字节排布，不能有空填充字节，必须紧凑无空隙。\r
`;export{n as default};

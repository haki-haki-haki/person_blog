const n=`# C语言基础\r
\r
## 位运算\r
\r
### 异或 ^\r
\r
#### **基本规律**\r
\r
**0 | a=a;**\r
\r
**(a | b) | c = (b | c ) | a ;**   交换律\r
\r
#### **应用**\r
\r
**交换a,b两数的值**   \r
\r
\`\`\`C\r
a=a ^ b;\r
\r
b=a ^ b;\r
\r
a=a ^ b;\r
\`\`\`\r
\r
**获取最右侧/最低位的1**\r
\r
\`\`\`c\r
a & (~ a+1);\r
\`\`\`\r
\r
**找出数组中只出现一次的数**\r
\r
\`\`\`c\r
eg:\r
	num={2,2,1};\r
	输出：1；\r
 ans:\r
int s=0;\r
for(i;i<(sizeof(num)/sizeof(num[0])) ;i++)\r
{\r
    s ^ num[i]; //相同的数 ^ 后变0，0|a=a，只剩下出现一次的数\r
}\r
\r
\`\`\`\r
\r
---\r
\r
## 指针\r
\r
### 指针访问\r
\r
**1.直接*，解引用**\r
\r
**2.用p[a]等价于==* (p+a)==**\r
\r
> 实际上这是C语言语法 —> a[b]= (a+b)，数组也是这么访问的\r
\r
\r
\r
---\r
\r
### 返回指针的函数&&函数指针\r
\r
\`\`\`C\r
int *add(int a,int b)	//表示函数返回一个指针，但是函数本身是个指针，所以是个[*(*)(int,int)类型]\r
{\r
    static int num;			//必须用静态变量来延长该变量的生命周期，若用局部变量在函数调用结束时会被销毁导致返回野指针\r
    num=a+b;\r
    return &num;\r
}\r
\r
int main(void)\r
{\r
    int*(*p)(int,int)=add;	//定义个相同的变量储存，p就是函数指针\r
\r
    printf("Hello,%d",*p(1,2));	//此时p指向函数add了\r
\r
  return 0;\r
}\r
\r
\`\`\`\r
## Union--联合体\r
#union\r
### 定义与调用\r
\`\`\`C\r
union Data\r
{\r
	uint32_t val;\r
	uint8_t buf[4];\r
\r
};\r
\r
....\r
\r
union Data data1;\r
data1.val=111;\r
\r
\r
\`\`\`\r
### 特点：\r
所有成员公用一个内存空间(最大成员占用大小)，对一个变量修改会影响其他区变量，与struct不同\r
### 主要用途\r
1.拆字节(可用于CAN/串口通信时拼接数据)\r
\`\`\`C\r
union Data\r
{\r
	uint32_t val;\r
	uint8_t buf[4];\r
\r
};\r
\r
union Data data1;\r
data1.val=111;     //改val就是改总的值\r
data1.buf[0]=0;    //也可以改某一位的值\r
\`\`\`\r
2.操作长数据某一位(搭配struct，精细化)\r
\`\`\`C\r
union reg\r
{\r
	uint16_t all;        //可以直接读取整段数据\r
	uint16_t struct {\r
		reg1:1;    //":"位域，用于具体分配内存 reg1:1表示给reg1分配1bit空间\r
		reg2:1;\r
		regn;14;\r
	}bits;         //总大小16，和all一样\r
}                            //可以直接访问某一位改值\r
//(例如：reg1是终端开启标志位，直接访问bits即可修改)\r
//相较于直接移位操作，更加直观易懂，可读性强\r
\`\`\`\r
\r
eg:\r
\`\`\`C\r
/**\r
\r
 * @brief 自定义浮点数绝对值函数(高效实现)\r
\r
 * @param x 需要计算绝对值的浮点数\r
\r
 * @return x的绝对值\r
\r
 */\r
\r
float my_fabsf(float x)\r
\r
{\r
\r
    union\r
\r
    {\r
        float f;\r
        unsigned int u;\r
    } converter;\r
    converter.f = x;\r
    // 清除符号位(第31位)\r
    converter.u &= 0x7FFFFFFF;\r
    return converter.f;\r
}\r
\`\`\`\r
\r
### “，”\r
\r
按顺序执行，并将最后一个表达式的值作为整个表达式的值\r
\r
\`\`\`C\r
已知int a；执行语句“x＝（a=3*5，a+5), a*4”后，变量a的值是\r
A. 15\r
B. 20\r
C. 60\r
D. 不确定\r
    x＝（a=3*5，a+5), a*4\r
    (a=3*5,a+5) //按顺序执行，a=15 -> a+5=20作整个表达式的值\r
    (x=20,a*4=60) // 整个表达式值为60，但并未赋值给x\r
    x=20\r
    \r
    \r
\`\`\`\r
\r
----\r
\r
\r
\r
\r
\r
## 标准宏（预定义宏）\r
\r
标准宏是**编译器内置的宏**，不需要 \`#define\`，也不需要 \`#include\` 任何头文件，直接就能用。编译器在编译你的代码时，会自动把它们替换成对应的值。\r
\r
---\r
\r
### 常见的标准宏\r
\r
| 宏                 | 替换内容                          | 说明     |\r
| ------------------ | --------------------------------- | -------- |\r
| \`__FILE__\`         | 当前文件名（字符串）              | 错误定位 |\r
| \`__LINE__\`         | 当前行号（整数）                  | 错误定位 |\r
| \`__func__\`         | 当前函数名（字符串）              | C99 标准 |\r
| \`__DATE__\`         | 编译日期，如 \`"Jun 10 2026"\`      | 版本信息 |\r
| \`__TIME__\`         | 编译时间，如 \`"14:30:00"\`         | 版本信息 |\r
| \`__STDC__\`         | 是否符合 ANSI C 标准              | 条件编译 |\r
| \`__STDC_VERSION__\` | C 标准版本号，如 \`199901L\`（C99） | 条件编译 |\r
\r
---\r
\r
### 和你自己写的宏的区别\r
\r
\`\`\`c\r
#define PI 3.14           // 你自己定义的宏，不写这行就不能用\r
\r
printf("%s", __FILE__);   // 编译器自带的宏，不需要定义，直接就能用\r
\`\`\`\r
\r
自己定义的宏是**手动造的**，标准宏是**编译器自带的**。编译器看到 \`__FILE__\` 就知道该换成当前文件路径。\r
\r
---\r
\r
### 举个例子\r
\r
\`\`\`c\r
// 编译日期：2026年6月10日\r
printf("Firmware built: %s %s\\r\\n", __DATE__, __TIME__);\r
// 输出：Firmware built: Jun 10 2026 14:30:00\r
\`\`\`\r
\r
你完全没定义 \`__DATE__\` 和 \`__TIME__\`，但能用——因为编译器帮你填好了。这在嵌入式固件里很有用，可以打印编译时间来判断设备跑的是哪个版本的固件。\r
\r
---\r
\r
### 一句话总结\r
\r
**标准宏就是编译器替你写好了 \`#define\` 的东西，拿来即用，零成本。**\r
\r
---\r
## 字节对齐\r
#字节对齐\r
### 定义\r
我们知道在现代计算机中，内存空间按照字节划分的，一个字节就对应一个内存地址，我们在访问内存时，是可以从任意地址开始的。但在实际中并不能做到如此，我们一般是在特定的内存地址访问，比如说 [STM32](https://zhida.zhihu.com/search?content_id=228654991&content_type=Article&match_order=1&q=STM32&zhida_source=entity) ，它就是4字节对齐，所以它访问地址时，必须是以4字节为单位去访问地址，读取数据时也是一次读取4字节；\r
\r
![](https://pic2.zhimg.com/v2-576c74fa5e8b391fd6eff5c7c5738c1d_1440w.jpg)\r
\r
比如说，在地址1处，存放了一个char型变量a（一个Byte），STM32在访问时不是直接访问地址1去取出变量a，而是从地址0处一下子读取4个Byte，然后再从中取出a的值；\r
### 结构体\r
c语言中结构体对齐步骤：一、结构体各成员对齐；二、结构体总体对齐\r
\r
结构体中成员对齐时，存放的地址取自身对齐值和指定对齐值中的最小值整数倍地址处，比如char类型，自身对齐值为1，指定对齐值为4（STM32、gcc（x86）），因此存放地址是1的整数倍，即可以存在任意地址处；又比如shortr类型，自身对齐值为2，指定对齐值为4（STM32、gcc（x86）），因此存放地址是2的整数倍，即只能存放在类似于0，2，4，8.......地址处；\r
\r
结构体总体对齐时，取结构体内自身对齐值最大的成员和指定对齐值的整数倍；\r
\r
![](https://pic1.zhimg.com/v2-709b2fea15a20212c981506815ef6696_1440w.jpg)\r
\r
上图所示，char\\_d和指定对齐值最小值是1，因此char\\_d放在结构体开始偏移地址为0处；\r
\r
short\\_e和指定对齐值最小值是2，因此short\\_e放在结构体开始偏移地址为2处；\r
\r
int\\_f和指定对齐值最小值是4，因此int\\_f放在结构体开始偏移地址为4处；\r
\r
由上可已得到，结构体各成员相对于结构体首地址的偏移地址如下图：\r
\r
![](https://pic3.zhimg.com/v2-a0b8a0c61a3c9516b4d91d26ce4ee4f6_1440w.jpg)\r
\r
结构体总对齐字节大小为最大成员对齐值4和指定对齐值4最小值(也就是4)的整数倍，而此时内存中共占8个字节,正好是4的整数倍,所以此结构体的大小为8byte。\r
### 手动对齐\r
可以通过#program(n)指定对齐字节数(n必须是2的次方)\r
通常用于**特定协议通信**时打包结构体\r
\`\`\`C\r
void UIDelete(referee_id_t *_id, uint8_t Del_Operate, uint8_t Del_Layer)\r
\r
{\r
\r
    static UI_delete_t UI_delete_data;  // pack(1) 的结构体\r
\r
  \r
\r
    // 逐字段填充\r
\r
    UI_delete_data.FrameHeader.SOF = REFEREE_SOF;\r
\r
    UI_delete_data.FrameHeader.DataLength = temp_datalength;\r
\r
    ....\r
\r
    // 直接取结构体地址，当成字节流发送！\r
\r
    RefereeSend((uint8_t *)&UI_delete_data, LEN_HEADER + LEN_CMDID + temp_datalength + LEN_TAIL);\r
\r
} //D:\\Robomaster\\OpenSource\\YL\\YL\\basic_framework-master\r
\`\`\`\r
\r
\r
\r
---\r
\r
\r
## 算法\r
\r
### 冒泡排序\r
\r
\`\`\`C\r
void Sort(int num[10], int n) //每次循环都确定一个元素（未排序中最大的）的位置\r
{\r
    for (int i = 0; i < n; i++) //代表已经确定的元素个数，循环次数\r
    {\r
        int swap = 0; //标记交换，若没有交换就直接退出\r
        for (int j = 0; j < n - i - 1; j++)//每次都要遍历未排序的元素，最后一次不用排序-1，已经确定的不用再排了-n\r
        {\r
            if (num[j] > num[j + 1])\r
            {\r
                int t;\r
                t = num[j];\r
                num[j] = num[j + 1];\r
                num[j + 1] = t;\r
                swap = 1;\r
            }\r
        }\r
        if (!swap) //若没有交换就直接退出\r
        {\r
            break;\r
        }\r
    }\r
}\r
\`\`\`\r
\r
`;export{n as default};

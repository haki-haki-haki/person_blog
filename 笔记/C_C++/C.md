# C语言基础

## 位运算

### 异或 ^

#### **基本规律**

**0 | a=a;**

**(a | b) | c = (b | c ) | a ;**   交换律

#### **应用**

**交换a,b两数的值**   

```C
a=a ^ b;

b=a ^ b;

a=a ^ b;
```

**获取最右侧/最低位的1**

```c
a & (~ a+1);
```

**找出数组中只出现一次的数**

```c
eg:
	num={2,2,1};
	输出：1；
 ans:
int s=0;
for(i;i<(sizeof(num)/sizeof(num[0])) ;i++)
{
    s ^ num[i]; //相同的数 ^ 后变0，0|a=a，只剩下出现一次的数
}

```

---

## 指针

### 指针访问

**1.直接*，解引用**

**2.用p[a]等价于==* (p+a)==**

> 实际上这是C语言语法 —> a[b]= (a+b)，数组也是这么访问的



---

### 返回指针的函数&&函数指针

```C
int *add(int a,int b)	//表示函数返回一个指针，但是函数本身是个指针，所以是个[*(*)(int,int)类型]
{
    static int num;			//必须用静态变量来延长该变量的生命周期，若用局部变量在函数调用结束时会被销毁导致返回野指针
    num=a+b;
    return &num;
}

int main(void)
{
    int*(*p)(int,int)=add;	//定义个相同的变量储存，p就是函数指针

    printf("Hello,%d",*p(1,2));	//此时p指向函数add了

  return 0;
}

```
## Union--联合体
#union
### 定义与调用
```C
union Data
{
	uint32_t val;
	uint8_t buf[4];

};

....

union Data data1;
data1.val=111;


```
### 特点：
所有成员公用一个内存空间(最大成员占用大小)，对一个变量修改会影响其他区变量，与struct不同
### 主要用途
1.拆字节(可用于CAN/串口通信时拼接数据)
```C
union Data
{
	uint32_t val;
	uint8_t buf[4];

};

union Data data1;
data1.val=111;     //改val就是改总的值
data1.buf[0]=0;    //也可以改某一位的值
```
2.操作长数据某一位(搭配struct，精细化)
```C
union reg
{
	uint16_t all;        //可以直接读取整段数据
	uint16_t struct {
		reg1:1;    //":"位域，用于具体分配内存 reg1:1表示给reg1分配1bit空间
		reg2:1;
		regn;14;
	}bits;         //总大小16，和all一样
}                            //可以直接访问某一位改值
//(例如：reg1是终端开启标志位，直接访问bits即可修改)
//相较于直接移位操作，更加直观易懂，可读性强
```

eg:
```C
/**

 * @brief 自定义浮点数绝对值函数(高效实现)

 * @param x 需要计算绝对值的浮点数

 * @return x的绝对值

 */

float my_fabsf(float x)

{

    union

    {
        float f;
        unsigned int u;
    } converter;
    converter.f = x;
    // 清除符号位(第31位)
    converter.u &= 0x7FFFFFFF;
    return converter.f;
}
```

### “，”

按顺序执行，并将最后一个表达式的值作为整个表达式的值

```C
已知int a；执行语句“x＝（a=3*5，a+5), a*4”后，变量a的值是
A. 15
B. 20
C. 60
D. 不确定
    x＝（a=3*5，a+5), a*4
    (a=3*5,a+5) //按顺序执行，a=15 -> a+5=20作整个表达式的值
    (x=20,a*4=60) // 整个表达式值为60，但并未赋值给x
    x=20
    
    
```

----





## 标准宏（预定义宏）

标准宏是**编译器内置的宏**，不需要 `#define`，也不需要 `#include` 任何头文件，直接就能用。编译器在编译你的代码时，会自动把它们替换成对应的值。

---

### 常见的标准宏

| 宏                 | 替换内容                          | 说明     |
| ------------------ | --------------------------------- | -------- |
| `__FILE__`         | 当前文件名（字符串）              | 错误定位 |
| `__LINE__`         | 当前行号（整数）                  | 错误定位 |
| `__func__`         | 当前函数名（字符串）              | C99 标准 |
| `__DATE__`         | 编译日期，如 `"Jun 10 2026"`      | 版本信息 |
| `__TIME__`         | 编译时间，如 `"14:30:00"`         | 版本信息 |
| `__STDC__`         | 是否符合 ANSI C 标准              | 条件编译 |
| `__STDC_VERSION__` | C 标准版本号，如 `199901L`（C99） | 条件编译 |

---

### 和你自己写的宏的区别

```c
#define PI 3.14           // 你自己定义的宏，不写这行就不能用

printf("%s", __FILE__);   // 编译器自带的宏，不需要定义，直接就能用
```

自己定义的宏是**手动造的**，标准宏是**编译器自带的**。编译器看到 `__FILE__` 就知道该换成当前文件路径。

---

### 举个例子

```c
// 编译日期：2026年6月10日
printf("Firmware built: %s %s\r\n", __DATE__, __TIME__);
// 输出：Firmware built: Jun 10 2026 14:30:00
```

你完全没定义 `__DATE__` 和 `__TIME__`，但能用——因为编译器帮你填好了。这在嵌入式固件里很有用，可以打印编译时间来判断设备跑的是哪个版本的固件。

---

### 一句话总结

**标准宏就是编译器替你写好了 `#define` 的东西，拿来即用，零成本。**

---
## 字节对齐
#字节对齐
### 定义
我们知道在现代计算机中，内存空间按照字节划分的，一个字节就对应一个内存地址，我们在访问内存时，是可以从任意地址开始的。但在实际中并不能做到如此，我们一般是在特定的内存地址访问，比如说 [STM32](https://zhida.zhihu.com/search?content_id=228654991&content_type=Article&match_order=1&q=STM32&zhida_source=entity) ，它就是4字节对齐，所以它访问地址时，必须是以4字节为单位去访问地址，读取数据时也是一次读取4字节；

![](https://pic2.zhimg.com/v2-576c74fa5e8b391fd6eff5c7c5738c1d_1440w.jpg)

比如说，在地址1处，存放了一个char型变量a（一个Byte），STM32在访问时不是直接访问地址1去取出变量a，而是从地址0处一下子读取4个Byte，然后再从中取出a的值；
### 结构体
c语言中结构体对齐步骤：一、结构体各成员对齐；二、结构体总体对齐

结构体中成员对齐时，存放的地址取自身对齐值和指定对齐值中的最小值整数倍地址处，比如char类型，自身对齐值为1，指定对齐值为4（STM32、gcc（x86）），因此存放地址是1的整数倍，即可以存在任意地址处；又比如shortr类型，自身对齐值为2，指定对齐值为4（STM32、gcc（x86）），因此存放地址是2的整数倍，即只能存放在类似于0，2，4，8.......地址处；

结构体总体对齐时，取结构体内自身对齐值最大的成员和指定对齐值的整数倍；

![](https://pic1.zhimg.com/v2-709b2fea15a20212c981506815ef6696_1440w.jpg)

上图所示，char\_d和指定对齐值最小值是1，因此char\_d放在结构体开始偏移地址为0处；

short\_e和指定对齐值最小值是2，因此short\_e放在结构体开始偏移地址为2处；

int\_f和指定对齐值最小值是4，因此int\_f放在结构体开始偏移地址为4处；

由上可已得到，结构体各成员相对于结构体首地址的偏移地址如下图：

![](https://pic3.zhimg.com/v2-a0b8a0c61a3c9516b4d91d26ce4ee4f6_1440w.jpg)

结构体总对齐字节大小为最大成员对齐值4和指定对齐值4最小值(也就是4)的整数倍，而此时内存中共占8个字节,正好是4的整数倍,所以此结构体的大小为8byte。
### 手动对齐
可以通过#program(n)指定对齐字节数(n必须是2的次方)
通常用于**特定协议通信**时打包结构体
```C
void UIDelete(referee_id_t *_id, uint8_t Del_Operate, uint8_t Del_Layer)

{

    static UI_delete_t UI_delete_data;  // pack(1) 的结构体

  

    // 逐字段填充

    UI_delete_data.FrameHeader.SOF = REFEREE_SOF;

    UI_delete_data.FrameHeader.DataLength = temp_datalength;

    ....

    // 直接取结构体地址，当成字节流发送！

    RefereeSend((uint8_t *)&UI_delete_data, LEN_HEADER + LEN_CMDID + temp_datalength + LEN_TAIL);

} //D:\Robomaster\OpenSource\YL\YL\basic_framework-master
```



---


## 算法

### 冒泡排序

```C
void Sort(int num[10], int n) //每次循环都确定一个元素（未排序中最大的）的位置
{
    for (int i = 0; i < n; i++) //代表已经确定的元素个数，循环次数
    {
        int swap = 0; //标记交换，若没有交换就直接退出
        for (int j = 0; j < n - i - 1; j++)//每次都要遍历未排序的元素，最后一次不用排序-1，已经确定的不用再排了-n
        {
            if (num[j] > num[j + 1])
            {
                int t;
                t = num[j];
                num[j] = num[j + 1];
                num[j + 1] = t;
                swap = 1;
            }
        }
        if (!swap) //若没有交换就直接退出
        {
            break;
        }
    }
}
```


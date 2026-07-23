const n=`# 快速平方根取倒数\r
\r
## 牛顿迭代\r
\r
迭代的次数和所需要的精度有所关系，所以求解的复杂度和精度相关。\r
\r
如何减少复杂度\r
\r
牛顿迭代算法\r
$$\r
x_n = x_{n-1} - \\frac{f(x_{n-1})}{f'(x_{n-1})}\r
$$\r
要求平方根的倒数，所以考虑函数 $f(x) = \\frac{1}{x^2} - a$\r
\r
由牛顿迭代算法可得 $ \\begin{align*} x_n &= x_{n-1} - \\frac{a x_{n-1}^3 - x_{n-1}}{2} \\\\ &= \\frac{3x_{n-1} - a x_{n-1}^3}{2} \\end{align*} $\r
\r
## 存储形式\r
\r
由于与计算机相关，需要先了解float32位浮点数的存储形式，同时需要知道魔数**IEEE754**\r
\r
\`\`\`mermaid\r
gantt\r
    title IEEE754 单精度浮点数(float32)存储结构\r
    dateFormat  X\r
    axisFormat %s\r
\r
    section Bit Field\r
    S :milestone, s, 0, 0\r
    S(1bit) :s1, 0, 1\r
    E(8bit) :e1, 1, 9\r
    M(23bit):m1, 9, 32\r
\r
    section Label\r
    S label :milestone, after s1, 0\r
    E label :milestone, after e1, 0\r
    M label :milestone, after m1, 0\r
\`\`\`\r
\r
- S是符号位，由于开平方，默认0，不必理会\r
- E表示阶码，由127的平移表示正负，因此E-127是阶码表示的实际值\r
- M表示尾码，表示原二进制浮点数第一个1之后的所有数位，可以认为隐藏了一个1，实际1.xxxxxxx。\r
\r
eg： x = 2.5 将其转化为这样的存储结构\r
\r
2.5(10)=10.1(2) 十进制转化为二进制\r
\r
二进制写成科学计数法	$10.1_{(2)} = 1.01 \\times 2^{1}$\r
\r
拆分三个字段（S / E / M）\r
\r
- 符号位 S（1bit）	正数，\\(S=\\boldsymbol{0}\\)\r
- 阶码 E（8bit，偏移量 127）   存储阶码 $(E = 1 + 127 = \\boldsymbol{128})$     128 二进制：\`10000000\`\r
- 尾数位 M（23bit，补齐尾部 0）     \\(M=01\\)，补足 23 位：01000000000000000000000\r
\r
\`\`\`\r
S      E           M\r
0 | 10000000 | 01000000000000000000000\r
\`\`\`\r
\r
\r
\r
## 算法\r
\r
类比熟知的十进制，可以将浮点数表示为：$y = \\left(1 + \\frac{M}{2^{23}}\\right) \\cdot 2^{E-127}$\r
\r
对于一个浮点数 $x = \\frac{1}{\\sqrt{a}}$  可以对其取对数\r
\r
$$ -\\frac{1}{2}\\log_2 a = -\\frac{1}{2}\\left[\\log_2\\left(1 + \\frac{M_a}{2^{23}}\\right) + E_a - 127\\right] $$\r
\r
可知$\\frac{M_a}{2^{23}} \\in (0,1)$ 所以$\\log_a(1+x) \\approx x + \\epsilon \\quad (\\epsilon \\text{ 为修正值})$\r
\r
得到\r
\r
$$ \\log_2 \\frac{1}{\\sqrt{a}} = -\\frac{1}{2}\\left( \\frac{M_a}{2^{23}} + E_a + \\epsilon - 127 \\right) $$ $$ \\log_2 \\frac{1}{\\sqrt{a}} = -\\frac{1}{2}\\left( \\frac{M_a + 2^{23}E_a}{2^{23}} + \\epsilon - 127 \\right) $$\r
\r
\r
\r
观察$M_a + 2^{23}E_a$ 根据浮点数的存储规则，这部分就是浮点数a强制转化为整数后的表示，这个部分称为Xa ， X和a分别表示联立\r
\r
$$ \\begin{cases} \\log_2 \\dfrac{1}{\\sqrt{a}} = -\\dfrac{1}{2}\\left( \\dfrac{X_a}{2^{23}} + \\epsilon - 127 \\right) \\\\[6pt] \\log_2 x = \\dfrac{X_x}{2^{23}} + \\epsilon - 127 \\end{cases} $$\r
\r
化简得到\r
\r
$$ \\frac{X_x}{2^{23}} + \\epsilon - 127 = -\\frac{1}{2}\\left( \\frac{X_a}{2^{23}} + \\epsilon - 127 \\right) $$ $$ X_x = (381 + \\epsilon)2^{23} - \\frac{1}{2}X_a $$\r
\r
\r
\r
为了修正这个值，使得误差更小，让其在0到1这个区间内的均值为0\r
\r
$$ \\begin{align*} \\int_{0}^{1}\\log_2(1+x)dx - (x+\\epsilon)dx &= 0 \\\\ \\int_{0}^{1}\\log_2(1+x)dx - \\int_{0}^{1}(x+\\epsilon)dx &= 0 \\\\ \\int_{0}^{1}\\log_2(1+x)dx &= \\int_{0}^{1}(x+\\epsilon)dx \\\\ \\frac{1}{\\ln 2}\\int_{1}^{2}\\ln u\\,du &= \\frac{1}{2}+\\epsilon \\\\ \\frac{1}{\\ln 2}\\left(2\\ln 2 - 1\\right) &= \\frac{1}{2}+\\epsilon \\\\ 2 - \\frac{1}{\\ln 2} &= \\frac{1}{2}+\\epsilon \\\\ \\epsilon &= \\frac{3}{2} - \\frac{1}{\\ln 2} \\end{align*} $$\r
\r
将$2^{22} \\times (381 - \\epsilon)$十六进制编码为**0x5f3c551d**，这就是这个算法中的魔数，最后进行一次牛顿迭代\r
\r
\`\`\`c\r
float Q_rsqrt( float number )\r
{\r
    long i;\r
    float x2, y;\r
    const float threehalfs = 1.5F;\r
    x2 = number * 0.5F;\r
    y  = number;\r
    i  = * ( long * ) &y;                       // evil floating point bit level hacking\r
    i  = 0x5f3759df - ( i >> 1 );               // what the fuck?\r
    y  = * ( float * ) &i;\r
    y  = y * ( threehalfs - ( x2 * y * y ) );   // 1st iteration\r
//    y  = y * ( threehalfs - ( x2 * y * y ) );   // 2nd iteration, this can be removed\r
    return y;\r
}\r
\`\`\`\r
\r
`;export{n as default};

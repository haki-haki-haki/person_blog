const r=`# user_lib\r
\r
## 限幅\r
\r
主要是语法\r
\r
\`\`\`c\r
#define VAL_LIMIT(val, min, max) \\\r
    do                           \\\r
    {                            \\\r
        if ((val) <= (min))      \\\r
        {                        \\\r
            (val) = (min);       \\\r
        }                        \\\r
        else if ((val) >= (max)) \\\r
        {                        \\\r
            (val) = (max);       \\\r
        }                        \\\r
    } while(0)\r
\`\`\`\r
\r
while的运用符合语法规则\r
\r
\r
\r
## 快速开方 牛顿迭代\r
\r
\`\`\`c\r
float Sqrt(float x)\r
{\r
    float y;\r
    float delta;\r
    float maxError;\r
    if (x <= 0)\r
    {\r
        return 0;\r
    }\r
    // initial guess\r
    y = x / 2;\r
    // refine\r
    maxError = x * 0.001f;\r
    do\r
    {\r
        delta = (y * y) - x;\r
        y -= delta / (2 * y);\r
    } while (delta > maxError || delta < -maxError);\r
    return y;\r
}\r
\`\`\`\r
\r
先猜测，再根据差值计算\r
$$\r
\r
y_{n+1} = y_n - \\frac{f(y_n)}{f'(y_n)}\r\r
$$\r
平方根形式\r
$$\r
\r
y_{n+1} = y_n - \\frac{y_n^2 - x}{2y_n}\r\r
$$\r
\r
\r
## 开方倒数\r
\r
\`\`\`c\r
float invSqrt(float num)\r
{\r
    float halfnum = 0.5f * num;\r
    float y = num;\r
    long i = *(long *)&y;\r
    i = 0x5f375a86- (i >> 1);\r
    y = *(float *)&i;\r
    y = y * (1.5f - (halfnum * y * y));\r
    return y;\r
}\r
\`\`\`\r
\r
证明参考   https://www.cnblogs.com/MeltingPot/p/19165461\r
\r
\r
\r
## 斜坡函数\r
\r
累加实现\r
\r
\`\`\`c\r
typedef struct\r
{\r
    float input;        //输入数据\r
    float out;          //输出数据\r
    float min_value;    //限幅最小值\r
    float max_value;    //限幅最大值\r
    float frame_period; //时间间隔\r
} ramp_function_source_t;\r
\`\`\`\r
\r
初始化省略\r
\r
\`\`\`c\r
float ramp_calc(ramp_function_source_t *ramp_source_type, float input)\r
{\r
    ramp_source_type->input = input;\r
    ramp_source_type->out += ramp_source_type->input * ramp_source_type->frame_period;\r
    if (ramp_source_type->out > ramp_source_type->max_value)\r
    {\r
        ramp_source_type->out = ramp_source_type->max_value;\r
    }\r
    else if (ramp_source_type->out < ramp_source_type->min_value)\r
    {\r
        ramp_source_type->out = ramp_source_type->min_value;\r
    }\r
    return ramp_source_type->out;\r
}\r
\`\`\`\r
\r
\r
\r
## 循环限幅函数\r
\r
相位，角度常用 全部转化为一个区间内 如加减2Π\r
\r
\`\`\`c\r
float loop_float_constrain(float Input, float minValue, float maxValue)\r
{\r
    if (maxValue < minValue)\r
    {\r
        return Input;\r
    }\r
\r
    if (Input > maxValue)\r
    {\r
        float len = maxValue - minValue;\r
        while (Input > maxValue)\r
        {\r
            Input -= len;\r
        }\r
    }\r
    else if (Input < minValue)\r
    {\r
        float len = maxValue - minValue;\r
        while (Input < minValue)\r
        {\r
            Input += len;\r
        }\r
    }\r
    return Input;\r
}\r
\`\`\`\r
\r
\r
\r
## 最小二乘法拟合\r
\r
结构体\r
\r
\`\`\`c\r
typedef __packed struct\r
{\r
    uint16_t Order;\r
    uint32_t Count;\r
    float *x;\r
    float *y;\r
    float k;\r
    float b;\r
    float StandardDeviation;\r
    float t[4];\r
} Ordinary_Least_Squares_t;\r
\`\`\`\r
\r
初始化\r
\r
\`\`\`c\r
void OLS_Init(Ordinary_Least_Squares_t *OLS, uint16_t order)\r
{\r
    OLS->Order = order;\r
    OLS->Count = 0;\r
    OLS->x = (float *)user_malloc(sizeof(float) * order);\r
    OLS->y = (float *)user_malloc(sizeof(float) * order);\r
    OLS->k = 0;\r
    OLS->b = 0;\r
    memset((void *)OLS->x, 0, sizeof(float) * order);\r
    memset((void *)OLS->y, 0, sizeof(float) * order);\r
    memset((void *)OLS->t, 0, sizeof(float) * 4);\r
}\r
\`\`\`\r
\r
开辟空间 得到数组\r
\r
\r
\r
返回斜率/微分\r
\r
\`\`\`c\r
float OLS_Derivative(Ordinary_Least_Squares_t *OLS, float deltax, float y)\r
{\r
    static float temp = 0;\r
    temp = OLS->x[1];\r
    for (uint16_t i = 0; i < OLS->Order - 1; ++i)\r
    {\r
        OLS->x[i] = OLS->x[i + 1] - temp;\r
        OLS->y[i] = OLS->y[i + 1];\r
    }\r
    OLS->x[OLS->Order - 1] = OLS->x[OLS->Order - 2] + deltax;\r
    OLS->y[OLS->Order - 1] = y;\r
\r
    if (OLS->Count < OLS->Order)\r
    {\r
        OLS->Count++;\r
    }\r
\r
    memset((void *)OLS->t, 0, sizeof(float) * 4);\r
    for (uint16_t i = OLS->Order - OLS->Count; i < OLS->Order; ++i)\r
    {\r
        OLS->t[0] += OLS->x[i] * OLS->x[i];\r
        OLS->t[1] += OLS->x[i];\r
        OLS->t[2] += OLS->x[i] * OLS->y[i];\r
        OLS->t[3] += OLS->y[i];\r
    }\r
\r
    OLS->k = (OLS->t[2] * OLS->Order - OLS->t[1] * OLS->t[3]) / (OLS->t[0] * OLS->Order - OLS->t[1] * OLS->t[1]);\r
\r
    OLS->StandardDeviation = 0;\r
    for (uint16_t i = OLS->Order - OLS->Count; i < OLS->Order; ++i)\r
    {\r
        OLS->StandardDeviation += fabsf(OLS->k * OLS->x[i] + OLS->b - OLS->y[i]);\r
    }\r
    OLS->StandardDeviation /= OLS->Order;\r
\r
    return OLS->k;\r
}\r
\`\`\`\r
\r
返回预测 平滑值\r
\r
\`\`\`c\r
float OLS_Smooth(Ordinary_Least_Squares_t *OLS, float deltax, float y)\r
{\r
    static float temp = 0;\r
    temp = OLS->x[1];\r
    for (uint16_t i = 0; i < OLS->Order - 1; ++i)\r
    {\r
        OLS->x[i] = OLS->x[i + 1] - temp;\r
        OLS->y[i] = OLS->y[i + 1];\r
    }\r
    OLS->x[OLS->Order - 1] = OLS->x[OLS->Order - 2] + deltax;\r
    OLS->y[OLS->Order - 1] = y;\r
\r
    if (OLS->Count < OLS->Order)\r
    {\r
        OLS->Count++;\r
    }\r
\r
    memset((void *)OLS->t, 0, sizeof(float) * 4);\r
    for (uint16_t i = OLS->Order - OLS->Count; i < OLS->Order; ++i)\r
    {\r
        OLS->t[0] += OLS->x[i] * OLS->x[i];\r
        OLS->t[1] += OLS->x[i];\r
        OLS->t[2] += OLS->x[i] * OLS->y[i];\r
        OLS->t[3] += OLS->y[i];\r
    }\r
\r
    OLS->k = (OLS->t[2] * OLS->Order - OLS->t[1] * OLS->t[3]) / (OLS->t[0] * OLS->Order - OLS->t[1] * OLS->t[1]);\r
    OLS->b = (OLS->t[0] * OLS->t[3] - OLS->t[1] * OLS->t[2]) / (OLS->t[0] * OLS->Order - OLS->t[1] * OLS->t[1]);\r
\r
    OLS->StandardDeviation = 0;\r
    for (uint16_t i = OLS->Order - OLS->Count; i < OLS->Order; ++i)\r
    {\r
        OLS->StandardDeviation += fabsf(OLS->k * OLS->x[i] + OLS->b - OLS->y[i]);\r
    }\r
    OLS->StandardDeviation /= OLS->Order;\r
\r
    return OLS->k * OLS->x[OLS->Order - 1] + OLS->b;\r
}\r
\`\`\`\r
\r
\r
\r
demo\r
\r
\`\`\`c\r
Ordinary_Least_Squares_t ols;\r
OLS_Init(&ols, 8);\r
float dt = 0.001f;\r
\r
// 1ms定时器内执行，输入原始带噪声角度\r
float raw_angle = encoder_get_angle();\r
float smooth_angle = OLS_Smooth(&ols, dt, raw_angle);\r
\r
// 随时获取角速度，不用重复计算\r
float speed = Get_OLS_Derivative(&ols);\r
\`\`\`\r
\r
\r
\r
## 其他\r
\r
绝对值 符号函数 限幅函数 死区函数 角度格式化  四舍五入 等不再赘述`;export{r as default};

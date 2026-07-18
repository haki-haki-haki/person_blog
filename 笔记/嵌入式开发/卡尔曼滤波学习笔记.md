# 卡尔曼滤波学习笔记

## 协方差

* 描述随机变量之间的线性关系 cov(x,y)>0 线性相关 =0 线性 *

$(x_i-E(x))-(y_i-E(y)) $

$cov(x,y) = \frac{\sum_{i=1}^{n} (x_i - E(x))(y_i - E(y))}{n}$

### 协方差矩阵

$$ \boldsymbol{\Sigma} = \begin{bmatrix} \mathrm{Cov}(X_1,X_1) & \mathrm{Cov}(X_1,X_2) & \dots & \mathrm{Cov}(X_1,X_p) \\ \mathrm{Cov}(X_2,X_1) & \mathrm{Cov}(X_2,X_2) & \dots & \mathrm{Cov}(X_2,X_p) \\ \vdots & \vdots & \ddots & \vdots \\ \mathrm{Cov}(X_p,X_1) & \mathrm{Cov}(X_p,X_2) & \dots & \mathrm{Cov}(X_p,X_p) \end{bmatrix} $$

*eg 二维协方差矩阵*

$$ \boldsymbol{\Sigma} = \begin{bmatrix} \mathrm{Cov}(X_1,X_1) & \mathrm{Cov}(X_1,X_2)   \\ \mathrm{Cov}(X_2,X_1) & \mathrm{Cov}(X_2,X_2)  \end{bmatrix} $$   

*斜对角：方差 描述样本单个维度之间的离散量 **

*非斜对角变量  描述不同维度之间的线性关系*



## 卡尔曼滤波器

### 状态空间模型

#### 过程噪声

*模型的不确定性*

#### 测量噪声

*测量的误差导致*

### 5个核心公式

*先验估计 -> 先验误差协方差 -> 卡尔曼增益 -> 后验估计 -> 后验误差协方差 *

#### 后验估计公式 *核心思想 ： 最优平均加权*

*公式推导*   $X_k = \frac{Z_1+Z_2+Z_3+\cdots+Z_k}{K} \\ =\frac{1}{k}(Z_1+Z_2+Z_3+\cdots+Z_(k-1))+\frac{1}{k}Z_k // \frac{1}{k}\frac{k-1}{k-1}(Z_1+Z_2+Z_3+\cdots+\cdots+Z_(k-1))+\frac{1}{k}Z_K // $

*将前件放大为k-1次的预测值*

$X_k = \frac{k-1}{k}X_(k-1)+\frac{1}{k}Z+k \\ = X_(k-1)-\frac{1}{k}X_(k-1)+\frac{1}{k}Z_k \\ = X_(k-1) + \frac{1}{k}(Z_k - X_{k-1}) $  **当k 迭代次数越来越多的时候 测试数据占比非常小 X_K取决于前一次预测值**

*迭代过程*

计算卡尔曼增益 计算当前的预测值 更新测量误差
$$
K_k = \frac{e_(est)_(k-1)}{e_(est)_(k-1)+e_(mea)_k} \\ X_k = X_(K-1)e_(est)_(k-1)+K_k(Z_k+X_(k-1)) // e_(est_k) = (1-K_k)e_{est_{k-1}}
$$

#### 状态空间方程

$X_k = AX_{k-1} + Bu_{k-1} + W_{k-1} $
$$
X_K状态变量 \\
U_{K-1}控制输入的影响 \\
w_{k-1}过程噪声 \\
W \sim \mathcal{N}(0, Q) \quad : \text{过程噪声（模型不确定性）}
$$


#### 观测方程

$Z_k = HX_k +V_k$  **乘以H的转置矩阵放入后验估计的后件**
$$
H 观测矩阵 \\
V_K 测量噪声 \\
V \sim \mathcal{N}(0, R) \quad : \text{观测噪声（测量误差）}
$$

$$

$$

<img src="C:\Users\欧俊\AppData\Roaming\Typora\typora-user-images\image-20260505165759149.png" alt="image-20260505165759149" style="zoom:50%;" />



#### 先验估计

*将运动状态的过程噪声删除*

$X_k = AX_{k-1} + Bu_{k-1} $

#### 后验估计值

*前一时刻额后验估计值与当前时刻的先验估计值的一个数据融合 要求：方差最小*

#### 卡尔曼增益

目标：让最终估计的误差方差最小。

1. 定义误差   预测误差：$e_k^- = x_k - \hat{x}_k^-$，其协方差为 $P_k^- = \mathrm{Cov}(e_k^-)$   观测误差：$e_{z,k} = z_k - Hx_k$，其协方差为 $R$ 
2. 估计误差   $$ e_k = x_k - \hat{x}_k = (I-K_kH)e_k^- - K_kv_k $$ 估计误差的协方差为： $$ P_k = \mathrm{Cov}(e_k) = (I-K_kH)P_k^-(I-K_kH)^T + K_kRK_k^T $$ 
3. 对 $K_k$ 求导找最小值   对 $P_k$ 关于 $K_k$ 求导并令导数为 0，解得： $$ K_k = P_k^- H^T \left( H P_k^- H^T + R \right)^{-1} $$ 这就是卡尔曼增益的标准公式。

#### 估计误差协方差更新方程

$$ P_k = (I - K_k H) P_k^- $$



## 卡尔曼滤波代码

### 一阶卡尔曼滤波

```c
// 一维卡尔曼滤波（最精简版，严格5个公式）
typedef struct {
    float x_hat;  // 估计状态
    float P;      // 估计误差协方差
    float A;      // 状态转移
    float H;      // 观测矩阵
    float Q;      // 过程噪声
    float R;      // 观测噪声
} Kalman1D;

// 卡尔曼滤波：输入观测值 z，输出最优估计
float Kalman1D_Update(Kalman1D *k, float z)
{
    // 1. 预测状态
    float x_pre = k->A * k->x_hat;

    // 2. 预测协方差
    float P_pre = k->A * k->P * k->A + k->Q;

    // 3. 卡尔曼增益（核心）
    float K = P_pre * k->H / (k->H * P_pre * k->H + k->R);

    // 4. 更新状态（融合观测）
    k->x_hat = x_pre + K * (z - k->H * x_pre);

    // 5. 更新协方差（最后一步）
    k->P = (1 - K * k->H) * P_pre;

    return k->x_hat;
}

// 初始化例子
Kalman1D kf;

void Kalman_Init(void)
{
    kf.x_hat = 0;    // 初始状态
    kf.P    = 1;     // 初始协方差
    kf.A    = 1;     // 一维恒值模型（最常用）
    kf.H    = 1;     // 观测矩阵
    kf.Q    = 0.01f; // 过程噪声（越小越信任模型）
    kf.R    = 0.1f;  // 观测噪声（越小越信任传感器）
}


```



### 二阶卡尔曼滤波

```c
typedef struct
{
    // 状态向量 [位置, 速度]
    float pos;   // 位置估计 x1
    float vel;   // 速度估计 x2

    // 误差协方差矩阵 P 2×2
    float P11, P12;
    float P21, P22;

    // 系统参数
    float dt;    // 采样时间
    float Q;     // 过程噪声(加速度噪声)
    float R;     // 观测噪声(位置测量噪声)
} Kalman2D;

// 初始化二维卡尔曼 位置+速度
void Kalman2D_Init(Kalman2D *kf, float dt)
{
    kf->dt = dt;

    // 初始状态
    kf->pos = 0.0f;
    kf->vel = 0.0f;

    // 初始协方差 P
    kf->P11 = 1.0f;  kf->P12 = 0.0f;
    kf->P21 = 0.0f;  kf->P22 = 1.0f;

    // 噪声调参
    kf->Q = 0.05f;
    kf->R = 0.2f;
}

// z：当前位置观测值
void Kalman2D_Update(Kalman2D *kf, float z)
{
    float dt = kf->dt;
    float Q  = kf->Q;
    float R  = kf->R;

    // ========== 1. 状态预测（第1公式）==========
    float pos_pre = kf->pos + kf->vel * dt;
    float vel_pre = kf->vel;

    // ========== 2. 协方差预测（第2公式）==========
    float p11_pre = kf->P11 + kf->P12*dt + (kf->P21 + kf->P22*dt)*dt + 0.5f*0.5f*dt*dt*dt*dt*Q;
    float p12_pre = kf->P12 + kf->P22*dt + 0.5f*dt*dt*dt*Q;
    float p21_pre = p12_pre;
    float p22_pre = kf->P22 + dt*dt*Q;

    // ========== 3. 卡尔曼增益（第3公式）==========
    float S = p11_pre + R;
    float K1 = p11_pre / S;
    float K2 = p21_pre / S;

    // ========== 4. 状态更新（第4公式）==========
    float residual = z - pos_pre;
    kf->pos = pos_pre + K1 * residual;
    kf->vel = vel_pre + K2 * residual;

    // ========== 5. 协方差更新（第5公式）==========
    kf->P11 = (1 - K1) * p11_pre;
    kf->P12 = (1 - K1) * p12_pre;
    kf->P21 = (1 - K2) * p21_pre;
    kf->P22 = (1 - K2) * p22_pre;
}

// 1. 定义变量
Kalman2D kf;

// 2. 初始化 采样周期0.1s
Kalman2D_Init(&kf, 0.1f);

// 3. 每周期调用一次
float measure_pos = 20.5f;   // 传感器读到的位置
Kalman2D_Update(&kf, measure_pos);

// 输出滤波结果
float filter_pos = kf.pos;
float filter_vel = kf.vel;
```


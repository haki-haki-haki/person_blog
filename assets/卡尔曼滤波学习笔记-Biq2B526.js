const r=`# 卡尔曼滤波学习笔记\r
\r
## 协方差\r
\r
* 描述随机变量之间的线性关系 cov(x,y)>0 线性相关 =0 线性 *\r
\r
$(x_i-E(x))-(y_i-E(y)) $\r
\r
$cov(x,y) = \\frac{\\sum_{i=1}^{n} (x_i - E(x))(y_i - E(y))}{n}$\r
\r
### 协方差矩阵\r
\r
$$ \\boldsymbol{\\Sigma} = \\begin{bmatrix} \\mathrm{Cov}(X_1,X_1) & \\mathrm{Cov}(X_1,X_2) & \\dots & \\mathrm{Cov}(X_1,X_p) \\\\ \\mathrm{Cov}(X_2,X_1) & \\mathrm{Cov}(X_2,X_2) & \\dots & \\mathrm{Cov}(X_2,X_p) \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ \\mathrm{Cov}(X_p,X_1) & \\mathrm{Cov}(X_p,X_2) & \\dots & \\mathrm{Cov}(X_p,X_p) \\end{bmatrix} $$\r
\r
*eg 二维协方差矩阵*\r
\r
$$ \\boldsymbol{\\Sigma} = \\begin{bmatrix} \\mathrm{Cov}(X_1,X_1) & \\mathrm{Cov}(X_1,X_2)   \\\\ \\mathrm{Cov}(X_2,X_1) & \\mathrm{Cov}(X_2,X_2)  \\end{bmatrix} $$   \r
\r
*斜对角：方差 描述样本单个维度之间的离散量 **\r
\r
*非斜对角变量  描述不同维度之间的线性关系*\r
\r
\r
\r
## 卡尔曼滤波器\r
\r
### 状态空间模型\r
\r
#### 过程噪声\r
\r
*模型的不确定性*\r
\r
#### 测量噪声\r
\r
*测量的误差导致*\r
\r
### 5个核心公式\r
\r
*先验估计 -> 先验误差协方差 -> 卡尔曼增益 -> 后验估计 -> 后验误差协方差 *\r
\r
#### 后验估计公式 *核心思想 ： 最优平均加权*\r
\r
*公式推导*   $X_k = \\frac{Z_1+Z_2+Z_3+\\cdots+Z_k}{K} \\\\ =\\frac{1}{k}(Z_1+Z_2+Z_3+\\cdots+Z_(k-1))+\\frac{1}{k}Z_k // \\frac{1}{k}\\frac{k-1}{k-1}(Z_1+Z_2+Z_3+\\cdots+\\cdots+Z_(k-1))+\\frac{1}{k}Z_K // $\r
\r
*将前件放大为k-1次的预测值*\r
\r
$X_k = \\frac{k-1}{k}X_(k-1)+\\frac{1}{k}Z+k \\\\ = X_(k-1)-\\frac{1}{k}X_(k-1)+\\frac{1}{k}Z_k \\\\ = X_(k-1) + \\frac{1}{k}(Z_k - X_{k-1}) $  **当k 迭代次数越来越多的时候 测试数据占比非常小 X_K取决于前一次预测值**\r
\r
*迭代过程*\r
\r
计算卡尔曼增益 计算当前的预测值 更新测量误差\r
$$\r
K_k = \\frac{e_(est)_(k-1)}{e_(est)_(k-1)+e_(mea)_k} \\\\ X_k = X_(K-1)e_(est)_(k-1)+K_k(Z_k+X_(k-1)) // e_(est_k) = (1-K_k)e_{est_{k-1}}\r
$$\r
\r
#### 状态空间方程\r
\r
$X_k = AX_{k-1} + Bu_{k-1} + W_{k-1} $\r
$$\r
X_K状态变量 \\\\\r
U_{K-1}控制输入的影响 \\\\\r
w_{k-1}过程噪声 \\\\\r
W \\sim \\mathcal{N}(0, Q) \\quad : \\text{过程噪声（模型不确定性）}\r
$$\r
\r
\r
#### 观测方程\r
\r
$Z_k = HX_k +V_k$  **乘以H的转置矩阵放入后验估计的后件**\r
$$\r
H 观测矩阵 \\\\\r
V_K 测量噪声 \\\\\r
V \\sim \\mathcal{N}(0, R) \\quad : \\text{观测噪声（测量误差）}\r
$$\r
\r
$$\r
\r
$$\r
\r
![卡尔曼滤波协方差示意图](/person_blog/notes-images/imported/kalman-covariance.png)\r
\r
\r
\r
#### 先验估计\r
\r
*将运动状态的过程噪声删除*\r
\r
$X_k = AX_{k-1} + Bu_{k-1} $\r
\r
#### 后验估计值\r
\r
*前一时刻额后验估计值与当前时刻的先验估计值的一个数据融合 要求：方差最小*\r
\r
#### 卡尔曼增益\r
\r
目标：让最终估计的误差方差最小。\r
\r
1. 定义误差   预测误差：$e_k^- = x_k - \\hat{x}_k^-$，其协方差为 $P_k^- = \\mathrm{Cov}(e_k^-)$   观测误差：$e_{z,k} = z_k - Hx_k$，其协方差为 $R$ \r
2. 估计误差   $$ e_k = x_k - \\hat{x}_k = (I-K_kH)e_k^- - K_kv_k $$ 估计误差的协方差为： $$ P_k = \\mathrm{Cov}(e_k) = (I-K_kH)P_k^-(I-K_kH)^T + K_kRK_k^T $$ \r
3. 对 $K_k$ 求导找最小值   对 $P_k$ 关于 $K_k$ 求导并令导数为 0，解得： $$ K_k = P_k^- H^T \\left( H P_k^- H^T + R \\right)^{-1} $$ 这就是卡尔曼增益的标准公式。\r
\r
#### 估计误差协方差更新方程\r
\r
$$ P_k = (I - K_k H) P_k^- $$\r
\r
\r
\r
## 卡尔曼滤波代码\r
\r
### 一阶卡尔曼滤波\r
\r
\`\`\`c\r
// 一维卡尔曼滤波（最精简版，严格5个公式）\r
typedef struct {\r
    float x_hat;  // 估计状态\r
    float P;      // 估计误差协方差\r
    float A;      // 状态转移\r
    float H;      // 观测矩阵\r
    float Q;      // 过程噪声\r
    float R;      // 观测噪声\r
} Kalman1D;\r
\r
// 卡尔曼滤波：输入观测值 z，输出最优估计\r
float Kalman1D_Update(Kalman1D *k, float z)\r
{\r
    // 1. 预测状态\r
    float x_pre = k->A * k->x_hat;\r
\r
    // 2. 预测协方差\r
    float P_pre = k->A * k->P * k->A + k->Q;\r
\r
    // 3. 卡尔曼增益（核心）\r
    float K = P_pre * k->H / (k->H * P_pre * k->H + k->R);\r
\r
    // 4. 更新状态（融合观测）\r
    k->x_hat = x_pre + K * (z - k->H * x_pre);\r
\r
    // 5. 更新协方差（最后一步）\r
    k->P = (1 - K * k->H) * P_pre;\r
\r
    return k->x_hat;\r
}\r
\r
// 初始化例子\r
Kalman1D kf;\r
\r
void Kalman_Init(void)\r
{\r
    kf.x_hat = 0;    // 初始状态\r
    kf.P    = 1;     // 初始协方差\r
    kf.A    = 1;     // 一维恒值模型（最常用）\r
    kf.H    = 1;     // 观测矩阵\r
    kf.Q    = 0.01f; // 过程噪声（越小越信任模型）\r
    kf.R    = 0.1f;  // 观测噪声（越小越信任传感器）\r
}\r
\r
\r
\`\`\`\r
\r
\r
\r
### 二阶卡尔曼滤波\r
\r
\`\`\`c\r
typedef struct\r
{\r
    // 状态向量 [位置, 速度]\r
    float pos;   // 位置估计 x1\r
    float vel;   // 速度估计 x2\r
\r
    // 误差协方差矩阵 P 2×2\r
    float P11, P12;\r
    float P21, P22;\r
\r
    // 系统参数\r
    float dt;    // 采样时间\r
    float Q;     // 过程噪声(加速度噪声)\r
    float R;     // 观测噪声(位置测量噪声)\r
} Kalman2D;\r
\r
// 初始化二维卡尔曼 位置+速度\r
void Kalman2D_Init(Kalman2D *kf, float dt)\r
{\r
    kf->dt = dt;\r
\r
    // 初始状态\r
    kf->pos = 0.0f;\r
    kf->vel = 0.0f;\r
\r
    // 初始协方差 P\r
    kf->P11 = 1.0f;  kf->P12 = 0.0f;\r
    kf->P21 = 0.0f;  kf->P22 = 1.0f;\r
\r
    // 噪声调参\r
    kf->Q = 0.05f;\r
    kf->R = 0.2f;\r
}\r
\r
// z：当前位置观测值\r
void Kalman2D_Update(Kalman2D *kf, float z)\r
{\r
    float dt = kf->dt;\r
    float Q  = kf->Q;\r
    float R  = kf->R;\r
\r
    // ========== 1. 状态预测（第1公式）==========\r
    float pos_pre = kf->pos + kf->vel * dt;\r
    float vel_pre = kf->vel;\r
\r
    // ========== 2. 协方差预测（第2公式）==========\r
    float p11_pre = kf->P11 + kf->P12*dt + (kf->P21 + kf->P22*dt)*dt + 0.5f*0.5f*dt*dt*dt*dt*Q;\r
    float p12_pre = kf->P12 + kf->P22*dt + 0.5f*dt*dt*dt*Q;\r
    float p21_pre = p12_pre;\r
    float p22_pre = kf->P22 + dt*dt*Q;\r
\r
    // ========== 3. 卡尔曼增益（第3公式）==========\r
    float S = p11_pre + R;\r
    float K1 = p11_pre / S;\r
    float K2 = p21_pre / S;\r
\r
    // ========== 4. 状态更新（第4公式）==========\r
    float residual = z - pos_pre;\r
    kf->pos = pos_pre + K1 * residual;\r
    kf->vel = vel_pre + K2 * residual;\r
\r
    // ========== 5. 协方差更新（第5公式）==========\r
    kf->P11 = (1 - K1) * p11_pre;\r
    kf->P12 = (1 - K1) * p12_pre;\r
    kf->P21 = (1 - K2) * p21_pre;\r
    kf->P22 = (1 - K2) * p22_pre;\r
}\r
\r
// 1. 定义变量\r
Kalman2D kf;\r
\r
// 2. 初始化 采样周期0.1s\r
Kalman2D_Init(&kf, 0.1f);\r
\r
// 3. 每周期调用一次\r
float measure_pos = 20.5f;   // 传感器读到的位置\r
Kalman2D_Update(&kf, measure_pos);\r
\r
// 输出滤波结果\r
float filter_pos = kf.pos;\r
float filter_vel = kf.vel;\r
\`\`\`\r
\r
`;export{r as default};

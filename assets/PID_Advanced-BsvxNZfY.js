const r=`# PID_Advanced\r
\r
## 控制系统\r
\r
\`\`\`mermaid\r
flowchart LR\r
    %% 设定值支路（正输入）\r
    SP[设定值<br>Set Point<br>SP] -->|+| SUM((Σ))\r
    %% 反馈支路（负输入，对应原图减号）\r
    Y[系统输出<br>System Output<br>Y] -->|-| SUM\r
\r
    SUM -- 误差<br>Error<br>err --> CTRL[控制器]\r
    CTRL -- 控制器输出<br>Controller Output<br>CO --> PLANT[被控对象]\r
    PLANT --> Y\r
\r
    %% 注释：负反馈说明\r
    note["负反馈运算：err = SP - Y"]\r
\`\`\`\r
\r
指标：\r
\r
- 稳：受到干扰能够回归到稳态\r
- 准：稳态值偏离设定值小\r
- 快：达到稳态的速度\r
\r
## 电机建模\r
\r
### 电机化学方程\r
\r
> 图示：电机电枢等效电路（电感 $L_a$、电阻 $R_a$、反电动势 $K_e \\omega(t)$）\r
$$\r
\\frac{d i_a(t)}{dt} + R_a i_a(t) = u_a(t) - K_e \\omega(t)\r
$$\r
$(L_a)$：电枢电感，$(R_a)$：电枢电阻\r
\r
$(i_a(t))$：电枢电流，$(u_a(t))$：电枢输入电压\r
\r
$(K_e)$：反电动势系数，$(\\omega(t))$：电机机械角速度\r
\r
$(K_e \\omega(t))$ 为电机转动产生的反电动势\r
\r
\r
\r
### 电机机械方程\r
\r
> 图示：电机机械模型（转动惯量 $J$、粘性摩擦 $B$、电磁转矩 $K_t i_a$、负载转矩 $T_L$）\r
$$\r
J \\frac{d\\omega(t)}{dt} + B \\omega(t) = K_t i_a(t) - T_L\r
$$\r
J：电机转轴总转动惯量\r
\r
B：粘性摩擦阻尼系数\r
\r
$(\\omega(t))$：电机机械角速度\r
\r
$(K_t)$：电机转矩系数\r
\r
$(i_a(t))$：电枢电流（电磁转矩 $(T_e=K_t i_a)）$\r
\r
$(T_L)$：外部负载转矩 一般是空载\r
\r
\r
\r
### 拉普拉斯变换\r
\r
$$\r
\\mathcal{L}\\left[f(t)\\right] = F(s)\r
\\\\\r
\\mathcal{L}\\left[f'(t)\\right] = sF(s)\r
\\\\\r
\\mathcal{L}\\left[\\int f(t) dt\\right] = \\frac{1}{s}F(s)\r
$$\r
\r
\r
\r
\r
\r
电化学方程\r
$$\r
\\mathcal{L}\\left[ L_a \\frac{d i_a(t)}{dt} + R_a i_a(t) \\right] = \\mathcal{L}\\left[ u_a(t) - K_e \\omega(t) \\right]\r
\\\\\r
L_a \\cdot \\mathcal{L}\\left[ \\frac{d i_a(t)}{dt} \\right] + R_a \\cdot \\mathcal{L}\\left[ i_a(t) \\right] = \\mathcal{L}\\left[ u_a(t) \\right] - K_e \\mathcal{L}\\left[ \\omega(t) \\right]\r
\\\\\r
\\left(L_a s + R_a\\right) I_a(s) = U_a(s) - K_e \\omega(s)\r
$$\r
机械方程\r
$$\r
\\mathcal{L}\\left[ J \\frac{d\\omega(t)}{dt} + B \\omega(t) \\right] = \\mathcal{L}\\left[ K_t i_a(t) \\right] - T_L\r
\\\\\r
J \\cdot \\mathcal{L}\\left[ \\frac{d\\omega(t)}{dt} \\right] + B \\cdot \\mathcal{L}\\left[ \\omega(t) \\right] = K_t \\mathcal{L}\\left[ i_a(t) \\right] - T_L\r
\\\\\r
\\left(J s + B\\right) \\omega(s) = K_t I_a(s) - T_L\r
$$\r
\r
\r
### 传递函数__结构图化简\r
\r
输入：电压 			输出：角速度\r
\r
> 图示：电机传递函数结构图化简（输入电压 → 输出角速度）\r
$$\r
\\begin{cases}\r
(L_a s + R_a) I_a(s) \\triangleq U_a(s) - K_e \\omega(s) \\quad  \\\\\r
(J s + B) \\omega(s) = K_t I_a(s) - T_L \\quad \r
\\end{cases}\r
$$\r
化简过程如下：\r
$$\r
I_a(s) = \\frac{Js + B}{K_t} \\omega(s)\r
\\\\\r
(L_a s + R_a)\\frac{Js + B}{K_t}\\omega(s) = U_a(s) - K_e \\omega(s)\r
\\\\\r
\\frac{(L_a s + R_a)(Js + B) + K_t K_e}{K_t}\\omega(s) = U_a(s)\r
\\\\\r
\\frac{\\omega(s)}{U_a(s)} = \\frac{K_t}{(L_a s + R_a)(Js + B) + K_t K_e}\r
$$\r
> 图示：传递函数最终化简结果\r
\r
传递函数：\r
$$\r
\\frac{k_t}{(L_a s + R_a)(J s + B) + k_t k_e}\r
$$\r
\r
\r
\r
## 倒立摆\r
\r
### 串级PID\r
\r
#### 内外环\r
\r
##### 响应快的量做内环，响应慢的量做外环\r
\r
角速度 $(\\dot\\theta)$：陀螺仪直接测量，毫秒级就能变化，动态响应极快 → **内环**\r
\r
角度 $(\\theta)$：角度是角速度积分出来的，变化平缓、惯性大、响应慢 → **外环**\r
\r
内环负责**快速抑制扰动**（角速度微小波动、电机力矩干扰），带宽更高、调节更快；外环负责**稳态精度**（把角度稳定在 0），带宽更低。\r
\r
位置/角度（慢，外环） → 速度/角速度（快，内环） → 加速度/力矩（最内层）\r
\r
\r
\r
##### 信号依赖关系判断\r
\r
外环被控量 = 内环被控量的积分			积分量一定是外环，微分量 / 速率量一定是内环。		$(\\theta = \\int \\dot\\theta \\mathrm{d}t)$\r
\r
\r
\r
外环输入：$(\\boldsymbol{\\theta_{ref}})$   0rad\r
\r
**反馈测量值 PV（过程输入）**：实际摆杆角度 $(\\boldsymbol{\\theta})$\r
\r
外环输出：$(\\boldsymbol{\\dot\\theta_{ref}})$ 角速度目标值\r
\r
内环输入：角速度目标值\r
\r
送入倒立摆动力学逆解模块：\r
\r
$(\\ddot x = \\frac{l_p \\ddot\\theta + g \\sin\\theta}{\\cos\\theta})$\r
\r
\`\`\`mermaid\r
flowchart LR\r
    A["θ_ref"] --> X1((minus))\r
    X1 --> P1["PID 位置环"]\r
    P1 --> W["ω_ref"]\r
    W --> X2((minus))\r
    X2 --> P2["PID 速度环"]\r
    P2 --> M["电机模型"]\r
    M --> Wout["ω"]\r
    Wout --> B["车身模型"]\r
    B --> Theta["θ"]\r
    Wout --> X2\r
    Theta --> X1\r
    Wout -.-> S["MPU6050 传感器"]\r
\`\`\`\r
\r
> 图示：PID控制 Simulink 仿真框图\r
\r
> 图示：Simulink 仿真输出波形\r
\r
### 代码实例`;export{r as default};

const r=`# VGD 2026 Dart Learning\r
\r
## dart.task\r
\r
### motor weak\r
\r
理解为一个软阻尼，发射瞬间让阻尼来吸收发生产生的反冲\r
\r
\`\`\`c\r
//void DART_PID_calc(DART *dart)\r
if ((dart->manual_mode == SHOOT_MODE) )\r
    {\r
		wk0++;\r
        dart->motor_tx[M1].motor_speed_set = 0;\r
        dart->motor_tx[M1].motor_current_set =\r
            (int16_t)PID_calc(&pid[WEAK][0], dart->motor_tx[M1].motor_speed_set,\r
                              dart->motor_rx[M1].motor_speed_fdb);}\r
\`\`\`\r
\r
## DM供弹电机\r
\r
### 4310控制函数总集成\r
\r
\`\`\`c\r
void DM_control_calculate(void)\r
{\r
	Improved_Trajectory_Planner(target_angle, dt_1, &trajectory);                // 使用修正的轨迹规划\r
				 \r
  Improved_Sensor_Update(dt_1, &sys_state, &motor_ctrl, &filter_state);        // 传感器更新\r
				 \r
  Load_Detection_Update(&motor_ctrl, &sys_state, &load_adaptive, dt_1);        // 负载检测\r
				 \r
  Enhanced_Adaptive_Update(dt_1, &motor_ctrl, &trajectory, &sys_state);        // 自适应更新\r
				 \r
  Adaptive_FeedForward_Torque_Calculate(&motor_ctrl, &trajectory, &sys_state, &load_adaptive);     // 前馈力矩计算\r
				 \r
  Enhanced_Anti_Jitter_Control(&motor_ctrl, &sys_state, &trajectory);          // 抗抖动控制\r
}\r
\`\`\`\r
\r
### DM轨迹规划器\r
\r
#### 结构体\r
\r
\`\`\`c\r
/**\r
 * @brief 轨迹规划结构体\r
 * 用于存储轨迹规划相关的参数和状态\r
 */\r
typedef struct\r
{\r
    // 运动限制\r
    float max_velocity;     // 最大速度限制 (rad/s)\r
    float max_acceleration; // 最大加速度限制 (rad/s2)\r
    float max_jerk;         // 最大加加速度限制 (rad/s3)\r
\r
    // 目标参数\r
    float target_angle; // 目标角度 (rad)\r
\r
    // 当前规划状态\r
    float current_angle; // 当前规划角度 (rad)\r
    float current_vel;   // 当前规划速度 (rad/s)\r
    float current_accel; // 当前规划加速度 (rad/s2)\r
\r
    // 轨迹规划参数\r
    float start_angle;     // 起始角度 (rad)\r
    float cruise_velocity; // 巡航速度 (rad/s)\r
    int move_direction;    // 运动方向\r
    uint32_t start_time;   // 开始时间戳\r
    uint32_t duration;     // 总运动时间\r
    int trajectory_type;   // 轨迹类型 (1:三角形, 2:梯形)\r
\r
} Trajectory_t;\r
\`\`\`\r
\r
### 自适应更新\r
\r
#### 结构体\r
\r
\`\`\`c\r
typedef struct\r
{\r
    // 控制设定值\r
    float pos_set; // 期望位置 p_des (rad)\r
    float vel_set; // 期望速度 v_des (rad/s)\r
\r
    // PID控制参数\r
    float kp; // 位置环增益 k_p\r
    float kd; // 速度环增益 k_d\r
    float ki; // 积分增益 (可选)\r
\r
    // 前馈力矩\r
    float Tor; // 前馈力矩 t_ff (N·m)\r
\r
    // 自适应参数\r
    float J_est;         // 估计转动惯量 (kg·m2)\r
    float b_est;         // 估计阻尼系数 (N·m·s/rad)\r
    float adaptive_gain; // 自适应增益\r
\r
    // 系统实际状态\r
    float actual_pos; // 当前电机位置 θ_m (rad)\r
    float actual_vel; // 当前电机速度 dθ_m (rad/s)\r
\r
    // 保护参数\r
    float max_torque; // 最大输出力矩限制\r
    float min_torque; // 最小输出力矩限制\r
\r
    // 新增：负载补偿和启动助推\r
    float load_compensation; // 负载补偿力矩\r
    float startup_boost;     // 启动助推力矩\r
\r
} MotorControl_t;\r
\`\`\`\r
\r
\r
\r
\`\`\`c\r
/**\r
 * @brief 系统状态结构体\r
 * 用于存储系统实时状态和误差信息\r
 */\r
typedef struct\r
{\r
    // 实际系统状态\r
    float actual_pos;   // 实际位置 (rad)\r
    float actual_vel;   // 实际速度 (rad/s)\r
    float actual_accel; // 实际加速度 (rad/s2)\r
\r
    // 控制误差\r
    float error;            // 位置误差 (rad)\r
    float error_integral;   // 误差积分\r
    float error_derivative; // 误差微分\r
\r
    // 时间信息\r
    float dt;             // 控制周期 (s)\r
    uint32_t last_update; // 最后更新时间戳\r
\r
    // 性能指标\r
    float max_error;      // 最大误差记录\r
    float avg_error;      // 平均误差\r
    uint32_t error_count; // 误差统计计数\r
\r
} SystemState_t;\r
\`\`\`\r
\r
\r
\r
\r
\r
### 自适应前馈力矩\r
\r
#### 结构体\r
\r
\`\`\`c\r
typedef struct\r
{\r
    float load_torque_estimate;     // 负载力矩估计\r
    float startup_compensation;     // 启动补偿力矩\r
    float friction_compensation;    // 摩擦补偿\r
    float load_detection_threshold; // 负载检测阈值\r
    uint32_t startup_timer;         // 启动计时器\r
    uint8_t is_startup_phase;       // 启动阶段标志\r
    float current_integral;         // 电流积分用于负载检测\r
} LoadAdaptive_t;\r
\`\`\`\r
\r
\r
\r
### 负载检测+更新\r
\r
\r
\r
\r
\r
### 启动助推力矩\r
\r
\`\`\`c\r
float Calculate_Startup_Boost(LoadAdaptive_t* load, SystemState_t* sys, float dt)\r
{\r
    // 启动助推\r
    float boost = load->load_torque_estimate * 1.3f;\r
    \r
\r
    //临时加力\r
    if (fabs(sys->error) > 0.12f) {\r
        boost += sys->error * 0.15f;\r
    }\r
    \r
\r
    //强制退出\r
    // 时间衰减\r
    float elapsed_time = (HAL_GetTick() - load->startup_timer) * 0.001f;\r
    float time_factor = 1.0f - (elapsed_time / 0.2f);\r
    time_factor = fmaxf(time_factor, 0.0f);\r
    \r
    boost *= time_factor;\r
    \r
    // 限幅\r
    boost = fmaxf(fminf(boost, 0.4f), -0.4f);\r
    \r
    return boost;\r
}\r
\`\`\`\r
\r
\r
\r
\r
\r
## referee裁判系统\r
\r
`;export{r as default};

# VGD 2026 Dart Learning

## dart.task

### motor weak

理解为一个软阻尼，发射瞬间让阻尼来吸收发生产生的反冲

```c
//void DART_PID_calc(DART *dart)
if ((dart->manual_mode == SHOOT_MODE) )
    {
		wk0++;
        dart->motor_tx[M1].motor_speed_set = 0;
        dart->motor_tx[M1].motor_current_set =
            (int16_t)PID_calc(&pid[WEAK][0], dart->motor_tx[M1].motor_speed_set,
                              dart->motor_rx[M1].motor_speed_fdb);}
```

## DM供弹电机

### 4310控制函数总集成

```c
void DM_control_calculate(void)
{
	Improved_Trajectory_Planner(target_angle, dt_1, &trajectory);                // 使用修正的轨迹规划
				 
  Improved_Sensor_Update(dt_1, &sys_state, &motor_ctrl, &filter_state);        // 传感器更新
				 
  Load_Detection_Update(&motor_ctrl, &sys_state, &load_adaptive, dt_1);        // 负载检测
				 
  Enhanced_Adaptive_Update(dt_1, &motor_ctrl, &trajectory, &sys_state);        // 自适应更新
				 
  Adaptive_FeedForward_Torque_Calculate(&motor_ctrl, &trajectory, &sys_state, &load_adaptive);     // 前馈力矩计算
				 
  Enhanced_Anti_Jitter_Control(&motor_ctrl, &sys_state, &trajectory);          // 抗抖动控制
}
```

### DM轨迹规划器

#### 结构体

```c
/**
 * @brief 轨迹规划结构体
 * 用于存储轨迹规划相关的参数和状态
 */
typedef struct
{
    // 运动限制
    float max_velocity;     // 最大速度限制 (rad/s)
    float max_acceleration; // 最大加速度限制 (rad/s2)
    float max_jerk;         // 最大加加速度限制 (rad/s3)

    // 目标参数
    float target_angle; // 目标角度 (rad)

    // 当前规划状态
    float current_angle; // 当前规划角度 (rad)
    float current_vel;   // 当前规划速度 (rad/s)
    float current_accel; // 当前规划加速度 (rad/s2)

    // 轨迹规划参数
    float start_angle;     // 起始角度 (rad)
    float cruise_velocity; // 巡航速度 (rad/s)
    int move_direction;    // 运动方向
    uint32_t start_time;   // 开始时间戳
    uint32_t duration;     // 总运动时间
    int trajectory_type;   // 轨迹类型 (1:三角形, 2:梯形)

} Trajectory_t;
```

### 自适应更新

#### 结构体

```c
typedef struct
{
    // 控制设定值
    float pos_set; // 期望位置 p_des (rad)
    float vel_set; // 期望速度 v_des (rad/s)

    // PID控制参数
    float kp; // 位置环增益 k_p
    float kd; // 速度环增益 k_d
    float ki; // 积分增益 (可选)

    // 前馈力矩
    float Tor; // 前馈力矩 t_ff (N·m)

    // 自适应参数
    float J_est;         // 估计转动惯量 (kg·m2)
    float b_est;         // 估计阻尼系数 (N·m·s/rad)
    float adaptive_gain; // 自适应增益

    // 系统实际状态
    float actual_pos; // 当前电机位置 θ_m (rad)
    float actual_vel; // 当前电机速度 dθ_m (rad/s)

    // 保护参数
    float max_torque; // 最大输出力矩限制
    float min_torque; // 最小输出力矩限制

    // 新增：负载补偿和启动助推
    float load_compensation; // 负载补偿力矩
    float startup_boost;     // 启动助推力矩

} MotorControl_t;
```



```c
/**
 * @brief 系统状态结构体
 * 用于存储系统实时状态和误差信息
 */
typedef struct
{
    // 实际系统状态
    float actual_pos;   // 实际位置 (rad)
    float actual_vel;   // 实际速度 (rad/s)
    float actual_accel; // 实际加速度 (rad/s2)

    // 控制误差
    float error;            // 位置误差 (rad)
    float error_integral;   // 误差积分
    float error_derivative; // 误差微分

    // 时间信息
    float dt;             // 控制周期 (s)
    uint32_t last_update; // 最后更新时间戳

    // 性能指标
    float max_error;      // 最大误差记录
    float avg_error;      // 平均误差
    uint32_t error_count; // 误差统计计数

} SystemState_t;
```





### 自适应前馈力矩

#### 结构体

```c
typedef struct
{
    float load_torque_estimate;     // 负载力矩估计
    float startup_compensation;     // 启动补偿力矩
    float friction_compensation;    // 摩擦补偿
    float load_detection_threshold; // 负载检测阈值
    uint32_t startup_timer;         // 启动计时器
    uint8_t is_startup_phase;       // 启动阶段标志
    float current_integral;         // 电流积分用于负载检测
} LoadAdaptive_t;
```



### 负载检测+更新





### 启动助推力矩

```c
float Calculate_Startup_Boost(LoadAdaptive_t* load, SystemState_t* sys, float dt)
{
    // 启动助推
    float boost = load->load_torque_estimate * 1.3f;
    

    //临时加力
    if (fabs(sys->error) > 0.12f) {
        boost += sys->error * 0.15f;
    }
    

    //强制退出
    // 时间衰减
    float elapsed_time = (HAL_GetTick() - load->startup_timer) * 0.001f;
    float time_factor = 1.0f - (elapsed_time / 0.2f);
    time_factor = fmaxf(time_factor, 0.0f);
    
    boost *= time_factor;
    
    // 限幅
    boost = fmaxf(fminf(boost, 0.4f), -0.4f);
    
    return boost;
}
```





## referee裁判系统


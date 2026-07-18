

```c

fp32 gyro_offset[3];           // 当前使用的陀螺仪零偏（实时更新）
fp32 gyro_cali_offset[3];      // 保存的校准零偏值（可从Flash读取）
fp32 accel_offset[3];          // 加速度计零偏
fp32 mag_offset[3];            // 磁力计零偏
fp32 gyro_scale_factor[3][3];  // 陀螺仪安装旋转矩阵
```





###  校准核心函数

#### 函数1：`gyro_offset_calc()` — 零偏计算

```c
// INS_task.c:369-380
void gyro_offset_calc(fp32 gyro_offset[3], fp32 gyro[3], uint16_t *offset_time_count)
{
    if (gyro_offset == NULL || gyro == NULL || offset_time_count == NULL)
    {
        return;
    }
    // 一阶指数滤波算法
    gyro_offset[0] = gyro_offset[0] - 0.0003f * gyro[0];
    gyro_offset[1] = gyro_offset[1] - 0.0003f * gyro[1];
    gyro_offset[2] = gyro_offset[2] - 0.0003f * gyro[2];
    (*offset_time_count)++;
}
```

**算法原理**：

这是一个**一阶低通滤波器**（指数移动平均），公式为：

```
offset(k) = offset(k-1) - α × gyro(k)
```

其中 `α = 0.0003f` 是滤波系数。

**物理意义**：
- 当陀螺仪静止时，`gyro[i]` 理论上应为零偏值
- 通过不断减去当前读数的一小部分，最终 `gyro_offset[i]` 会收敛到负的零偏值
- 实际使用时 `gyro[i] + gyro_offset[i] ≈ 0`（静止时）

#### 函数2：`INS_cali_gyro()` — 校准接口

```c
// INS_task.c:396-413
void INS_cali_gyro(fp32 cali_scale[3], fp32 cali_offset[3], uint16_t *time_count)
{
    if( *time_count == 0)
    {
        // 首次调用，初始化当前零偏为保存的校准值
        gyro_offset[0] = gyro_cali_offset[0];
        gyro_offset[1] = gyro_cali_offset[1];
        gyro_offset[2] = gyro_cali_offset[2];
    }
    // 迭代更新零偏
    gyro_offset_calc(gyro_offset, INS_gyro, time_count);

    // 输出校准结果
    cali_offset[0] = gyro_offset[0];
    cali_offset[1] = gyro_offset[1];
    cali_offset[2] = gyro_offset[2];
    cali_scale[0] = 1.0f;  // 比例因子固定为1（本工程不校准比例）
    cali_scale[1] = 1.0f;
    cali_scale[2] = 1.0f;
}
```

#### 函数3：`INS_set_cali_gyro()` — 设置保存的校准值

```c
// INS_task.c:427-435
void INS_set_cali_gyro(fp32 cali_scale[3], fp32 cali_offset[3])
{
    // 将传入的校准值保存到全局变量
    gyro_cali_offset[0] = cali_offset[0];
    gyro_cali_offset[1] = cali_offset[1];
    gyro_cali_offset[2] = cali_offset[2];
    // 同时更新当前使用的零偏
    gyro_offset[0] = gyro_cali_offset[0];
    gyro_offset[1] = gyro_cali_offset[1];
    gyro_offset[2] = gyro_cali_offset[2];
}
```

---

## 三、零偏校准工作原理

### 3.1 校准过程时序图

```
时间轴 →
┌─────────────────────────────────────────────────────────────────────┐
│ 阶段1: 静止放置 IMU                                                │
│        ┌─────────────────┐                                         │
│        │ 传感器静止不动   │                                         │
│        │ 等待温度稳定     │                                         │
│        └─────────────────┘                                         │
│              ↓                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ 阶段2: 开始校准（调用 INS_cali_gyro）                               │
│        ┌─────────────────────────────────────────────────────┐     │
│        │ time_count = 0: 初始化 gyro_offset = gyro_cali_offset│     │
│        │ time_count = 1: gyro_offset -= 0.0003 × INS_gyro    │     │
│        │ time_count = 2: gyro_offset -= 0.0003 × INS_gyro    │     │
│        │           ...                                       │     │
│        │ time_count = N: 收敛到稳定值                         │     │
│        └─────────────────────────────────────────────────────┘     │
│              ↓                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ 阶段3: 保存校准结果                                                 │
│        ┌─────────────────────────────────────────────────────┐     │
│        │ 将 cali_offset[] 写入 Flash 持久化存储                 │     │
│        │ 下次启动时通过 INS_set_cali_gyro 加载                  │     │
│        └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 数学原理详解

**稳态分析**：

当系统达到稳态时，`gyro_offset` 的变化量趋近于零：

```
Δgyro_offset = -0.0003 × INS_gyro ≈ 0
```

由于 `INS_gyro = 原始数据 + gyro_offset`（静止时原始数据 ≈ 零偏值），最终：

```
gyro_offset ≈ -原始数据（零偏值）
INS_gyro ≈ 原始数据 + gyro_offset ≈ 0
```

**收敛速度**：

滤波系数 `α = 0.0003` 决定了收敛速度：
- α 越大，收敛越快，但噪声越大
- α 越小，收敛越慢，但结果更平滑

### 3.3 安装矩阵的作用

```c
// INS_task.c:40-43
#define BMI088_BOARD_INSTALL_SPIN_MATRIX    \
    {0.0f, 1.0f, 0.0f},                     \
    {-1.0f, 0.0f, 0.0f},                    \
    {0.0f, 0.0f, 1.0f}
```

这是一个**旋转矩阵**，用于将传感器坐标系转换到机器人坐标系：

| 安装矩阵 | 含义 |
|---------|------|
| `[0, 1, 0]` | X轴数据来自传感器Y轴 |
| `[-1, 0, 0]` | Y轴数据来自传感器-X轴 |
| `[0, 0, 1]` | Z轴数据来自传感器Z轴 |

**物理意义**：传感器在电路板上的安装方向与机器人坐标系不一致，需要通过矩阵转换对齐。

---

## 四、零偏校准在系统中的位置

### 4.1 INS 任务主循环

```c
// INS_task.c:173-277
void INS_task(void const *pvParameters)
{
    // 1. 初始化传感器
    while(BMI088_init()) { osDelay(100); }
    while(ist8310_init()) { osDelay(100); }
    
    // 2. 读取初始数据并校准
    BMI088_read(bmi088_real_data.gyro, bmi088_real_data.accel, &bmi088_real_data.temp);
    imu_cali_slove(INS_gyro, INS_accel, INS_mag, &bmi088_real_data, &ist8310_real_data);
    
    // 3. 初始化AHRS和温度控制
    AHRS_init(INS_quat, INS_accel, INS_mag);
    
    // 4. 主循环
    while (1)
    {
        // 等待传感器数据更新
        while (ulTaskNotifyTake(pdTRUE, portMAX_DELAY) != pdPASS) { }
        
        // 读取陀螺仪数据
        BMI088_gyro_read_over(...);
        
        // 读取加速度计数据
        BMI088_accel_read_over(...);
        
        // 读取温度并控制
        BMI088_temperature_read_over(...);
        imu_temp_control(bmi088_real_data.temp);
        
        // ★ 核心：零偏校准 + 安装矩阵转换
        imu_cali_slove(INS_gyro, INS_accel, INS_mag, &bmi088_real_data, &ist8310_real_data);
        
        // 加速度计低通滤波
        // ...
        
        // AHRS姿态解算
        AHRS_update(INS_quat, timing_time, INS_gyro, accel_fliter_3, INS_mag);
        get_angle(INS_quat, INS_angle + INS_YAW_ADDRESS_OFFSET, ...);
    }
}
```

### 4.2 数据流向图

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  BMI088传感器 │ → │ imu_cali_slove │ → │   低通滤波   │ → │  AHRS解算   │
│  原始数据     │    │ 零偏校准+旋转  │    │             │    │  姿态角     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                      ↓
                                               ┌─────────────┐
                                               │  底盘控制   │
                                               │  云台控制   │
                                               └─────────────┘
```

---

## 五、温度控制对零偏的影响

### 5.1 温度控制机制

```c
// INS_task.c:321-353
static void imu_temp_control(fp32 temp)
{
    uint16_t tempPWM;
    static uint8_t temp_constant_time = 0;
    
    if (first_temperate)
    {
        // PID控制温度在45°C
        PID_calc(&imu_temp_pid, temp, 45);
        if (imu_temp_pid.out < 0.0f) imu_temp_pid.out = 0.0f;
        tempPWM = (uint16_t)imu_temp_pid.out;
        IMU_temp_PWM(tempPWM);
    }
    else
    {
        // 预热阶段：最大功率加热
        if (temp > 45)
        {
            temp_constant_time++;
            if (temp_constant_time > 200)
            {
                first_temperate = 1;
                imu_temp_pid.Iout = MPU6500_TEMP_PWM_MAX / 2.0f;
            }
        }
        IMU_temp_PWM(MPU6500_TEMP_PWM_MAX - 1);
    }
}
```

### 5.2 温度与零偏的关系

| 温度状态 | 零偏特性 | 工程对策 |
|---------|---------|---------|
| 温度变化时 | 零偏漂移明显 | 通过PWM加热片将IMU稳定在45°C |
| 温度稳定后 | 零偏相对稳定 | 在校准前等待温度稳定 |
| 长时间工作 | 轻微漂移 | 定期重新校准或使用温度补偿算法 |

---

## 六、学习要点总结

### 6.1 核心知识点

1. **零偏校准本质**：测量并消除传感器静止时的固定偏移
2. **校准时机**：IMU静止、温度稳定后进行
3. **算法选择**：一阶低通滤波（指数移动平均）实现平滑收敛
4. **数据持久化**：校准值应写入Flash，下次启动自动加载
5. **安装矩阵**：处理传感器安装方向与机器人坐标系不一致的问题

### 6.2 代码框架总结

| 文件 | 职责 | 关键函数 |
|------|------|---------|
| `INS_task.c` | INS任务主循环、零偏校准核心逻辑 | `INS_cali_gyro()`, `gyro_offset_calc()`, `imu_cali_slove()` |
| `INS_task.h` | 校准接口声明 | `INS_cali_gyro()`, `INS_set_cali_gyro()` |
| `BMI088driver.c` | BMI088传感器驱动 | `BMI088_read()`, `BMI088_gyro_read_over()` |
| `ahrs.h/c` | 姿态解算 | `AHRS_update()`, `get_angle()` |

### 6.3 校准步骤（用户视角）

1. 将机器人水平放置，确保IMU静止
2. 等待IMU温度稳定（约200个控制周期）
3. 触发校准命令（通常通过遥控器或上位机）
4. 等待校准收敛（time_count增加到稳定值）
5. 保存校准结果到Flash
6. 校准完成，正常使用

---

## 七、拓展思考

### 7.1 改进方向

1. **自适应滤波系数**：根据陀螺仪噪声水平动态调整 α
2. **温度补偿模型**：建立零偏与温度的函数关系，实时补偿
3. **六面校准**：加速度计需要在6个方向静止校准
4. **在线校准**：运动过程中估计零偏变化

### 7.2 常见问题

| 问题 | 原因 | 解决方法 |
|------|------|---------|
| 姿态角缓慢漂移 | 陀螺仪零偏未校准或温度变化 | 重新校准、启用温度控制 |
| 校准后仍有误差 | IMU未完全静止 | 确保校准过程中无振动 |
| 零偏值波动大 | 滤波系数过大 | 减小α值或增加校准时间 |

---

**参考文件**：
- `application/INS_task.c`
- `application/INS_task.h`
- `bsp/BMI088driver.c`
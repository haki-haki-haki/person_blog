[TOC]



# PowerShell

## 路径/目录切换

- 切盘 

  ```powershell
  D:	#直接输入盘符+冒号 回车切
  C:
  ```

- 进入文件夹

  ```powershell
  cd  #文件夹名字
  cd D:/test/demo
  ```

  ==如果文件或者文件夹命名有空格 加“”==

- 返回上一级

  ```powershell
  cd ..
  ```

- 回到个人文件夹

  ```powershell
  cd ~
  ```

- 查看当前路径

  ```powershell
  pwd
  ```

- 列出当前下的所有

  ```powershell
  ls
  ```

## 文件夹操作

- 新建文件夹

  ```powershell
  New-Item 文件夹名 -ItemType Directory
  #简写
  mkdir 文件夹名
  ```

- 删除文件夹名

  ```powershell
  rm 文件夹名 -r
  ```

  ## 文件操作

  - 创建空白文件

  ```powershell
  New-Item hello.txt -ItemType File
  #简写
  "" > hello.txt
  ```

- 覆盖原有内容写入

  ```powershell
  "hello" > hello.txt
  ```

- 追加内容

  ```powershell
  Add-Content hello.txt "new add"
  ```

- 查看内容

  ```powershell
  cat hello.txt
  #或者
  Get-Content hello.txt
  ```

- 复制

  ```powershell
  cp 文件名/文件 路径
  ```
  
- 剪切

  ```powershell
  move 文件名/文件 路径
  ```

- 重命名

  ```powershell
  Rename-Item hello.txt new.txt
  ```

## grep查询

==windows下不可用==

### 文件中查询

```powershell
# 在 test.txt 查找包含 error 的行
grep "error" test.txt

# 忽略大小写找 Error/ERROR
grep -i "error" test.txt

# 方向过滤
# 输出不含 # 注释的行
grep -v "#" config.conf
```

### 递归文件夹查询

```powershell
# 查找 /var/log 下所有含fail的文件
grep -r "fail" /var/log

# 只打印匹配到的文件名
grep -rl "fail" /var/log
```



## ls查询

### 模糊匹配

```powershell
# 名字含C/c，只看本级 不分大小写
ls *C*
ls *can*

# 只显示文件，排除文件夹
ls *C* -File
# 只显示文件夹
ls *C* -Directory

# 精确找名为 shtu 的文件
ls -r "shtu"

# 查找所有压缩包 zip
ls -r *.zip

# 查找所有 word文档 docx
ls -r *.docx
```



## tree

```powershell
tree
```

直接展示所有文件夹和文件之间的关系 树状图



## 系统基础查询

```powershell
ipconfig      # 查看本机IP地址
ping www.baidu.com  # 测试网络连通性
Get-Process   # 查看所有运行程序（任务管理器命令版）
Get-Date      # 显示当前系统时间
Clear         # 清屏
```



##  Tab快捷键使用

命令补全：输入 `New-I` 按 Tab，自动补全完整 `New-Item`

参数补全：输入 `New-Item hello.txt -I` 按 Tab，补全 `-ItemType`

参数值补全：输入 `-ItemType` 后按 Tab，循环切换 `File` / `Directory`



## cmd and powershell

CMD 是老旧简易工具，PowerShell 是微软新一代全能终端。



CMD：老旧 DOS 命令工具，只传纯文本；

PowerShell：现代管理工具，传递结构化对象，功能更强。
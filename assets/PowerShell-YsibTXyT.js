const r=`[TOC]\r
\r
\r
\r
# PowerShell\r
\r
## 路径/目录切换\r
\r
- 切盘 \r
\r
  \`\`\`powershell\r
  D:	#直接输入盘符+冒号 回车切\r
  C:\r
  \`\`\`\r
\r
- 进入文件夹\r
\r
  \`\`\`powershell\r
  cd  #文件夹名字\r
  cd D:/test/demo\r
  \`\`\`\r
\r
  ==如果文件或者文件夹命名有空格 加“”==\r
\r
- 返回上一级\r
\r
  \`\`\`powershell\r
  cd ..\r
  \`\`\`\r
\r
- 回到个人文件夹\r
\r
  \`\`\`powershell\r
  cd ~\r
  \`\`\`\r
\r
- 查看当前路径\r
\r
  \`\`\`powershell\r
  pwd\r
  \`\`\`\r
\r
- 列出当前下的所有\r
\r
  \`\`\`powershell\r
  ls\r
  \`\`\`\r
\r
## 文件夹操作\r
\r
- 新建文件夹\r
\r
  \`\`\`powershell\r
  New-Item 文件夹名 -ItemType Directory\r
  #简写\r
  mkdir 文件夹名\r
  \`\`\`\r
\r
- 删除文件夹名\r
\r
  \`\`\`powershell\r
  rm 文件夹名 -r\r
  \`\`\`\r
\r
  ## 文件操作\r
\r
  - 创建空白文件\r
\r
  \`\`\`powershell\r
  New-Item hello.txt -ItemType File\r
  #简写\r
  "" > hello.txt\r
  \`\`\`\r
\r
- 覆盖原有内容写入\r
\r
  \`\`\`powershell\r
  "hello" > hello.txt\r
  \`\`\`\r
\r
- 追加内容\r
\r
  \`\`\`powershell\r
  Add-Content hello.txt "new add"\r
  \`\`\`\r
\r
- 查看内容\r
\r
  \`\`\`powershell\r
  cat hello.txt\r
  #或者\r
  Get-Content hello.txt\r
  \`\`\`\r
\r
- 复制\r
\r
  \`\`\`powershell\r
  cp 文件名/文件 路径\r
  \`\`\`\r
  \r
- 剪切\r
\r
  \`\`\`powershell\r
  move 文件名/文件 路径\r
  \`\`\`\r
\r
- 重命名\r
\r
  \`\`\`powershell\r
  Rename-Item hello.txt new.txt\r
  \`\`\`\r
\r
## grep查询\r
\r
==windows下不可用==\r
\r
### 文件中查询\r
\r
\`\`\`powershell\r
# 在 test.txt 查找包含 error 的行\r
grep "error" test.txt\r
\r
# 忽略大小写找 Error/ERROR\r
grep -i "error" test.txt\r
\r
# 方向过滤\r
# 输出不含 # 注释的行\r
grep -v "#" config.conf\r
\`\`\`\r
\r
### 递归文件夹查询\r
\r
\`\`\`powershell\r
# 查找 /var/log 下所有含fail的文件\r
grep -r "fail" /var/log\r
\r
# 只打印匹配到的文件名\r
grep -rl "fail" /var/log\r
\`\`\`\r
\r
\r
\r
## ls查询\r
\r
### 模糊匹配\r
\r
\`\`\`powershell\r
# 名字含C/c，只看本级 不分大小写\r
ls *C*\r
ls *can*\r
\r
# 只显示文件，排除文件夹\r
ls *C* -File\r
# 只显示文件夹\r
ls *C* -Directory\r
\r
# 精确找名为 shtu 的文件\r
ls -r "shtu"\r
\r
# 查找所有压缩包 zip\r
ls -r *.zip\r
\r
# 查找所有 word文档 docx\r
ls -r *.docx\r
\`\`\`\r
\r
\r
\r
## tree\r
\r
\`\`\`powershell\r
tree\r
\`\`\`\r
\r
直接展示所有文件夹和文件之间的关系 树状图\r
\r
\r
\r
## 系统基础查询\r
\r
\`\`\`powershell\r
ipconfig      # 查看本机IP地址\r
ping www.baidu.com  # 测试网络连通性\r
Get-Process   # 查看所有运行程序（任务管理器命令版）\r
Get-Date      # 显示当前系统时间\r
Clear         # 清屏\r
\`\`\`\r
\r
\r
\r
##  Tab快捷键使用\r
\r
命令补全：输入 \`New-I\` 按 Tab，自动补全完整 \`New-Item\`\r
\r
参数补全：输入 \`New-Item hello.txt -I\` 按 Tab，补全 \`-ItemType\`\r
\r
参数值补全：输入 \`-ItemType\` 后按 Tab，循环切换 \`File\` / \`Directory\`\r
\r
\r
\r
## cmd and powershell\r
\r
CMD 是老旧简易工具，PowerShell 是微软新一代全能终端。\r
\r
\r
\r
CMD：老旧 DOS 命令工具，只传纯文本；\r
\r
PowerShell：现代管理工具，传递结构化对象，功能更强。`;export{r as default};

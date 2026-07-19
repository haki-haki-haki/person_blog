[TOC]

# git

在改动前后保留历史，随时回看，比较，回退。

Git核心作用： 软件开发宠用的版本管理工具

- 本地记录版本历史

  commit 项目文件状态 提交时间 作者 提交说明

- 本地仓库

### 仓库

Git管理的某个目录

```powershell
git --version
```

查看git的安装 输出版本 `git version 2.x.x`

### 配置提交身份

每个电脑配一次 可覆盖

#### 全局配置

```powershell
git config --global user.name "你的昵称"
git config --global user.email "你两边都绑定的邮箱"
```

#### 单个仓库配置

新建文件 在当前文件进入终端

```powershell
git config user.name "当前昵称"
git config user.email "当前绑定邮箱"
```

### git初始化

```powershell
git init

#参考如下
PS D:\VGD_task\git_test> git init                               
Initialized empty Git repository in D:/VGD_task/git_test/.git/ 
```

### 查看statu

```powershell
git status

#参考
PS D:\VGD_task\git_test> git init
Initialized empty Git repository in D:/VGD_task/git_test/.git/
PS D:\VGD_task\git_test> git status
On branch master

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        git_git.txt
        test.cpp

nothing added to commit but untracked files present (use "git add" to track)
```

Untracked files Git可以管理他们，但是还没有纳入版本管理

### .git文件

.的解释 

件名以 `.` 开头代表隐藏文件 / 文件夹

`.git` 是**Git 仓库的核心数据库目录**，执行 `git init` 命令就会自动生成，整个项目的版本记录全部存在这里。

- 保存所有版本快照 提交文件历史，修改记录保存
- 记录分支、标签
- 存放本地配置，暂存区信息（远程仓库地址，用户名，邮件信息）

```
.git/
├─ config       # 当前仓库的本地配置（仓库专属用户名/邮箱、远程仓库地址）
├─ HEAD         # 标记你当前在哪一个分支（默认master）
├─ objects/     # 存放所有文件、提交记录的压缩快照（Git的数据库本体）
├─ refs/        # 存放分支、标签指针
│  ├─ heads/    # 所有本地分支（master/main、dev等）
│  └─ tags/     # 版本标签
├─ index        # 暂存区（git add 后的文件临时存放处）
├─ logs/        # 操作日志，记录每一次切换分支、提交记录
└─ hooks/       # 钩子脚本（提交前自动校验代码、推送前执行脚本等）
```

补充info文件夹

`.git/info/exclude`：只在你这台电脑生效，不会上传，只有你自己看得见规则

### .gitignore

#### macOS

在 macOS 上，经常会出现 `.DS_Store`，它是系统显示设置文件，不属于项目代码，不应提交。

在项目根目录新建 `.gitignore`，写入：

```powershell
.DS_Store
```

这表示：以后 Git 会忽略该文件。

关键点：

- `.gitignore` 本身应该提交（它是项目规则）
- `.git` 不需要写进 `.gitignore`（Git 会自动管理）

#### Windows

windows生成的

`Thumbs.db`：文件夹里图片缩略图缓存

`desktop.ini`：文件夹外观、图标配置文件

这俩完全不用传到 Gitee/GitHub，**必须写到 `.gitignore` 里**编译代码会生成一堆 exe、中间文件、Debug 文件夹，上传代码不需要带，也要写进去。

新建文件夹

```powershell
New-Item .gitignore -ItemType File

# Windows系统自动生成的垃圾文件
Thumbs.db
desktop.ini

# Mac系统文件（万一别人用Mac拉你的代码，也能过滤）
.DS_Store

# C++编译出来的文件夹、程序
Debug/
Release/
x64/
*.exe
*.obj
*.log

# VS/CLion/VSCode编辑器缓存
.vs/
.vscode/

# 如果你用Keil单片机工程，再加下面几行
Objects/
Listings/
*.hex
*.axf
```

`Thumbs.db`：忽略 Windows 图片缓存文件

`Debug/`：忽略整个 Debug 编译文件夹，斜杠代表文件夹

`*.exe`：星号代表所有，所有后缀 exe 的程序都忽略

`.DS_Store`：兼容 Mac 用户，不用删

`.gitignore` 这个文件**一定要提交上传**

  不用写 `.git` 进忽略

### commit

先加入暂存区

```powershell
git add test.cpp
```

一次性加入当前目录全部改动（排除忽略项）：

```powershell
git add .
```

```powershell
git status
```

文件进入 `Changes to be committed`，就表示已经准备好进入下一次提交。

执行commit

```powershell
git commit -m "第一次提交"

```

实例输出：

```powershell
PS D:\VGD_task\git_test> git status
On branch master

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
        new file:   test.cpp

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        git_git.txt

PS D:\VGD_task\git_test> git add .
PS D:\VGD_task\git_test> git status
On branch master

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
        new file:   git_git.txt
        new file:   test.cpp

PS D:\VGD_task\git_test> git commit -m "first commit"
[master (root-commit) b6cb302] first commit
 2 files changed, 9 insertions(+)
 create mode 100644 git_git.txt
 create mode 100644 test.cpp
PS D:\VGD_task\git_test>
```

### 修改再commit

```powershell
PS D:\VGD_task\git_test> git add .
PS D:\VGD_task\git_test> git commit -m "second commit"
[master 07bbf76] second commit
 1 file changed, 1 insertion(+), 1 deletion(-)
PS D:\VGD_task\git_test>
```

### 查看日志

.git文件内容和已通过powershell查看

提交版本和作者

```powershell
git log

PS D:\VGD_task\git_test> git log
commit 07bbf76967a221b372cec82e42351d4814936e7a (HEAD -> master)
Author: haki <3448790871@qq.com>
Date:   Sun Jul 19 00:17:35 2026 +0800

    second commit

commit b6cb3022a9f158748bd4be8e81bfce802ffbc7a5
Author: haki <3448790871@qq.com>
Date:   Sun Jul 19 00:15:25 2026 +0800

    first commit
```

查看改动之处

```powershell
PS D:\VGD_task\git_test> git show
commit 07bbf76967a221b372cec82e42351d4814936e7a (HEAD -> master)
Author: haki <3448790871@qq.com>
Date:   Sun Jul 19 00:17:35 2026 +0800

    second commit

diff --git a/test.cpp b/test.cpp
index 85b7ed7..13973d4 100644
--- a/test.cpp
+++ b/test.cpp
@@ -3,6 +3,6 @@ using namespace std;

 int main()
 {
-       cout<<"hello"<<endl;
+       cout<<"hello git second"<<endl;
        return 0;
 }
\ No newline at end of file
```

其余查看可自行探索

参考

https://xn--ygr25xpohxwz.com/zero-to-fullstack/lessons/module-3-3/

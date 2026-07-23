const n=`[TOC]\r
\r
# git\r
\r
在改动前后保留历史，随时回看，比较，回退。\r
\r
Git核心作用： 软件开发宠用的版本管理工具\r
\r
- 本地记录版本历史\r
\r
  commit 项目文件状态 提交时间 作者 提交说明\r
\r
- 本地仓库\r
\r
### 仓库\r
\r
Git管理的某个目录\r
\r
\`\`\`powershell\r
git --version\r
\`\`\`\r
\r
查看git的安装 输出版本 \`git version 2.x.x\`\r
\r
### 配置提交身份\r
\r
每个电脑配一次 可覆盖\r
\r
#### 全局配置\r
\r
\`\`\`powershell\r
git config --global user.name "你的昵称"\r
git config --global user.email "你两边都绑定的邮箱"\r
\`\`\`\r
\r
#### 单个仓库配置\r
\r
新建文件 在当前文件进入终端\r
\r
\`\`\`powershell\r
git config user.name "当前昵称"\r
git config user.email "当前绑定邮箱"\r
\`\`\`\r
\r
### git初始化\r
\r
\`\`\`powershell\r
git init\r
\r
#参考如下\r
PS D:\\VGD_task\\git_test> git init                               \r
Initialized empty Git repository in D:/VGD_task/git_test/.git/ \r
\`\`\`\r
\r
### 查看statu\r
\r
\`\`\`powershell\r
git status\r
\r
#参考\r
PS D:\\VGD_task\\git_test> git init\r
Initialized empty Git repository in D:/VGD_task/git_test/.git/\r
PS D:\\VGD_task\\git_test> git status\r
On branch master\r
\r
No commits yet\r
\r
Untracked files:\r
  (use "git add <file>..." to include in what will be committed)\r
        git_git.txt\r
        test.cpp\r
\r
nothing added to commit but untracked files present (use "git add" to track)\r
\`\`\`\r
\r
Untracked files Git可以管理他们，但是还没有纳入版本管理\r
\r
### .git文件\r
\r
.的解释 \r
\r
件名以 \`.\` 开头代表隐藏文件 / 文件夹\r
\r
\`.git\` 是**Git 仓库的核心数据库目录**，执行 \`git init\` 命令就会自动生成，整个项目的版本记录全部存在这里。\r
\r
- 保存所有版本快照 提交文件历史，修改记录保存\r
- 记录分支、标签\r
- 存放本地配置，暂存区信息（远程仓库地址，用户名，邮件信息）\r
\r
\`\`\`\r
.git/\r
├─ config       # 当前仓库的本地配置（仓库专属用户名/邮箱、远程仓库地址）\r
├─ HEAD         # 标记你当前在哪一个分支（默认master）\r
├─ objects/     # 存放所有文件、提交记录的压缩快照（Git的数据库本体）\r
├─ refs/        # 存放分支、标签指针\r
│  ├─ heads/    # 所有本地分支（master/main、dev等）\r
│  └─ tags/     # 版本标签\r
├─ index        # 暂存区（git add 后的文件临时存放处）\r
├─ logs/        # 操作日志，记录每一次切换分支、提交记录\r
└─ hooks/       # 钩子脚本（提交前自动校验代码、推送前执行脚本等）\r
\`\`\`\r
\r
补充info文件夹\r
\r
\`.git/info/exclude\`：只在你这台电脑生效，不会上传，只有你自己看得见规则\r
\r
### .gitignore\r
\r
#### macOS\r
\r
在 macOS 上，经常会出现 \`.DS_Store\`，它是系统显示设置文件，不属于项目代码，不应提交。\r
\r
在项目根目录新建 \`.gitignore\`，写入：\r
\r
\`\`\`powershell\r
.DS_Store\r
\`\`\`\r
\r
这表示：以后 Git 会忽略该文件。\r
\r
关键点：\r
\r
- \`.gitignore\` 本身应该提交（它是项目规则）\r
- \`.git\` 不需要写进 \`.gitignore\`（Git 会自动管理）\r
\r
#### Windows\r
\r
windows生成的\r
\r
\`Thumbs.db\`：文件夹里图片缩略图缓存\r
\r
\`desktop.ini\`：文件夹外观、图标配置文件\r
\r
这俩完全不用传到 Gitee/GitHub，**必须写到 \`.gitignore\` 里**编译代码会生成一堆 exe、中间文件、Debug 文件夹，上传代码不需要带，也要写进去。\r
\r
新建文件夹\r
\r
\`\`\`powershell\r
New-Item .gitignore -ItemType File\r
\r
# Windows系统自动生成的垃圾文件\r
Thumbs.db\r
desktop.ini\r
\r
# Mac系统文件（万一别人用Mac拉你的代码，也能过滤）\r
.DS_Store\r
\r
# C++编译出来的文件夹、程序\r
Debug/\r
Release/\r
x64/\r
*.exe\r
*.obj\r
*.log\r
\r
# VS/CLion/VSCode编辑器缓存\r
.vs/\r
.vscode/\r
\r
# 如果你用Keil单片机工程，再加下面几行\r
Objects/\r
Listings/\r
*.hex\r
*.axf\r
\`\`\`\r
\r
\`Thumbs.db\`：忽略 Windows 图片缓存文件\r
\r
\`Debug/\`：忽略整个 Debug 编译文件夹，斜杠代表文件夹\r
\r
\`*.exe\`：星号代表所有，所有后缀 exe 的程序都忽略\r
\r
\`.DS_Store\`：兼容 Mac 用户，不用删\r
\r
\`.gitignore\` 这个文件**一定要提交上传**\r
\r
  不用写 \`.git\` 进忽略\r
\r
### commit\r
\r
先加入暂存区\r
\r
\`\`\`powershell\r
git add test.cpp\r
\`\`\`\r
\r
一次性加入当前目录全部改动（排除忽略项）：\r
\r
\`\`\`powershell\r
git add .\r
\`\`\`\r
\r
\`\`\`powershell\r
git status\r
\`\`\`\r
\r
文件进入 \`Changes to be committed\`，就表示已经准备好进入下一次提交。\r
\r
执行commit\r
\r
\`\`\`powershell\r
git commit -m "第一次提交"\r
\r
\`\`\`\r
\r
实例输出：\r
\r
\`\`\`powershell\r
PS D:\\VGD_task\\git_test> git status\r
On branch master\r
\r
No commits yet\r
\r
Changes to be committed:\r
  (use "git rm --cached <file>..." to unstage)\r
        new file:   test.cpp\r
\r
Untracked files:\r
  (use "git add <file>..." to include in what will be committed)\r
        git_git.txt\r
\r
PS D:\\VGD_task\\git_test> git add .\r
PS D:\\VGD_task\\git_test> git status\r
On branch master\r
\r
No commits yet\r
\r
Changes to be committed:\r
  (use "git rm --cached <file>..." to unstage)\r
        new file:   git_git.txt\r
        new file:   test.cpp\r
\r
PS D:\\VGD_task\\git_test> git commit -m "first commit"\r
[master (root-commit) b6cb302] first commit\r
 2 files changed, 9 insertions(+)\r
 create mode 100644 git_git.txt\r
 create mode 100644 test.cpp\r
PS D:\\VGD_task\\git_test>\r
\`\`\`\r
\r
### 修改再commit\r
\r
\`\`\`powershell\r
PS D:\\VGD_task\\git_test> git add .\r
PS D:\\VGD_task\\git_test> git commit -m "second commit"\r
[master 07bbf76] second commit\r
 1 file changed, 1 insertion(+), 1 deletion(-)\r
PS D:\\VGD_task\\git_test>\r
\`\`\`\r
\r
### 查看日志\r
\r
.git文件内容和已通过powershell查看\r
\r
提交版本和作者\r
\r
\`\`\`powershell\r
git log\r
\r
PS D:\\VGD_task\\git_test> git log\r
commit 07bbf76967a221b372cec82e42351d4814936e7a (HEAD -> master)\r
Author: haki <3448790871@qq.com>\r
Date:   Sun Jul 19 00:17:35 2026 +0800\r
\r
    second commit\r
\r
commit b6cb3022a9f158748bd4be8e81bfce802ffbc7a5\r
Author: haki <3448790871@qq.com>\r
Date:   Sun Jul 19 00:15:25 2026 +0800\r
\r
    first commit\r
\`\`\`\r
\r
查看改动之处\r
\r
\`\`\`powershell\r
PS D:\\VGD_task\\git_test> git show\r
commit 07bbf76967a221b372cec82e42351d4814936e7a (HEAD -> master)\r
Author: haki <3448790871@qq.com>\r
Date:   Sun Jul 19 00:17:35 2026 +0800\r
\r
    second commit\r
\r
diff --git a/test.cpp b/test.cpp\r
index 85b7ed7..13973d4 100644\r
--- a/test.cpp\r
+++ b/test.cpp\r
@@ -3,6 +3,6 @@ using namespace std;\r
\r
 int main()\r
 {\r
-       cout<<"hello"<<endl;\r
+       cout<<"hello git second"<<endl;\r
        return 0;\r
 }\r
\\ No newline at end of file\r
\`\`\`\r
\r
其余查看可自行探索\r
\r
参考\r
\r
https://xn--ygr25xpohxwz.com/zero-to-fullstack/lessons/module-3-3/\r
`;export{n as default};

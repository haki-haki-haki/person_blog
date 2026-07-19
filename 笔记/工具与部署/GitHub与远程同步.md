# GitHub与远程同步

## 远程仓库

- 代码迁移
- 多人协作
- 部署拉取代码

## 创建空仓库

登录 GitHub 后新建仓库，建议：

1. 仓库名：`xxxxx`
2. Public / Private：都可以（按你的需求）

创建完成后，复制 SSH 地址（类似）：

```
git@github.com:你的用户名/zero-to-tech.git

```

### SSH

![img](/person_blog/notes-images/imported/github-ssh-clone.png)

提前在电脑生成一对密钥，把公钥放到 GitHub 账号设置里

配置好一次后，**以后上传下载永远不用输账号密码**

缺点：初次要额外配置密钥，步骤多一点

HTTPS：走 443 端口，公司校园网、防火墙几乎不会拦截，兼容性最强

### HTTPS

![img](/person_blog/notes-images/imported/github-https-clone.png)

推送代码时，每次要输入**GitHub 账号密码 / 个人令牌 token**

不用额外配置，复制地址直接用，上手零门槛

缺点：每次换电脑、清空缓存后，上传代码都要输账号验证

SSH：走 22 端口，部分校园 / 公司内网会屏蔽 22 端口，连不上 GitHub

---

本次使用SSH 每台电脑配置1次即可

```powershell
#当前工程下
PS D:\VGD_task\git_test> ssh-keygen -t ed25519 -C "邮箱地址" -f ./my_ssh_key
```

让你输入ket pair可以回车跳过，回车两次

复制公钥去github

```powershell
cat ./my_ssh_key.pub | clip
#复制公钥
```

GitHub -> Settings -> SSH and GPG keys -> New SSH key
把公钥粘贴进去保存。

![img](/person_blog/notes-images/imported/github-new-ssh-key.png)

连通测试

通过 SSH 协议，以 git 账号身份登录[github.com](https://link.wtturl.cn/?target=https%3A%2F%2Fgithub.com&scene=im&aid=582478&lang=zh)服务器，进行身份连通测试

```powershell
ssh -T git@github.com
```

当前笔者实在当前工程下配置的密钥，直接这么写连接不上 默认的会去c盘寻找密钥 可看输出

The authenticity of host 'github.com (20.205.243.166)' can't be established.
ED25519 key fingerprint is SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'github.com' (ED25519) to the list of known hosts.
git@github.com: Permission denied (publickey).

如果在当前工程下连接 应输入

```powershell
 ssh -i ./my_ssh_key -T git@github.com
```

Hi haki-haki-haki! You've successfully authenticated, but GitHub does not provide shell access.

这样的输出就是成功的

添加远程地址

git remote add origin git@github.com:你的用户名/git_test.git

`origin` 是远程仓库的常见命名

刚开始生成的时候ssh自动生成的地址

验证

```powershell
git remote -v
```

查看当前本地仓库绑定的远程仓库地址

PS D:\VGD_task\git_test> git remote -v
origin  git@github.com:haki-haki-haki/git_test.git (fetch)
origin  git@github.com:haki-haki-haki/git_test.git (push)

第一次推送

```powershell
git branch
#输出
#* master
```

查看你现在本地分支名字

输出会带一个 `*` 星号，星号后面就是你当前分支，两种情况：

- `* master` → 你的分支名是 master
- `* main` → 你的分支名是 main

如果是 main：

```powershell
git push -u origin main
```

如果是 `master`：

```powershell
git push -u origin master
```

`-u` 的作用是建立本地分支和远程分支的跟踪关系。
之后再推送通常只需要 `git push`。

然后可以去github的新建的仓库查看即可

如果是在当前工程下创建的公钥和私钥不能这么做

要先给当前仓库指定你项目里的私钥

```powershell
git config core.sshCommand "ssh -i D:/VGD_task/git_test/my_ssh_key"
```

带私钥测试连通，这次能正常保存服务器记录

```powershell
ssh -i ./my_ssh_key -T git@github.com
```

弹出确认输入 `yes`，出现成功提示再 push。

推送

```powershell
git push -u origin master
```

缘由：

Windows 系统 SSH 的固定规则：

启动 ssh 命令时，它只会自动读取路径：

```
C:\Users\你的用户名\.ssh\
```

只会在这里找 `id_ed25519` 私钥

你的私钥放在工程文件夹 `D:\VGD_task\git_test\my_ssh_key`，不在默认路径，SSH 自己找不到，必须手动告诉它私钥在哪。

## 以后每次更新代码的标准流程

```powershell
git add .
git commit -m "写清楚这次改了什么"
git push

```

## GitHub Desktop

图形化工具

需要下载在桌面，关联github账号

add最后一个就行

![img](/person_blog/notes-images/imported/github-remote-url.png)

![img](/person_blog/notes-images/imported/github-push-result.png)

提交成功后软件顶部会出现 `Push origin` 按钮，点击即可上传代码到 GitHub。

Summary (required)` 输入框必填，写本次修改说明，例如：`初次提交测试代码

Description 选填，详细写改动内容，不写也没关系

点击底部蓝色按钮

注意密钥和公钥不要提交上去

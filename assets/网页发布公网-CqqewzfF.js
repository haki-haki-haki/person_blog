const n=`# 网页发布公网

前备：github 服务器 html

整体流程

\`\`\`mermaid
flowchart LR
    PC["你的电脑"]
    GH["GitHub<br/>zero-to-tech 仓库"]
    SVR["云服务器<br/>~/zero-to-tech"]
    WEB["浏览器<br/>公网 IP"]

    %% 本地文件附属电脑
    PC --- F1[index.html]
    PC --- F2[style.css]
    PC --- F3[script.js]

    %% 推送链路
    PC -- git push --> GH
    GH -- git pull --> SVR
    SVR -.Nginx 以此目录为网站内容.-> WEB
\`\`\`

zero-to-tech是自定义的文件名

本节：让服务器从github把代码pull下来

让 Nginx 知道"网站内容现在在新的目录里”

## 登录服务器

终端 ssh ubuntu@你的公网IP  阿里云是 ssh root@你的公网IP

登录成功之后，终端提示符会变成 \`ubuntu@your-server:~$\`

## 确认git

一般云服务器默认安装了git 查看git存在

\`\`\`powershell
git --version
\`\`\`

Ubuntu 的云镜像通常会预装 Git，大概率你会看到类似 \`git version 2.x.x\`

## 云服务器和github建立ssh信任

把 GitHub 上的代码拉到服务器

GitHub支持两种clone地址 https and ssh

### https

（\`https://github.com/...\`）：如果你的仓库是 **Public**，clone 和 pull 不需要任何凭证，也就是说，你**可以直接跳过下面这一整步 SSH 配置**。但如果是 **Private**，HTTPS 每次 push / pull 都要你输用户名加一个 token，长期看比较烦。

### ssh

（\`git@github.com:...\`）：无论是Public还是Private，用ssh的话都需要先在这台机器上配一对 key、把公钥交给 GitHub，配过一次以后就一劳永逸。

生成ssh key

\`\`\`powershell
ssh-keygen -t ed25519 -C "你的邮箱"
\`\`\`

连续几个提示一路回车就行。完成后，\`~/.ssh/\` 里会生成两个文件：

- \`id_ed25519\`：私钥，不要外传

- \`id_ed25519.pub\`：公钥，下一步要加到 GitHub

  

  添加公钥到GitHub

  \`\`\`powershell
  cat ~/.ssh/id_ed25519.pub
  \`\`\`

验证连通性

\`\`\`powershell
ssh -T git@github.com
\`\`\`

第一次连接 GitHub 会问 \`Are you sure you want to continue connecting?\`，输入 \`yes\` 回车。

## clone 代码到云服务器

SSH 登录的是 \`ubuntu\` 用户，它有自己的家目录 \`/home/ubuntu/\`。把代码 clone 到这里

阿里云有点区别 一般家目录是/root

\`\`\`powershell
cd ~
git clone git@github.com:你的用户名/zero-to-tech.git

\`\`\`

## 了解Nginx配置文件

所在地点

\`\`\`powershell
cd /etc/nginx/
ls

\`\`\`

输出

\`\`\`powershell
conf.d          koi-win            nginx.conf       sites-enabled
fastcgi.conf    mime.types         proxy_params     snippets
fastcgi_params  modules-available  scgi_params      uwsgi_params
koi-utf         modules-enabled    sites-available  win-utf

\`\`\`

**真正的配置入口是 \`nginx.conf\`**

Nginx 启动的时候，**只直接读 \`nginx.conf\` 这一个文件**。其他你看到的所有目录（\`conf.d/\`、\`sites-enabled/\` 等等），都是 \`nginx.conf\` 用 \`include\` 指令"包含"进来的。

\`\`\`powershell
cat /etc/nginx/nginx.conf
\`\`\`

\`cat\` 出来内容不算少，但仔细看会发现里面**绝大部分是注释**（\`#\` 开头的行）。如果只看真正生效的部分，整个文件其实非常短：

\`\`\`powershell
user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 768;
}

http {
    sendfile on;
    tcp_nopush on;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    access_log /var/log/nginx/access.log;

    gzip on;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}

\`\`\`

- user www-data：Nginx 进程以哪个 Linux 用户身份运行
- **\`worker_processes auto\`**：开几个工作进程，\`auto\` 表示和 CPU 核数一致
- **\`pid\`**：进程 ID 写到哪个文件，给 \`systemctl\` 这类系统工具用
- **\`error_log\`**：错误日志写到哪里，Nginx 出问题时第一时间去这个文件里看
- **\`include modules-enabled/\\*.conf\`**：把动态模块的启用配置读进来——这是文件里第一个 \`include\`

\`http { ... }\`：HTTP 服务的全部配置

\`http { ... }\` 块**最关键的最后两句**

\`\`\`powershell
include /etc/nginx/conf.d/*.conf;
include /etc/nginx/sites-enabled/*;
\`\`\`

**把整个 \`/etc/nginx/\` 目录串起来的关键**

要改的 \`sites-enabled/default\`，之所以能影响整个 Nginx 的行为——**根源就是 \`nginx.conf\` 在这里 \`include\` 了它**。

\`\`\`
nginx.conf  (Nginx 启动只读这一个)
  ├─ 顶层：user / worker / pid / error_log
  ├─ events { ... }      并发参数
  └─ http { ... }        HTTP 服务全配置
      ├─ include mime.types
      ├─ include conf.d/*.conf
      └─ include sites-enabled/*   ←  我们要改的网站配置就是从这里被串进来的

\`\`\`

- \`sites-available/\` 里放的是你写过的**所有**网站配置，不管启不启用，都在这里留底
- \`sites-enabled/\` 里只放当前要让 Nginx 真正读到的那几个配置

\`sites-enabled/\` 里的"文件"其实不是真正的文件，而是指向 \`sites-available/\` 里某个文件的**软链接（symlink）**——你可以理解为 Windows 里的"快捷方式"

==最重要修改处==

\`\`\`powershell
cat /etc/nginx/sites-enabled/default

\`\`\`

\`\`\`powershell
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;

    server_name _;

    location / {
        try_files $uri $uri/ =404;
    }
}

\`\`\`

### \`server { ... }\`：一个网站的定义

最外层这一对大括号叫一个 **server 块**。	   一个 server 块 = 一个网站。

listen 80 告诉 Nginx：**监听 80 端口**         80 是 HTTP 的标准端口

\`root /var/www/html;\`：去哪里找文件		**当有人来访问时，去 \`/var/www/html\` 这个目录里找文件返回**

把pull过来的文件的地址放上去即可

demo

- 用户访问 \`http://你的IP/about.html\` → Nginx 去找 \`/var/www/html/about.html\`
- 用户访问 \`http://你的IP/css/main.css\` → Nginx 去找 \`/var/www/html/css/main.css\`

\`index index.html index.htm index.nginx-debian.html;\`：默认入口文件

**当用户访问的是一个目录而不是一个具体的文件时，用哪个文件代替**   一般把自己的放第一个

\`server_name _;\`：响应哪个域名

如果没有域名，只有 IP。这里就写一个 \`_\`，是一个占位符，表示"什么域名都接"

\`location / { try_files $uri $uri/ =404; }\`：路由规则

location 块是 Nginx 的"路由规则"，它的意思是：**对某一段 URL 路径，按某种方式处理**。

\`location /\` 表示"对所有路径都用这条规则"

**先按用户要的路径找文件，找不到就当作目录找，再找不到就返回 404**

修改

\`\`\`powershell
sudo vim /etc/nginx/sites-enabled/default

\`\`\`

进入 vim 之后：

1. 按 \`/\` 进入搜索模式
2. 输入 \`root /var\`，回车
3. 光标会定位到 \`root /var/www/html;\` 那一行
4. 按 \`i\` 进入插入模式
5. 把 \`/var/www/html\` 改成 \`/home/ubuntu/zero-to-tech\`
6. 改完之后这一行应该是：\`root /home/ubuntu/zero-to-tech;\`
7. 按 \`Esc\` 退出插入模式
8. 输入 \`:wq\`，回车，保存并退出

## 检查配置+重载nginx

语法检查

\`\`\`powershell
sudo nginx -t
#输出
#nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
#nginx: configuration file /etc/nginx/nginx.conf test is successful

\`\`\`

重新加载

\`\`\`powershell
sudo systemctl reload nginx
\`\`\`

## 打开浏览去输入公网

404 not found

修改身份

**Nginx 是以 \`www-data\` 这个用户的身份去读文件的**，不是以你登录用的 \`ubuntu\` 身份 而 \`www-data\` 要读到我们的 \`/home/ubuntu/zero-to-tech/index.html\`，它必须能**逐层走进**这条路径上的每一级文件夹

给予权限

\`\`\`powershell
sudo chmod o+x /home/ubuntu

\`\`\`

- \`o\` 指 **others**——“既不是属主、也不在属主组"的用户，Nginx 的 \`www-data\` 就属于这一类
- \`x\` 给的是”**能进入**这个目录"的权限（注意：是"能穿过"，不是"能列出里面有什么"）

## 后期更新

你的修改 修改之后操作

本地终端运行

\`\`\`powershell
cd ~/zero-to-tech
git add .
git commit -m "改一下标题"
git push

\`\`\`

返回到服务器终端

\`\`\`powershell
cd ~/zero-to-tech
git pull

\`\`\`

进入相对应的文件夹zero-to-tech

浏览器刷新即可
`;export{n as default};

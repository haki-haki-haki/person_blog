const n=`\r
\r
[TOC]\r
\r
\r
\r
# 服务器\r
\r
## 服务器简介\r
\r
1. 服务器本质：一台联网的计算机\r
\r
   服务器有公网IP（全球互联网唯一 IP 地址）\r
\r
- 公网IP 全球唯一性，互联网设备可直接主动连接服务器\r
\r
- 内网IP 运营商多层转发，不可被连接\r
\r
  网站需要服务器，任何设备需要主动找到，需要公网IP。\r
\r
2. 服务器随时运行\r
\r
   网站需要随时被访问，正常情况下服务器一直运行。\r
\r
3. 服务器Linux系统主流\r
\r
## 租云服务器\r
\r
### 云服务器\r
\r
- 轻量应用服务器\r
- 操作系统Ubuntu\r
- 确认机器有公网IP\r
\r
租借成功得到3个信息\r
\r
- 公网IP地址\r
- 登陆用户名 一般是ubuntu or root\r
- 登陆密码 第一次使用需要设置或者重置密码\r
\r
### 阿里云服务器试用\r
\r
eg：阿里云试用云服务器\r
\r
<img src="/person_blog/notes-images/aliyun-1.png" alt="阿里云 ECS 试用入口页面" style="max-width: 100%;" />\r
\r
<img src="/person_blog/notes-images/aliyun-2.png" alt="选择免费试用" style="max-width: 100%;" />\r
\r
<center>选择第一个即可试用</center>\r
\r
<img src="/person_blog/notes-images/aliyun-3.png" alt="选择 ECS 实例规格" style="max-width: 100%;" />\r
\r
<center>选择第一或者第二个即可</center>\r
\r
<img src="/person_blog/notes-images/aliyun-4.png" alt="选择 Ubuntu 系统镜像" style="max-width: 100%;" />\r
\r
<center>选择Ubuntu系统</center>\r
\r
点击防火墙，阿里云是网络与安全组，查看端口\r
\r
查看22端口是否开放  **SSH 协议默认端口**，专门用来**远程登录、管理 Linux / 云服务器**。\r
\r
查看80端口是否打开  HTTP协议\r
\r
\r
\r
### SSH连接服务器\r
\r
终端命令SSH\r
\r
\`\`\`powershell\r
ssh 用户域名@服务器公网IP\r
## 例如 ssh ubuntu@123.45.67.89\r
\`\`\`\r
\r
第一次输入中断会询问是否新人这台机器，回复yes\r
\r
接着输入密码，回车。\r
\r
登陆成功显示\r
\r
\`\`\`powershell\r
ubuntu@your-server:~$\r
\`\`\`\r
\r
\r
\r
### 用apt安装Nginx\r
\r
需要让服务器提供网页服务，需要软件Nginx\r
\r
#### Nginx\r
\r
- 持续坚挺80端口\r
- 游泳裤请求80端口，返回相应的应答\r
\r
\`\`\`powershell\r
sudo apt update\r
sudo apt install nginx -y\r
\`\`\`\r
\r
- \`sudo\`：以更高权限执行命令（类似 Windows 上的“以管理员身份运行”）\r
- \`apt\`：Ubuntu 上的软件安装工具\r
\r
### 用IP地址访问默认界面\r
\r
需要提前确认80端口的放行\r
\r
打开浏览器，输入 \`http://你的服务器公网IP\`\r
\r
<img src="/person_blog/notes-images/aliyun-5.png" alt="Nginx 默认欢迎页面" style="max-width: 100%;" />\r
\r
<center>显示这个即成功</center>\r
\r
## 参考\r
\r
https://www.aliyun.com/product/ecs\r
\r
https://xn--ygr25xpohxwz.com/zero-to-fullstack/lessons/module-2-4/\r
\r
\r
\r
\r
\r
`;export{n as default};

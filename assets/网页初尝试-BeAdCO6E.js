const r=`[TOC]\r
\r
\r
\r
# Internet\r
\r
## 网页初尝试\r
\r
### 命令端创建文件html\r
\r
\`\`\`powershell\r
cd ~\r
mkdir zero-to-tech\r
cd zero-to-tech\r
touch index.html\r
\r
\`\`\`\r
\r
### 写入测试代码\r
\r
\`\`\`html\r
<!DOCTYPE html>\r
<html lang="zh-CN">\r
  <head>\r
    <meta charset="UTF-8">\r
    <title>我的第一个网页</title>\r
  </head>\r
  <body>\r
    <h1>你好，互联网</h1>\r
    <p>这是我的第一个网页，现在它还只是一个本地的 HTML 文件。</p>\r
  </body>\r
</html>\r
\r
\`\`\`\r
\r
### 尝试查看\r
\r
命令段输入\r
\r
\`\`\`powershell\r
cat ~/zero-to-tech/index.html\r
\`\`\`\r
\r
### 尝试打开\r
\r
电脑优先会试用浏览器打开\r
\r
#### 1.终端快速打开\r
\r
在当前工程文件夹下\r
\r
\`\`\`powershell\r
open ~/zero-to-tech\r
\`\`\`\r
\r
#### 2.终端跳过Finder\r
\r
\`\`\`powershell\r
open ~/zero-to-tech/index.html\r
## windows不一定能用open\r
\`\`\`\r
\r
\r
\r
## html与网页\r
\r
- html文件时网页内容的一个源文件\r
- 浏览器负责读取，显示成网页\r
- html包含了 页面结构定义+文字内容\r
\r
## 服务器\r
\r
浏览器能打开本地的网页文件，也能访问远程电脑提供的网页内容，这台远程的电脑就是服务器。\r
\r
前文所写的html文件只能在本地被打开，外部不能访问。\r
\r
\r
\r
### 浏览器访问流程\r
\r
浏览器访问网页时，需要找到服务器。在网络世界，一台联网设备需要地址（120.55.66.77），即IP地址（对于机器来说时IP地址，对人来说不友好，因此有了域名，如baidu.com）\r
\r
\r
\r
### DNS负责翻译域名位IP地址\r
\r
在浏览器中我们输入的一般是域名，会被DNS自动翻译成IP地址\r
\r
\r
\r
### 端口\r
\r
一台服务器不止有一个服务。它可能同时运行好几个服务，因此需要端口（一台电脑的不同入口）。一个服务器在同一个IP地址上可以开多个端口。\r
\r
常见端口：\r
\r
- 80 与普通网页相关\r
- 443和HTTPS加密访问有关\r
\r
访问http://xxxx.com 就是在请求服务器的90端口\r
\r
访问https://xxxx.com 就是在请求服务器443端口`;export{r as default};

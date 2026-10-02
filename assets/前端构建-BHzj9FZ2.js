const n=`# 前端构建\r
\r
前备：\r
\r
- 模块化之后，代码不能双击index.html打开，得打开ES模块走服务器（没改一行代码都给oush 上服务器pull 再刷新）\r
- 打开页面，服务器要拉很多页面 F12看Network有很多请求，加载慢\r
- 修改CSS，刷新未变化（浏览器存的旧的缓存，不去取新的，因为文件名相同）\r
\r
## 构建工具 build tool\r
\r
npm  and  vite\r
\r
目的\r
\r
- **工程治理**：希望项目规范、安全、好维护、好扩展（模块化、拆文件，都是为它）；\r
- **开发者**：希望写得简单、顺手、舒服；\r
- **浏览器与最终用户**：希望加载更快、资源更少、性能更高\r
\r
build tool 作用\r
\r
- 本地起服务器 修改自动保存更新（热更新）\r
- 将文件合成 （把模块化的问价合成1个，减少网络请求）\r
- 给问价加hash（指纹），哈希  重新取，不去取缓存\r
\r
### Vite\r
\r
Vite 这个工具，本身是用 **JavaScript** 写的，需要有运行JS的环境\r
\r
**Node.js** （ **JavaScript 跳出浏览器、在你电脑上直接运行"的运行环境**），Node 还**附赠附加了一个非常重要的东西——一个**包管理工具**，叫 **npm （可以装各种js的工具和库）\r
\r
先装nodejs  验证\r
\r
\`\`\`powershell\r
node -v       # 看到 v20.x.x 之类\r
npm -v        # 看到 10.x.x 之类\r
\`\`\`\r
\r
npm与apt区别\r
\r
- **apt 给整台电脑装东西**——装一个 nginx，全系统都能用。\r
- **npm 默认给"当前这一个项目"装东西**——这个项目用 anime.js 4.4，那个项目用 anime.js 3.0，两边各装各的、互不干扰。\r
\r
#### 初始化\r
\r
在当前工程下输入命令\r
\r
\`\`\`powershell\r
npm init -y\r
\`\`\`\r
\r
运行完会生成 \`package.json\`文件 内瓤如下\r
\r
\`\`\`powershell\r
{\r
  "name": "zero-to-tech",\r
  "version": "1.0.0",\r
  "description": "> 这是 零到全栈 · 模块 4.1 …… 的配套代码—— > 网站模块化改造之前的起点版本。",\r
  "main": "index.js",\r
  "scripts": {\r
    "test": "echo \\"Error: no test specified\\" && exit 1"\r
  },\r
  "keywords": [],\r
  "author": "",\r
  "license": "ISC",\r
  "type": "commonjs"\r
}\r
\`\`\`\r
\r
- **\`name\`**：项目叫什么。默认取**你的文件夹名**——它只是个名字，对我们的项目并不关键。\r
- **\`version\`**：项目自己的版本号，默认 \`1.0.0\`，可改可不改，也不关键。\r
\r
\r
\r
解释： package.json 就是项目的npm档案 npm装的文件和库，运行什么命令都在此记录下来。\r
\r
---\r
\r
JSON格式\r
\r
纯文本承载数据的通用格式 由“键”：值组成\r
\r
\r
\r
#### 装vite\r
\r
\`\`\`powershell\r
npm install -D vite\r
\`\`\`\r
\r
 **\`-D\`**（即 \`--save-dev\`）：意思是"把 Vite 装成**开发依赖**"\r
\r
安装由两种\r
\r
- 作为依赖库，本身不作为项目 （加 -D）\r
- 本身作为项目，是项目的一部分 （不加 -D）\r
\r
运行完多出\`node_modules\` 文件夹（Vite连同它的依赖都会被装进去）\r
\r
\`package.json\` 有了变化，同时还多出一个 \`package-lock.json\`\r
\r
\`\`\`powershell\r
{\r
  ...\r
  "devDependencies": {\r
    "vite": "^7.0.0"\r
  }\r
}\r
\`\`\`\r
\r
npm **自动加上的**——含义是"这个项目用了 vite，版本 \`^7.0.0\`"（\`^\` 表示"7 这个大版本里的最新，但不跳到 8"，相当于帮你**锁住版本范围**\r
\r
\r
\r
package-lock.json  这次**实际安装的每个包的精确版本**逐一锁死，确保你换一台电脑、或同事拉下来 \`npm install\` 时，装出来的东西**完全一致** ,起到锁死版本的作用，并且需要提交到git上去。\r
\r
\r
\r
vite装进node_modules，但这个文件夹有两个vite\r
\r
- **\`node_modules/vite/\`** —— 一个文件夹，是 vite 的**代码本体**\r
- **\`node_modules/.bin/vite\`** —— 一条**可执行命令**（把vite运行起来的开关接口）\r
\r
**想看 vite 的代码** → \`node_modules/vite/\`； **想运行 vite 这条命令** → \`node_modules/.bin/vite\`。\r
\r
\r
\r
#### 开发服务器+打包\r
\r
\`\`\`powershell\r
./node_modules/.bin/vite\r
\`\`\`\r
\r
<img src="/person_blog/notes-images/frontend-build-vite-dev.png" alt="Vite 开发服务器启动输出" style="max-width: 100%;" />\r
\r
用浏览器访问这个本地服务器 端口5173\r
\r
打开网站跑起来，修改一行代码自动刷新，这是热更新。\r
\r
\r
\r
#### build 打包成线上版本\r
\r
“合并文件、加 hash"这两件，则是在**上线打包**时完成的\r
\r
先Control + C 停止本地服务器的开发\r
\r
\`\`\`powershell\r
./node_modules/.bin/vite build\r
\r
\`\`\`\r
\r
<img src="/person_blog/notes-images/frontend-build-vite-build.png" alt="Vite build 打包输出" style="max-width: 100%;" />\r
\r
==注意html文件的名字一定要是index 否则build这里会报错，默认去寻找index.html==\r
\r
build完成 ， 多一个 dist文件夹\r
\r
dist/\r
├── index.html\r
└── assets/\r
    ├── main-Beya6efK.css     ← 你那 8 个 css，合并成了这 1 个\r
    └── main-_go62SDo.js      ← 你那几个 js 模块，合并成了这 1 个\r
\r
自动打包，多个合成一个，网络请求降低\r
\r
\r
\r
注意文件名上挂的那串"乱码” \`main-Beya6efK.css\`——它就是 **hash**，由文件内容计算而来。**内容一改，名字就变** 这样每次服务器就不会自动加载缓存了，因为文件名在改变\r
\r
\r
\r
dist里面也有index.html Vite 打包时**默认只认根目录那一个 \`index.html\` 作为入口**\r
\r
\r
\r
#### preview 上线本地检验\r
\r
\`dist\` 是打包好的产物，但不要**双击** \`dist/index.html\`——它里头仍是 \`<script type="module">\`，依然**不能用 file:// 双击打开**（与 4.1 同理，模块必须走服务器）。要在本地查看打包结果是否正确，用：\r
\r
\`\`\`powershell\r
./node_modules/.bin/vite preview\r
\`\`\`\r
\r
<img src="/person_blog/notes-images/frontend-build-vite-preview.png" alt="Vite preview 预览服务器启动" style="max-width: 100%;" />\r
\r
端口号更改\r
\r
它会起一个服务器，专门伺服 \`dist\`。打开后按 F12 看 Network  请求少了很多\r
\r
<img src="/person_blog/notes-images/frontend-build-network-tab.png" alt="浏览器 Network 面板" style="max-width: 100%;" />\r
\r
但是笔者这里只是一个简单的测试界面的html 并没有什么网络请求\r
\r
\`preview\` 看的是 \`dist\` 里的真实产物 这里面才是服务器跑的  而原来写的index.html是源码，给人看的。\r
\r
 源代码 ≠ 运行的代码\r
\r
\r
\r
#### npm run的作用\r
\r
\`./node_modules/.bin/vite\` 太长了，可以用npm run\r
\r
用到了package.json黎曼的scripts 给常用的命令登记一个简短的别名\r
\r
\`\`\`powershell\r
"scripts": {\r
  "dev": "vite",\r
  "build": "vite build",\r
  "preview": "vite preview"\r
}\r
\`\`\`\r
\r
以后可以在终端这样\r
\r
\`\`\`powershell\r
npm run dev       # = ./node_modules/.bin/vite\r
npm run build     # = ./node_modules/.bin/vite build\r
npm run preview   # = ./node_modules/.bin/vite preview\r
\`\`\`\r
\r
#### 汇总\r
\r
| \`npm run dev\`     | 起本地服务器，随改随看、热更新 | **开发时**，写代码全程             |\r
| ----------------- | ------------------------------ | ---------------------------------- |\r
| \`npm run build\`   | 打包成 \`dist/\`                 | **上线前**，生成给浏览器运行的版本 |\r
| \`npm run preview\` | 本地起服务器预览 \`dist\`        | **上线前自测**，确认产物是否正确   |\r
\r
\r
\r
#### .gitignore 不需要提交\r
\r
node_modules和dist这两个繁琐的文件不需要提交到git 都是随时能重新自动生成的产物\r
\r
- \`node_modules\`：照着 \`package.json\`，运行一次 \`npm install\` 就能**重装出来**。\r
- \`dist\`：照着源代码，运行一次 \`npm run build\` 就能**重新打包出来**。\r
\r
\`.gitignore\`，写上：\r
\r
\`\`\`powershell\r
node_modules\r
dist\r
\`\`\`\r
\r
git提交的是源码\r
\r
\r
\r
#### nom管依赖\r
\r
遗留： **anime.js 至今仍是从一个 CDN 网址拉取的** 还会导致很久的网络响应，将其安装到本地\r
\r
\`\`\`powershell\r
npm install animejs\r
\`\`\`\r
\r
回到源码的js文件，把请求 anime.js 的网址更换\r
\r
\`\`\`powershell\r
import { animate, stagger } from "animejs";\r
\`\`\`\r
\r
修改完继续 npm run build\r
\r
`;export{n as default};

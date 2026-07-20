# 个人博客部署教程

这份教程按当前项目来写。你的项目是一个基于 **Vite + React + TypeScript** 的网页，仓库地址是：

```text
https://github.com/haki-haki-haki/person_blog
```

部署后的访问地址是：

```text
https://haki-haki-haki.github.io/person_blog/
```

项目已经配置好了 GitHub Pages 部署。以后你自己改完代码，只要按下面步骤操作，就可以把新版本发布到线上。

## 先理解几个概念

本地项目是你电脑里的代码文件夹。你在这里改页面、改图片、改笔记。

GitHub 仓库是远程代码备份地址。你把本地代码推送到 GitHub 后，GitHub 才能拿到你的最新代码。

GitHub Pages 是 GitHub 提供的静态网页托管服务。它可以把你的 `dist` 构建产物发布成一个网址。

这个项目有两个重要分支：

```text
main
```

`main` 分支放源码，也就是 React、CSS、图片、笔记这些开发文件。

```text
gh-pages
```

`gh-pages` 分支放构建后的网页文件，也就是浏览器真正访问的静态文件。

你平时主要操作 `main` 分支。只有手动部署时，`npm run deploy` 会自动更新 `gh-pages` 分支。

## 第一次准备

先确认电脑已经安装这些东西：

```text
Git
Node.js
npm
```

在命令行里分别输入：

```bash
git --version
node -v
npm -v
```

如果都能显示版本号，说明环境基本没问题。

如果没有安装：

```text
Git: https://git-scm.com/
Node.js: https://nodejs.org/
```

Node.js 安装 LTS 版本就行。安装 Node.js 后，`npm` 会一起安装。

## 克隆项目

如果你换了一台新电脑，先把 GitHub 上的项目下载到本地：

```bash
git clone https://github.com/haki-haki-haki/person_blog.git
```

进入项目目录：

```bash
cd person_blog
```

如果你已经有这个项目文件夹，就直接进入项目目录即可。

## 安装依赖

第一次拿到项目后，需要安装依赖：

```bash
npm install
```

安装完成后，项目里会出现 `node_modules` 文件夹。这个文件夹不用上传 GitHub，因为 `.gitignore` 已经忽略了它。

## 本地运行

开发时先在本地跑起来：

```bash
npm run dev
```

命令行会显示一个本地地址，通常类似：

```text
http://localhost:5173/person_blog/
```

打开这个地址，就能看到你的博客。

如果页面打不开，优先看命令行有没有报错。常见原因是依赖没装好，可以重新执行：

```bash
npm install
```

然后再运行：

```bash
npm run dev
```

## 修改内容

常见文件位置如下：

```text
src/pages/
```

这里放主要页面，比如首页、学习页、生活页。

```text
src/styles/
```

这里放样式文件。

```text
public/life-photos/
```

这里放生活页胶卷照片，目前命名规则是：

```text
photo-1.jpg
photo-2.jpg
photo-3.jpg
...
photo-9.jpg
```

如果你要替换生活页照片，直接把新图片改成同样的名字，放进 `public/life-photos/` 里覆盖原图片。

```text
public/notes-images/
```

这里放笔记里用到的图片。

```text
笔记/
```

这里放 Markdown 笔记内容。

## 图片路径怎么写

放在 `public` 目录里的图片，构建后会直接出现在网站根路径下面。

比如这个文件：

```text
public/life-photos/photo-1.jpg
```

在线上访问路径会变成：

```text
https://haki-haki-haki.github.io/person_blog/life-photos/photo-1.jpg
```

在 React 代码里不要直接写死 `/life-photos/photo-1.jpg`，因为你的网页不是部署在域名根目录，而是部署在 `/person_blog/` 下面。

推荐用：

```ts
const basePath = import.meta.env.BASE_URL;
const imageUrl = `${basePath}life-photos/photo-1.jpg`;
```

当前项目的 `Life` 页面就是这样写的，所以发布到 GitHub Pages 后图片能正常显示。

## 为什么要配置 base

你的 GitHub Pages 地址是：

```text
https://haki-haki-haki.github.io/person_blog/
```

它不是：

```text
https://haki-haki-haki.github.io/
```

所以 Vite 需要知道网站根路径是 `/person_blog/`。

当前项目的 `vite.config.ts` 里已经写好了：

```ts
export default defineConfig({
  base: '/person_blog/',
})
```

如果以后仓库名改了，比如改成 `my_blog`，这里也要改成：

```ts
base: '/my_blog/',
```

同时 React Router 的 `basename` 也要对应修改：

```tsx
<BrowserRouter basename="/person_blog">
```

仓库名和 `base`、`basename` 不一致时，最常见的问题就是页面空白、CSS 丢失、图片打不开。

## 构建项目

发布前先本地构建一次：

```bash
npm run build
```

这个命令会做两件事：

```text
tsc -b
vite build
```

`tsc -b` 会检查 TypeScript。

`vite build` 会生成生产环境文件。

构建成功后，会生成：

```text
dist/
```

`dist` 里面就是可以发布到网页上的静态文件。

如果构建失败，不要急着推送。先看报错内容，通常是 TypeScript 类型错误、文件路径错误、图片不存在、组件导入路径写错。

## 本地预览构建结果

构建成功后，可以预览 `dist` 里的生产版本：

```bash
npm run preview
```

打开命令行显示的地址，通常是：

```text
http://localhost:4173/person_blog/
```

这个页面更接近 GitHub Pages 线上的效果。

你可以重点看：

1. 首页能不能打开。
2. 导航能不能跳转。
3. 生活页图片能不能显示。
4. 笔记页里的图片能不能显示。
5. 刷新二级页面后是否还能正常显示。

如果本地预览都正常，线上大概率也正常。

## 提交到 GitHub

改完代码后，先查看改动：

```bash
git status
```

把所有改动加入暂存区：

```bash
git add .
```

提交：

```bash
git commit -m "Update blog"
```

推送到 GitHub：

```bash
git push origin main
```

推送成功后，GitHub 仓库里的源码就更新了。

## 自动部署方式

当前项目已经有 GitHub Actions 自动部署文件：

```text
.github/workflows/deploy.yml
```

它的作用是：当你把代码推送到 `main` 或 `master` 分支时，GitHub 自动执行：

```bash
npm install
npm run build
```

然后把 `dist` 发布到 GitHub Pages。

所以正常情况下，你只需要：

```bash
git add .
git commit -m "Update blog"
git push origin main
```

然后等 GitHub Actions 跑完即可。

查看部署状态：

1. 打开 GitHub 仓库。
2. 点击上方的 `Actions`。
3. 找到最新一次 `Deploy to GitHub Pages`。
4. 如果显示绿色成功，说明部署完成。

部署完成后打开：

```text
https://haki-haki-haki.github.io/person_blog/
```

如果刚部署完还没变化，等 1 到 3 分钟，或者强制刷新浏览器缓存。

## 手动部署方式

如果你不想等 GitHub Actions，或者自动部署暂时有问题，可以手动部署：

```bash
npm run build
npm run deploy
```

当前项目的 `package.json` 里有这个脚本：

```json
{
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}
```

`npm run deploy` 会把 `dist` 文件夹发布到 `gh-pages` 分支。

手动部署成功后，命令行会显示：

```text
Published
```

然后打开：

```text
https://haki-haki-haki.github.io/person_blog/
```

## GitHub Pages 设置

如果页面打不开，需要检查 GitHub Pages 设置。

进入仓库：

```text
Settings -> Pages
```

常见有两种配置方式。

如果使用 GitHub Actions 自动部署，Source 应该选择：

```text
GitHub Actions
```

如果使用 `gh-pages` 分支手动部署，Source 可以选择：

```text
Deploy from a branch
```

分支选择：

```text
gh-pages
```

目录选择：

```text
/(root)
```

当前项目两种方式都能用。更推荐自动部署，因为你只需要推送 `main` 分支即可。

## 常见问题

### 页面空白

先运行：

```bash
npm run build
```

如果本地构建失败，先修复报错。

如果本地构建成功，但线上空白，检查 `vite.config.ts`：

```ts
base: '/person_blog/',
```

再检查 `src/App.tsx`：

```tsx
<BrowserRouter basename="/person_blog">
```

两处都要和仓库名一致。

### CSS 没加载

通常是 `base` 配错了。

打开浏览器开发者工具，看网络请求里 CSS 地址是不是类似：

```text
https://haki-haki-haki.github.io/person_blog/assets/xxx.css
```

如果变成：

```text
https://haki-haki-haki.github.io/assets/xxx.css
```

说明 `base` 没配置对。

### 图片不显示

先确认图片真的在项目里。

生活页照片应该在：

```text
public/life-photos/
```

笔记图片应该在：

```text
public/notes-images/
```

然后确认文件名大小写完全一致。GitHub Pages 对大小写敏感：

```text
photo-1.jpg
Photo-1.jpg
```

这两个在线上是不同文件。

如果你在 Windows 上能显示，但线上不能显示，很多时候就是大小写不一致。

### 刷新二级页面 404

比如打开：

```text
https://haki-haki-haki.github.io/person_blog/life
```

然后刷新，可能会遇到 404。

当前项目的 `vite.config.ts` 已经写了一个插件，会在构建后把 `index.html` 复制成 `404.html`：

```ts
const copyIndexTo404 = () => {
  return {
    name: 'copy-index-to-404',
    closeBundle() {
      const indexPath = path.resolve(__dirname, './dist/index.html')
      const fourOhFourPath = path.resolve(__dirname, './dist/404.html')
      const content = readFileSync(indexPath, 'utf-8')
      writeFileSync(fourOhFourPath, content)
    },
  }
}
```

这样 GitHub Pages 遇到二级页面刷新时，会回退到 React 应用，再由 React Router 显示正确页面。

如果以后你删掉这个插件，二级页面刷新可能会重新出现 404。

### Git push 失败

如果提示没有权限，先确认你登录的是正确的 GitHub 账号。

可以看远程地址：

```bash
git remote -v
```

应该能看到：

```text
https://github.com/haki-haki-haki/person_blog.git
```

如果 GitHub 要求登录，按提示登录即可。

如果你用 HTTPS 推送失败，可以考虑使用 GitHub Desktop，或者配置 SSH key。

### 线上还是旧版本

GitHub Pages 有缓存。

可以先等 1 到 3 分钟。

也可以在浏览器里强制刷新：

```text
Ctrl + F5
```

或者在网址后面加一个参数：

```text
https://haki-haki-haki.github.io/person_blog/?v=2
```

这可以绕过一部分浏览器缓存。

## 以后每次更新怎么做

你平时更新博客，可以按这个顺序来：

```bash
git pull origin main
npm install
npm run dev
```

改代码、改文章、换图片。

本地看没问题后：

```bash
npm run build
npm run preview
```

确认生产预览没问题后：

```bash
git status
git add .
git commit -m "Update blog"
git push origin main
```

如果你想直接手动发布：

```bash
npm run deploy
```

最后打开线上地址检查：

```text
https://haki-haki-haki.github.io/person_blog/
```

## 最重要的几个文件

```text
package.json
```

这里定义项目命令，比如：

```json
"dev": "vite",
"build": "tsc -b && vite build",
"preview": "vite preview",
"deploy": "gh-pages -d dist"
```

```text
vite.config.ts
```

这里配置 Vite，最关键的是：

```ts
base: '/person_blog/',
```

```text
src/App.tsx
```

这里配置路由，最关键的是：

```tsx
<BrowserRouter basename="/person_blog">
```

```text
.github/workflows/deploy.yml
```

这里配置 GitHub Actions 自动部署。

```text
public/
```

这里放需要直接发布的静态资源，比如生活照片、笔记图片。

## 一句话记住流程

本地改完先 `npm run build`，构建没问题就 `git push origin main`，GitHub 会自动部署；如果想马上发布，就再执行 `npm run deploy`。

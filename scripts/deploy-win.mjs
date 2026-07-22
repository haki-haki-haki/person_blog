/**
 * Windows 部署脚本 - 只复制 index.html 实际引用的资源文件
 * 用法: node scripts/deploy-win.mjs
 */
import { execSync } from 'child_process';
import { existsSync, readFileSync, mkdirSync, copyFileSync, cpSync } from 'fs';
import { join, dirname } from 'path';

const DIST = join(process.cwd(), 'dist');
const DEPLOY_DIR = join(process.cwd(), '.gh-pages-deploy');

function run(cmd, allowNonZero = false) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).toString().trim();
  } catch (e) {
    if (allowNonZero) return '';
    throw e;
  }
}

console.log('📦 Starting deploy...');

if (!existsSync(DIST)) {
  console.error('❌ dist/ not found. Run npm run build first.');
  process.exit(1);
}

// 清理
run(`rd /s /q "${DEPLOY_DIR}"`, true);
mkdirSync(DEPLOY_DIR, { recursive: true });

// 读取 index.html，提取所有引用的资源路径（js, css）
const indexHtml = readFileSync(join(DIST, 'index.html'), 'utf-8');
const assetRegex = /(?:src|href)=["']\/person_blog\/([^"']+)["']/g;
const assets = new Set();
let m;
while ((m = assetRegex.exec(indexHtml)) !== null) {
  assets.add(m[1]);
}
console.log(`Found ${assets.size} assets in index.html`);

// 复制 index.html
run(`robocopy "${DIST}" "${DEPLOY_DIR}" index.html /NFL /NDL /NJH /NJS /R:0 /W:0`, true);

// 复制 404.html（如果存在）
run(`robocopy "${DIST}" "${DEPLOY_DIR}" 404.html /NFL /NDL /NJH /NJS /R:0 /W:0`, true);

// 收集需要复制的文件
const filesToCopy = new Set();
for (const asset of assets) {
  filesToCopy.add(join(asset));
}

// 对于懒加载的 chunk，index.html 不直接引用但需要通过动态 import 加载
// 所以直接复制整个 assets 目录（但用 robocopy /MIR 只复制最新的）
// 由于无法删旧文件，换个策略：直接复制所有 assets 子目录内容
run(`robocopy "${join(DIST, 'assets')}" "${join(DEPLOY_DIR, 'assets')}" /E /NFL /NDL /NJH /NJS /R:0 /W:0 /PURGE`, true);

// 复制 public 目录下的资源（notes-images 等）
run(`robocopy "${join(DIST, 'notes-images')}" "${join(DEPLOY_DIR, 'notes-images')}" /E /NFL /NDL /NJH /NJS /R:0 /W:0`, true);
run(`robocopy "${join(DIST, 'person_blog')}" "${join(DEPLOY_DIR, 'person_blog')}" /E /NFL /NDL /NJH /NJS /R:0 /W:0`, true);

// 初始化 git
const remoteUrl = run('git remote get-url origin');
run(`git init -b gh-pages "${DEPLOY_DIR}"`);
run(`cd "${DEPLOY_DIR}" && git remote add origin "${remoteUrl}"`, true);
run(`cd "${DEPLOY_DIR}" && git add -A`);
run(`cd "${DEPLOY_DIR}" && git commit -m "deploy"`);
run(`cd "${DEPLOY_DIR}" && git push origin gh-pages --force`);

// 清理
run(`rd /s /q "${DEPLOY_DIR}"`, true);

console.log('✅ Deploy successful!');

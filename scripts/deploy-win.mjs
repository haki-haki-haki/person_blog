/**
 * Windows 部署脚本 - 用独立目录初始化 git 仓库推送到 gh-pages
 * 用法: node scripts/deploy-win.mjs
 */
import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, cpSync } from 'fs';
import { join } from 'path';

const DIST = join(process.cwd(), 'dist');
const DEPLOY_DIR = join(process.cwd(), '.gh-pages-deploy');

function run(cmd) {
  const result = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
  return result.toString().trim();
}

console.log('📦 Starting deploy...');

if (!existsSync(DIST)) {
  console.error('❌ dist/ not found. Run npm run build first.');
  process.exit(1);
}

// 清理并重建
if (existsSync(DEPLOY_DIR)) rmSync(DEPLOY_DIR, { recursive: true, force: true });
mkdirSync(DEPLOY_DIR, { recursive: true });

// 复制 dist 内容
cpSync(DIST, DEPLOY_DIR, { recursive: true });

// 在目录中初始化独立 git 仓库
const remoteUrl = run('git remote get-url origin');
run(`git init "${DEPLOY_DIR}"`);
run(`cd "${DEPLOY_DIR}" && git checkout -b gh-pages`);
run(`cd "${DEPLOY_DIR}" && git remote add origin "${remoteUrl}"`);
run(`cd "${DEPLOY_DIR}" && git add -A`);
run(`cd "${DEPLOY_DIR}" && git commit -m "deploy"`);
run(`cd "${DEPLOY_DIR}" && git push origin gh-pages --force`);

// 清理
rmSync(DEPLOY_DIR, { recursive: true, force: true });

console.log('✅ Deploy successful!');

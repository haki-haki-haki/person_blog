/**
 * Windows 部署脚本
 * 用法: node scripts/deploy-win.mjs
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

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

// 复制 dist（robocopy 退出码 0-7 都是成功）
run(`robocopy "${DIST}" "${DEPLOY_DIR}" /E /NFL /NDL /NJH /NJS /R:0 /W:0`, true);

// 初始化
const remoteUrl = run('git remote get-url origin');
run(`git init -b gh-pages "${DEPLOY_DIR}"`);
run(`cd "${DEPLOY_DIR}" && git remote add origin "${remoteUrl}"`, true); // 允许 origin 已存在
run(`cd "${DEPLOY_DIR}" && git add -A`);
run(`cd "${DEPLOY_DIR}" && git commit -m "deploy"`);
run(`cd "${DEPLOY_DIR}" && git push origin gh-pages --force`);

// 清理
run(`rd /s /q "${DEPLOY_DIR}"`, true);

console.log('✅ Deploy successful!');

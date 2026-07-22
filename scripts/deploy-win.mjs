/**
 * Windows 部署脚本 - 替代 npm run deploy (gh-pages 包在 Windows 长路径下 ENAMETOOLONG)
 * 用法: node scripts/deploy-win.mjs
 * 原理: 用 git worktree 创建独立的 gh-pages 分支副本，避免中文路径过长问题
 */
import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, cpSync } from 'fs';
import { join } from 'path';

const DIST = join(process.cwd(), 'dist');
const WORKTREE_DIR = join(process.cwd(), '.gh-pages-worktree');

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', ...opts }).trim();
  } catch (e) {
    const msg = e.stderr?.toString().trim() || e.message;
    throw new Error(`Command failed: ${cmd}\n${msg}`);
  }
}

try {
  console.log('📦 Starting deploy...');

  // 检查 dist 目录
  if (!existsSync(DIST)) {
    console.error('❌ dist/ directory not found. Run npm run build first.');
    process.exit(1);
  }

  // 清理旧的 worktree
  try { run(`git worktree remove "${WORKTREE_DIR}" --force`); } catch {}
  if (existsSync(WORKTREE_DIR)) rmSync(WORKTREE_DIR, { recursive: true, force: true });

  // 创建新的 worktree，基于 gh-pages 分支（如果不存在则创建孤立分支）
  try {
    run(`git worktree add "${WORKTREE_DIR}" origin/gh-pages`);
  } catch {
    // gh-pages 分支不存在，创建新的
    mkdirSync(WORKTREE_DIR, { recursive: true });
    run(`git init "${WORKTREE_DIR}"`);
    run(`cd "${WORKTREE_DIR}" && git checkout -b gh-pages`);
    run(`cd "${WORKTREE_DIR}" && git remote add origin ${run('git remote get-url origin')}`);
  }

  // 复制 dist 内容到 worktree
  rmSync(WORKTREE_DIR, { recursive: true, force: true });
  mkdirSync(WORKTREE_DIR, { recursive: true });
  cpSync(DIST, WORKTREE_DIR, { recursive: true });

  // 提交并推送
  run(`cd "${WORKTREE_DIR}" && git add -A`);
  run(`cd "${WORKTREE_DIR}" && git commit -m "deploy" --allow-empty`);
  run(`cd "${WORKTREE_DIR}" && git push origin gh-pages --force`);

  console.log('✅ Deploy successful!');
} catch (e) {
  console.error('❌', e.message);
  process.exit(1);
} finally {
  // 清理 worktree
  try { run(`git worktree remove "${WORKTREE_DIR}" --force`); } catch {}
  try { run(`git worktree prune`); } catch {}
}

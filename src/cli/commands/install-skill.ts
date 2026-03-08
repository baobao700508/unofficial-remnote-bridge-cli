/**
 * install skill 命令
 *
 * 薄层封装 Vercel Skills CLI（npx skills add），利用其交互式选择让用户适配不同 AI 编程工具。
 * npx 不可用时 fallback 到直接复制（仅 Claude Code）。
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, execSync } from 'child_process';

const GITHUB_REPO = 'baobao700508/unofficial-remnote-bridge-cli';
const SKILL_NAME = 'remnote-bridge';

export async function installSkillCommand(): Promise<void> {
  // 检测 npx 是否可用
  let hasNpx = false;
  try {
    execSync('npx --version', { stdio: 'pipe', timeout: 5000 });
    hasNpx = true;
  } catch {
    // npx 不可用
  }

  if (!hasNpx) {
    console.log('未检测到 npx，使用内置方式安装到 Claude Code...\n');
    copySkillFiles();
    return;
  }

  // 直接调用 npx skills add，继承 stdio 让用户看到交互式选择界面
  console.log(`通过 Vercel Skills CLI 安装 ${SKILL_NAME}...\n`);

  const child = spawn('npx', ['skills', 'add', GITHUB_REPO, '-s', SKILL_NAME], {
    stdio: 'inherit',
    shell: true,
  });

  await new Promise<void>((resolve) => {
    child.on('close', (code) => {
      if (code !== 0) {
        console.log(`\nVercel Skills CLI 退出码: ${code}`);
        console.log('如需使用内置方式安装（仅 Claude Code），请运行：');
        console.log('  remnote-bridge install skill --copy\n');
        process.exitCode = 1;
      }
      resolve();
    });
  });
}

export async function installSkillCopyCommand(): Promise<void> {
  copySkillFiles();
}

function copySkillFiles(): void {
  // 从包安装路径计算包根（dist/cli/commands/install-skill.js → 包根）
  const packageRoot = path.resolve(import.meta.dirname, '..', '..', '..');

  const skillDir = path.join(packageRoot, 'skills', 'remnote-bridge');
  const skillSource = path.join(skillDir, 'SKILL.md');
  const instructionDir = path.join(skillDir, 'instructions');

  if (!fs.existsSync(skillSource)) {
    console.error(`错误: 找不到 SKILL.md: ${skillSource}`);
    process.exitCode = 1;
    return;
  }

  // 目标目录
  const targetDir = path.join(os.homedir(), '.claude', 'skills', 'remnote-bridge');
  fs.mkdirSync(targetDir, { recursive: true });

  // 复制 SKILL.md
  fs.copyFileSync(skillSource, path.join(targetDir, 'SKILL.md'));
  console.log(`  SKILL.md → ${targetDir}/SKILL.md`);

  // 复制 instructions/*.md
  if (fs.existsSync(instructionDir)) {
    const targetInstructionDir = path.join(targetDir, 'instructions');
    fs.mkdirSync(targetInstructionDir, { recursive: true });
    const files = fs.readdirSync(instructionDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      fs.copyFileSync(
        path.join(instructionDir, file),
        path.join(targetInstructionDir, file),
      );
      console.log(`  ${file} → ${targetInstructionDir}/${file}`);
    }
  }

  console.log(`\nSkill 已安装到 ${targetDir}（仅 Claude Code）`);
  console.log('如需安装到其他 AI 工具，请运行：');
  console.log(`  npx skills add ${GITHUB_REPO} -s ${SKILL_NAME}\n`);
}

/**
 * install skill 命令
 *
 * 将 SKILL.md 和 docs/instruction/*.md 安装到 ~/.claude/skills/remnote-bridge/
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

export async function installSkillCommand(): Promise<void> {
  // 从包安装路径计算包根（dist/cli/commands/install-skill.js → 包根）
  const packageRoot = path.resolve(import.meta.dirname, '..', '..', '..');

  const skillSource = path.join(packageRoot, 'skill', 'SKILL.md');
  const instructionDir = path.join(packageRoot, 'docs', 'instruction');

  if (!fs.existsSync(skillSource)) {
    console.error(`错误: 找不到 SKILL.md: ${skillSource}`);
    process.exitCode = 1;
    return;
  }

  // 目标目录
  const targetDir = path.join(os.homedir(), '.claude', 'skills', 'remnote-bridge');
  fs.mkdirSync(targetDir, { recursive: true });

  // 复制 SKILL.md，更新 instruction 路径引用
  let skillContent = fs.readFileSync(skillSource, 'utf-8');
  const targetInstructionDir = path.join(targetDir, 'instruction');
  // 替换相对路径 docs/instruction/ 为安装后的绝对路径
  skillContent = skillContent.replace(
    /docs\/instruction\//g,
    targetInstructionDir + '/',
  );
  fs.writeFileSync(path.join(targetDir, 'SKILL.md'), skillContent, 'utf-8');
  console.log(`  SKILL.md → ${targetDir}/SKILL.md`);

  // 复制 docs/instruction/*.md
  if (fs.existsSync(instructionDir)) {
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

  console.log(`\nSkill 已安装到 ${targetDir}`);
}

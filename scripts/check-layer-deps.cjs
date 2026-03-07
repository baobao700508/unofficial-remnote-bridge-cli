#!/usr/bin/env node
/**
 * 层依赖方向检查
 *
 * 依据 AGENTS.md 2.1.2 约束：
 *   接入层 (src/mcp)
 *       ↓
 *   命令层 (src/cli)
 *       ↓
 *   桥接层 (remnote-plugin)
 *       ↓
 *   RemNote SDK
 *
 * 禁止反向依赖。
 */

const fs = require('fs');
const path = require('path');

// 层定义及其禁止依赖的层
// 新路径映射：src/cli、src/mcp、remnote-plugin
const RULES = [
  {
    layer: 'remnote-plugin',
    srcDir: 'remnote-plugin/src',
    label: '桥接层',
    forbidden: ['src/cli', 'src/mcp'],
    forbiddenLabels: ['命令层', '接入层'],
  },
  {
    layer: 'src/cli',
    srcDir: 'src/cli',
    label: '命令层',
    forbidden: ['src/mcp'],
    forbiddenLabels: ['接入层'],
  },
  {
    layer: 'src/mcp',
    srcDir: 'src/mcp',
    label: '接入层',
    forbidden: ['remnote-plugin'],
    forbiddenLabels: ['桥接层'],
  },
];

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function walkDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      results.push(...walkDir(fullPath));
    } else if (SOURCE_EXTENSIONS.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

function checkFile(filePath, forbidden) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 匹配 import/require 语句
    const importMatch =
      line.match(/(?:import|from)\s+['"]([^'"]+)['"]/) ||
      line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);

    if (!importMatch) continue;

    const importPath = importMatch[1];
    for (const forbiddenLayer of forbidden) {
      if (
        importPath === forbiddenLayer ||
        importPath.startsWith(forbiddenLayer + '/') ||
        importPath.includes('/' + forbiddenLayer + '/') ||
        importPath.includes('../' + forbiddenLayer)
      ) {
        violations.push({
          file: filePath,
          line: i + 1,
          import: importPath,
          forbiddenLayer,
        });
      }
    }
  }

  return violations;
}

// ── 通用内部分层检查函数 ──
// 用于检查一个 srcDir 内各子目录之间的依赖方向

function checkInternalDeps(srcDir, rules) {
  const violations = [];

  for (const rule of rules) {
    const subDir = path.join(srcDir, rule.subdir);
    if (!fs.existsSync(subDir)) continue;

    const files = walkDir(subDir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const importMatch =
          line.match(/(?:import|from)\s+['"]([^'"]+)['"]/) ||
          line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);

        if (!importMatch) continue;
        const importPath = importMatch[1];

        for (const forbiddenSub of rule.forbidden) {
          // 匹配相对路径中引用了禁止的子目录
          if (
            importPath.includes('../' + forbiddenSub + '/') ||
            importPath.includes('../' + forbiddenSub + "'") ||
            importPath === '../' + forbiddenSub ||
            importPath.includes('/' + forbiddenSub + '/')
          ) {
            violations.push({
              file,
              line: i + 1,
              import: importPath,
              from: rule.subdir,
              to: forbiddenSub,
            });
          }
        }
      }
    }
  }

  return violations;
}

// ── Plugin 内部分层约束 ──
// 核心链：bridge → services → utils（单向依赖）
// 宿主层：widgets（独立，可依赖 bridge，但核心链禁止反向依赖 widgets）
const PLUGIN_INTERNAL_RULES = [
  {
    subdir: 'utils',
    label: 'utils（辅助工具）',
    forbidden: ['services', 'bridge', 'widgets'],
  },
  {
    subdir: 'services',
    label: 'services（业务操作）',
    forbidden: ['bridge', 'widgets'],
  },
  {
    subdir: 'bridge',
    label: 'bridge（API 层）',
    forbidden: ['widgets'],
  },
];

// ── CLI 内部分层约束 ──
// handlers 不依赖 server/commands/daemon（通过构造注入解耦）
// commands 不依赖 server/handlers（通过 daemon/send-request 通信）
const CLI_INTERNAL_RULES = [
  {
    subdir: 'handlers',
    label: 'handlers（业务编排）',
    forbidden: ['server', 'commands', 'daemon'],
  },
  {
    subdir: 'commands',
    label: 'commands（CLI 入口）',
    forbidden: ['server', 'handlers'],
  },
];

// 执行检查
const rootDir = path.resolve(__dirname, '..');
let totalViolations = 0;

console.log('检查层依赖方向...\n');

for (const rule of RULES) {
  const layerSrcDir = path.join(rootDir, rule.srcDir);
  if (!fs.existsSync(layerSrcDir)) {
    console.log(`  ⏭  ${rule.layer}（${rule.label}）— 目录不存在，跳过`);
    continue;
  }

  const allFiles = walkDir(layerSrcDir);

  let violations = [];

  // 检查源代码 import
  for (const file of allFiles) {
    violations.push(...checkFile(file, rule.forbidden));
  }

  if (violations.length === 0) {
    console.log(`  ✅ ${rule.layer}（${rule.label}）— 无违规`);
  } else {
    console.log(`  ❌ ${rule.layer}（${rule.label}）— 发现 ${violations.length} 处违规：`);
    for (const v of violations) {
      const loc = v.line > 0 ? `:${v.line}` : '';
      console.log(`     ${path.relative(rootDir, v.file)}${loc}`);
      console.log(`       禁止依赖 ${v.forbiddenLayer}，但发现: ${v.import}`);
    }
    totalViolations += violations.length;
  }
}

// ── 跨层检查：src/mcp 不得 import src/cli（层边界） ──
// 已包含在 RULES 中（src/mcp forbidden 不含 src/cli，但 MCP 调 CLI 通过子进程而非 import）

// ── 内部分层检查（通用） ──
const INTERNAL_CHECKS = [
  {
    name: 'remnote-plugin',
    label: 'Plugin 内部分层',
    srcDir: path.join(rootDir, 'remnote-plugin', 'src'),
    rules: PLUGIN_INTERNAL_RULES,
  },
  {
    name: 'src/cli',
    label: 'CLI 内部分层',
    srcDir: path.join(rootDir, 'src', 'cli'),
    rules: CLI_INTERNAL_RULES,
  },
];

for (const check of INTERNAL_CHECKS) {
  console.log('');
  console.log(`检查 ${check.label}...\n`);

  if (fs.existsSync(check.srcDir)) {
    const internalViolations = checkInternalDeps(check.srcDir, check.rules);
    if (internalViolations.length === 0) {
      console.log(`  ✅ ${check.name} 内部分层 — 无违规`);
    } else {
      console.log(`  ❌ ${check.name} 内部分层 — 发现 ${internalViolations.length} 处违规：`);
      for (const v of internalViolations) {
        console.log(`     ${path.relative(rootDir, v.file)}:${v.line}`);
        console.log(`       ${v.from} 禁止依赖 ${v.to}，但发现: ${v.import}`);
      }
      totalViolations += internalViolations.length;
    }
  } else {
    console.log(`  ⏭  ${check.name} — 目录不存在，跳过`);
  }
}

console.log('');

if (totalViolations > 0) {
  console.log(`❌ 共 ${totalViolations} 处层依赖违规，请修正后再提交。`);
  process.exit(1);
} else {
  console.log('✅ 层依赖方向检查通过。');
  process.exit(0);
}

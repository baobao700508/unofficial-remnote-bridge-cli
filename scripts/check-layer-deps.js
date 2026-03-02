#!/usr/bin/env node
/**
 * 层依赖方向检查
 *
 * 依据 AGENTS.md 2.1.2 约束：
 *   接入层 (remnote-skills / remnote-mcp)
 *       ↓
 *   命令层 (remnote-cli)
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
const RULES = [
  {
    layer: 'remnote-plugin',
    label: '桥接层',
    forbidden: ['remnote-cli', 'remnote-mcp', 'remnote-skills'],
  },
  {
    layer: 'remnote-cli',
    label: '命令层',
    forbidden: ['remnote-mcp', 'remnote-skills'],
  },
  {
    layer: 'remnote-mcp',
    label: '接入层',
    forbidden: ['remnote-plugin'], // 必须通过 remnote-cli，不能直连 plugin
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

// 同时检查 package.json 的 dependencies
function checkPackageJson(layerDir, forbidden) {
  const pkgPath = path.join(layerDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return [];

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const violations = [];
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  for (const dep of Object.keys(allDeps)) {
    for (const forbiddenLayer of forbidden) {
      if (dep === forbiddenLayer) {
        violations.push({
          file: pkgPath,
          line: 0,
          import: `package.json dependency: "${dep}"`,
          forbiddenLayer,
        });
      }
    }
  }

  return violations;
}

// 执行检查
const rootDir = path.resolve(__dirname, '..');
let totalViolations = 0;

console.log('检查层依赖方向...\n');

for (const rule of RULES) {
  const layerDir = path.join(rootDir, rule.layer);
  if (!fs.existsSync(layerDir)) {
    console.log(`  ⏭  ${rule.layer}（${rule.label}）— 目录不存在，跳过`);
    continue;
  }

  const sourceFiles = walkDir(path.join(layerDir, 'src'));
  const testFiles = walkDir(path.join(layerDir, 'test'));
  const allFiles = [...sourceFiles, ...testFiles];

  let violations = [];

  // 检查源代码 import
  for (const file of allFiles) {
    violations.push(...checkFile(file, rule.forbidden));
  }

  // 检查 package.json
  violations.push(...checkPackageJson(layerDir, rule.forbidden));

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

console.log('');

if (totalViolations > 0) {
  console.log(`❌ 共 ${totalViolations} 处层依赖违规，请修正后再提交。`);
  process.exit(1);
} else {
  console.log('✅ 层依赖方向检查通过。');
  process.exit(0);
}

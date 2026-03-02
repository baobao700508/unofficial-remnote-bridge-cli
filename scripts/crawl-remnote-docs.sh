#!/usr/bin/env bash
# =============================================================================
# crawl-remnote-docs.sh
#
# 使用 wget + turndown 爬取 RemNote Plugin SDK 官方文档并转为 Markdown。
# 零成本，无需 API Key。
#
# 输出目录：docs/RemNote API Reference/
#
# 用法：
#   ./scripts/crawl-remnote-docs.sh          # 完整爬取
#   ./scripts/crawl-remnote-docs.sh --dry    # 仅列出将要爬取的页面
#   ./scripts/crawl-remnote-docs.sh --clean  # 清除上次爬取的缓存重新来
#
# 依赖：wget, node (>=18)
# 自动安装：turndown（HTML→Markdown，临时 npx 调用，不污染项目 node_modules）
# =============================================================================

set -euo pipefail

# ---- 配置 ----
SITE_URL="https://plugins.remnote.com"
SITE_DOMAIN="plugins.remnote.com"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/docs/RemNote API Reference"
CACHE_DIR="$PROJECT_ROOT/.cache/remnote-docs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# wget 配置
WGET_DELAY=1          # 请求间隔（秒），对服务器友好
WGET_RETRY=2          # 重试次数
WGET_TIMEOUT=30       # 超时（秒）

# ---- 颜色 ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }
step() { echo -e "${CYAN}[STEP]${NC} $*"; }

# ---- 前置检查 ----
if ! command -v wget &>/dev/null; then
    err "wget 未安装。macOS: brew install wget"
    exit 1
fi

if ! command -v node &>/dev/null; then
    err "node 未安装"
    exit 1
fi

# ---- Clean 模式 ----
if [[ "${1:-}" == "--clean" ]]; then
    log "清除缓存目录: $CACHE_DIR"
    rm -rf "$CACHE_DIR"
    log "已清除。再次运行脚本即可重新爬取。"
    exit 0
fi

# ---- Dry run 模式 ----
if [[ "${1:-}" == "--dry" ]]; then
    log "Dry run: 获取站点地图..."
    # Docusaurus 默认生成 sitemap.xml
    wget -q -O - "${SITE_URL}/sitemap.xml" 2>/dev/null \
        | grep -oP '(?<=<loc>)[^<]+' \
        || warn "未找到 sitemap.xml，将使用 wget 递归发现页面"
    exit 0
fi

# ---- 第一步：wget 递归下载 HTML ----
step "1/3 使用 wget 递归下载 HTML..."
mkdir -p "$CACHE_DIR"

wget \
    --recursive \
    --level=5 \
    --no-parent \
    --page-requisites=off \
    --adjust-extension \
    --convert-links=off \
    --restrict-file-names=unix \
    --domains="$SITE_DOMAIN" \
    --directory-prefix="$CACHE_DIR" \
    --wait="$WGET_DELAY" \
    --tries="$WGET_RETRY" \
    --timeout="$WGET_TIMEOUT" \
    --reject='*.css,*.js,*.png,*.jpg,*.jpeg,*.gif,*.svg,*.ico,*.woff,*.woff2,*.ttf,*.eot,*.map' \
    --reject-regex='(assets/|img/|fonts/)' \
    --no-verbose \
    "$SITE_URL/" 2>&1 | while IFS= read -r line; do
        # 只显示正在下载的 URL
        if [[ "$line" == *"URL:"* ]] || [[ "$line" == *"--"*"--"*"http"* ]]; then
            echo -e "  ${CYAN}↓${NC} $line"
        fi
    done || true  # wget 对 404 等返回非零退出码，不中断

HTML_COUNT=$(find "$CACHE_DIR" -name '*.html' | wc -l | tr -d ' ')
log "下载完成：${HTML_COUNT} 个 HTML 文件"

if [[ "$HTML_COUNT" -eq 0 ]]; then
    err "未下载到任何 HTML 文件，请检查网络连接"
    exit 1
fi

# ---- 第二步：HTML → Markdown ----
step "2/3 转换 HTML → Markdown..."
mkdir -p "$OUTPUT_DIR"

# 用内联 Node 脚本处理，通过 npx 临时调用 turndown
node -e "
const { execSync } = require('child_process');

// 检查 turndown 是否可用，不可用则自动安装
try {
    require.resolve('turndown');
} catch {
    console.log('正在安装 turndown...');
    execSync('npm install --no-save turndown 2>/dev/null', {
        cwd: '$PROJECT_ROOT',
        stdio: 'pipe'
    });
}

const TurndownService = require('turndown');
const fs = require('fs');
const path = require('path');

const cacheDir = '$CACHE_DIR/$SITE_DOMAIN';
const outputDir = '$OUTPUT_DIR';
const siteUrl = '$SITE_URL';
const timestamp = '$TIMESTAMP';

// 配置 turndown
const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
});

// 保留 code 块的语言标记
td.addRule('fencedCodeBlock', {
    filter: (node) => node.nodeName === 'PRE' && node.querySelector('code'),
    replacement: (content, node) => {
        const code = node.querySelector('code');
        const lang = (code.className || '').replace(/^language-/, '').split(' ')[0] || '';
        const text = code.textContent || '';
        return '\n\n\`\`\`' + lang + '\n' + text + '\n\`\`\`\n\n';
    }
});

// 递归查找所有 HTML 文件
function walkDir(dir) {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(walkDir(fullPath));
        } else if (entry.name.endsWith('.html')) {
            results.push(fullPath);
        }
    }
    return results;
}

const htmlFiles = walkDir(cacheDir);
let count = 0;

for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, 'utf-8');

    // 提取主内容区域（Docusaurus 的 article 或 main 标签）
    let contentHtml = html;
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (articleMatch) {
        contentHtml = articleMatch[1];
    } else if (mainMatch) {
        contentHtml = mainMatch[1];
    }

    // 跳过空内容
    if (!contentHtml.trim()) continue;

    const markdown = td.turndown(contentHtml);
    if (!markdown.trim()) continue;

    // 从文件路径推导 URL 和文件名
    let relativePath = path.relative(cacheDir, htmlFile)
        .replace(/\.html$/, '')
        .replace(/\/index$/, '');

    if (!relativePath || relativePath === '.') relativePath = 'index';

    const sourceUrl = siteUrl + '/' + relativePath.replace(/\\/\\\\/, '/');
    const fileName = relativePath.replace(/[\\/\\\\]/g, '_') + '.md';
    const filePath = path.join(outputDir, fileName);

    // 写入文件
    const header = '<!-- source: ' + sourceUrl + ' -->\n<!-- crawled: ' + timestamp + ' -->\n\n';
    fs.writeFileSync(filePath, header + markdown);
    count++;
}

console.log('转换完成: ' + count + ' 个 Markdown 文件');
" 2>&1

# ---- 第三步：生成索引 ----
step "3/3 生成索引文件..."

node -e "
const fs = require('fs');
const path = require('path');

const outputDir = '$OUTPUT_DIR';
const files = fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.md') && f !== 'INDEX.md' && !f.startsWith('_'))
    .sort();

let index = '# RemNote Plugin SDK Documentation Index\n\n';
index += '> 爬取时间: $TIMESTAMP\n';
index += '> 来源: $SITE_URL\n';
index += '> 文件数: ' + files.length + '\n\n';

const categories = {
    'Getting Started': [],
    'In-Depth Tutorial': [],
    'Advanced': [],
    'API Reference': [],
    'Other': []
};

for (const file of files) {
    if (file.startsWith('getting-started')) categories['Getting Started'].push(file);
    else if (file.startsWith('in-depth-tutorial')) categories['In-Depth Tutorial'].push(file);
    else if (file.startsWith('advanced')) categories['Advanced'].push(file);
    else if (file.startsWith('api')) categories['API Reference'].push(file);
    else categories['Other'].push(file);
}

for (const [cat, catFiles] of Object.entries(categories)) {
    if (catFiles.length === 0) continue;
    index += '## ' + cat + '\n\n';
    for (const f of catFiles) {
        const name = f.replace('.md', '').replace(/_/g, ' / ');
        index += '- [' + name + '](' + f + ')\n';
    }
    index += '\n';
}

fs.writeFileSync(path.join(outputDir, 'INDEX.md'), index);
console.log('索引已生成: INDEX.md');
"

# ---- 完成 ----
TOTAL=$(find "$OUTPUT_DIR" -name '*.md' ! -name '_*' | wc -l | tr -d ' ')
log "=========================================="
log "爬取完成！"
log "  文件数: ${TOTAL}"
log "  输出目录: $OUTPUT_DIR"
log "  缓存目录: ${CACHE_DIR}（可用 --clean 清除）"
log "=========================================="

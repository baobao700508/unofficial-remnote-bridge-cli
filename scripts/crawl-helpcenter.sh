#!/usr/bin/env bash
# =============================================================================
# crawl-helpcenter.sh
#
# 爬取 RemNote Help Center (Intercom) 并转为 Markdown。
# Help Center 是 Intercom + Next.js SSR，不支持 wget 递归，
# 改用两步法：1) 从 collection 页面提取文章链接  2) 逐个抓取文章内容
#
# 输出目录：docs/RemNote Help Center/
#
# 用法：
#   ./scripts/crawl-helpcenter.sh          # 完整爬取
#   ./scripts/crawl-helpcenter.sh --dry    # 仅列出将要爬取的文章
#   ./scripts/crawl-helpcenter.sh --clean  # 清除缓存重新来
#
# 依赖：curl, node (>=18)
# =============================================================================

set -euo pipefail

# ---- 配置 ----
SITE_URL="https://help.remnote.com"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/docs/RemNote Help Center"
CACHE_DIR="$PROJECT_ROOT/.cache/remnote-helpcenter"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

CURL_DELAY=1          # 请求间隔（秒）
CURL_RETRY=2          # 重试次数
CURL_TIMEOUT=30       # 超时（秒）

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
if ! command -v curl &>/dev/null; then
    err "curl 未安装"
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

# ---- Collection 列表 ----
COLLECTIONS=(
    "3939573-new-to-remnote"
    "3370931-flashcards"
    "3939584-editing"
    "3939590-getting-around"
    "3939575-linking-ideas"
    "3939579-structuring-content"
    "3692117-reading"
    "3939594-sharing-collaboration"
    "3939596-importing-exporting"
    "3939686-mobile-desktop-plugins"
    "3939601-settings-and-account"
    "3507701-troubleshooting"
    "3939602-plan-pricing-referrals"
    "3939591-workflows"
    "3939597-about-remnote"
)

# ---- 第一步：从每个 Collection 提取文章链接 ----
step "1/4 从 Collection 页面提取文章链接..."
mkdir -p "$CACHE_DIR/collections"
mkdir -p "$CACHE_DIR/articles"

ARTICLE_LIST="$CACHE_DIR/article-urls.txt"
> "$ARTICLE_LIST"

for collection in "${COLLECTIONS[@]}"; do
    collection_url="${SITE_URL}/en/collections/${collection}"
    collection_file="$CACHE_DIR/collections/${collection}.html"

    if [[ -f "$collection_file" ]]; then
        echo -e "  ${CYAN}(cached)${NC} $collection"
    else
        echo -e "  ${CYAN}↓${NC} $collection"
        curl -s --retry "$CURL_RETRY" --max-time "$CURL_TIMEOUT" \
            -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
            -o "$collection_file" \
            "$collection_url" || { warn "下载失败: $collection_url"; continue; }
        sleep "$CURL_DELAY"
    fi

    # 提取文章链接：/en/articles/XXXXX-slug
    grep -oE '/en/articles/[0-9]+-[a-z0-9-]+' "$collection_file" \
        | sort -u \
        >> "$ARTICLE_LIST" || true
done

# 全局去重
sort -u -o "$ARTICLE_LIST" "$ARTICLE_LIST"
TOTAL_ARTICLES=$(wc -l < "$ARTICLE_LIST" | tr -d ' ')
log "发现 ${TOTAL_ARTICLES} 篇文章"

# ---- Dry run 模式 ----
if [[ "${1:-}" == "--dry" ]]; then
    log "Dry run: 文章列表"
    while IFS= read -r url; do
        echo "  ${SITE_URL}${url}"
    done < "$ARTICLE_LIST"
    log "共 ${TOTAL_ARTICLES} 篇"
    exit 0
fi

if [[ "$TOTAL_ARTICLES" -eq 0 ]]; then
    err "未发现任何文章链接"
    exit 1
fi

# ---- 第二步：逐个下载文章 HTML ----
step "2/4 下载文章 HTML..."
DOWNLOADED=0
SKIPPED=0

while IFS= read -r article_path; do
    # 从路径提取 slug 作为文件名
    slug=$(echo "$article_path" | sed 's|/en/articles/||')
    article_file="$CACHE_DIR/articles/${slug}.html"

    if [[ -f "$article_file" ]]; then
        ((SKIPPED++)) || true
        continue
    fi

    echo -e "  ${CYAN}↓${NC} [$(( DOWNLOADED + SKIPPED + 1 ))/${TOTAL_ARTICLES}] ${slug}"
    curl -s --retry "$CURL_RETRY" --max-time "$CURL_TIMEOUT" \
        -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
        -o "$article_file" \
        "${SITE_URL}${article_path}" || { warn "下载失败: ${slug}"; continue; }

    ((DOWNLOADED++)) || true
    sleep "$CURL_DELAY"
done < "$ARTICLE_LIST"

log "下载完成：新增 ${DOWNLOADED}，跳过（缓存）${SKIPPED}"

# ---- 第三步：HTML → Markdown ----
step "3/4 转换 HTML → Markdown..."
mkdir -p "$OUTPUT_DIR"

node -e "
const { execSync } = require('child_process');

// 检查 turndown 是否可用
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

const articlesDir = '$CACHE_DIR/articles';
const outputDir = '$OUTPUT_DIR';
const siteUrl = '$SITE_URL';
const timestamp = '$TIMESTAMP';

// 配置 turndown
const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
});

// 保留 code 块
td.addRule('fencedCodeBlock', {
    filter: (node) => node.nodeName === 'PRE' && node.querySelector('code'),
    replacement: (content, node) => {
        const code = node.querySelector('code');
        const lang = (code.className || '').replace(/^language-/, '').split(' ')[0] || '';
        const text = code.textContent || '';
        return '\n\n\`\`\`' + lang + '\n' + text + '\n\`\`\`\n\n';
    }
});

// 处理图片：保留 alt 和 src
td.addRule('images', {
    filter: 'img',
    replacement: (content, node) => {
        const alt = node.getAttribute('alt') || '';
        const src = node.getAttribute('src') || '';
        if (!src) return '';
        return '![' + alt + '](' + src + ')';
    }
});

// 过滤掉导航、页脚等非内容元素
td.remove(['nav', 'footer', 'script', 'style', 'noscript']);

const htmlFiles = fs.readdirSync(articlesDir).filter(f => f.endsWith('.html'));
let count = 0;
let errors = 0;

for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(path.join(articlesDir, htmlFile), 'utf-8');

    // 提取文章标题
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch
        ? titleMatch[1].replace(/<[^>]+>/g, '').trim()
        : htmlFile.replace('.html', '');

    // 提取 article 内容
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (!articleMatch) {
        // 尝试 main
        const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        if (!mainMatch) {
            errors++;
            continue;
        }
        var contentHtml = mainMatch[1];
    } else {
        var contentHtml = articleMatch[1];
    }

    if (!contentHtml.trim()) continue;

    const markdown = td.turndown(contentHtml);
    if (!markdown.trim()) continue;

    // 文件名：从 HTML 文件名推导
    const slug = htmlFile.replace('.html', '');
    // 去掉开头的数字ID，只保留描述性 slug
    const cleanSlug = slug.replace(/^[0-9]+-/, '');
    const fileName = cleanSlug + '.md';
    const sourceUrl = siteUrl + '/en/articles/' + slug;

    const header = '<!-- source: ' + sourceUrl + ' -->\n<!-- crawled: ' + timestamp + ' -->\n\n# ' + title + '\n\n';
    fs.writeFileSync(path.join(outputDir, fileName), header + markdown);
    count++;
}

console.log('转换完成: ' + count + ' 个 Markdown 文件' + (errors > 0 ? '（' + errors + ' 个失败）' : ''));
" 2>&1

# ---- 第四步：生成索引 ----
step "4/4 生成索引文件..."

node -e "
const fs = require('fs');
const path = require('path');

const outputDir = '$OUTPUT_DIR';
const articleList = '$ARTICLE_LIST';

// 读取 collection→article 映射
const collectionNames = {
    '3939573-new-to-remnote': 'New To RemNote',
    '3370931-flashcards': 'Flashcards',
    '3939584-editing': 'Editing',
    '3939590-getting-around': 'Getting Around',
    '3939575-linking-ideas': 'Linking Ideas',
    '3939579-structuring-content': 'Structuring Content',
    '3692117-reading': 'Reading',
    '3939594-sharing-collaboration': 'Sharing & Collaboration',
    '3939596-importing-exporting': 'Importing & Exporting',
    '3939686-mobile-desktop-plugins': 'Mobile, Desktop, & Plugins',
    '3939601-settings-and-account': 'Settings and Account',
    '3507701-troubleshooting': 'Troubleshooting',
    '3939602-plan-pricing-referrals': 'Plan, Pricing, & Referrals',
    '3939591-workflows': 'Workflows',
    '3939597-about-remnote': 'About RemNote',
};

// 读取 collection HTML 提取每个 collection 的文章
const collectionsDir = '$CACHE_DIR/collections';
const collectionArticles = {};

for (const [slug, name] of Object.entries(collectionNames)) {
    const htmlFile = path.join(collectionsDir, slug + '.html');
    if (!fs.existsSync(htmlFile)) continue;

    const html = fs.readFileSync(htmlFile, 'utf-8');
    const matches = html.match(/\/en\/articles\/[0-9]+-[a-z0-9-]+/g) || [];
    const unique = [...new Set(matches)];
    collectionArticles[name] = unique.map(url => {
        const articleSlug = url.replace('/en/articles/', '');
        const cleanSlug = articleSlug.replace(/^[0-9]+-/, '');
        return cleanSlug;
    });
}

// 获取所有已生成的 md 文件
const files = fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.md') && f !== 'INDEX.md')
    .sort();

const fileSet = new Set(files.map(f => f.replace('.md', '')));

let index = '# RemNote Help Center Documentation Index\n\n';
index += '> 爬取时间: $TIMESTAMP\n';
index += '> 来源: $SITE_URL\n';
index += '> 文件数: ' + files.length + '\n\n';

const categorized = new Set();

for (const [catName, slugs] of Object.entries(collectionArticles)) {
    const catFiles = slugs.filter(s => fileSet.has(s));
    if (catFiles.length === 0) continue;

    index += '## ' + catName + '\n\n';
    for (const slug of catFiles) {
        const name = slug.replace(/-/g, ' ');
        const capName = name.charAt(0).toUpperCase() + name.slice(1);
        index += '- [' + capName + '](' + slug + '.md)\n';
        categorized.add(slug);
    }
    index += '\n';
}

// 未分类的文章
const uncategorized = files
    .map(f => f.replace('.md', ''))
    .filter(s => !categorized.has(s));

if (uncategorized.length > 0) {
    index += '## Other\n\n';
    for (const slug of uncategorized) {
        const name = slug.replace(/-/g, ' ');
        index += '- [' + name + '](' + slug + '.md)\n';
    }
    index += '\n';
}

fs.writeFileSync(path.join(outputDir, 'INDEX.md'), index);
console.log('索引已生成: INDEX.md');
"

# ---- 完成 ----
TOTAL=$(ls -1 "$OUTPUT_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
log "=========================================="
log "爬取完成！"
log "  文件数: ${TOTAL}"
log "  输出目录: $OUTPUT_DIR"
log "  缓存目录: ${CACHE_DIR}（可用 --clean 清除）"
log "=========================================="

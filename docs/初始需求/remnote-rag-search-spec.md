# RemNote RAG Search — 语义搜索增强规范

## 概述

当前 `search` 命令走 RemNote SDK 内置搜索，基于空格分词，中文检索能力差，返回信息量不足（仅 remId + text + isDocument）。

本方案是一个**独立的 Python 增强包**（`remnote-rag`），直读 RemNote 本地 SQLite 数据库，构建向量索引，提供语义搜索能力。remnote-bridge CLI 检测到它已安装时自动启用，未安装则降级到原有 SDK 搜索。

### 项目关系

```
remnote-bridge (npm, Node.js)      remnote-rag (pip, Python)
├── search 命令                     ├── 索引脚本（读 remnote.db → 建向量库）
│   ├── 检测 remnote-rag 是否安装    ├── 查询接口（接收 query → 返回 top-k）
│   ├── 已安装 → 子进程调用          └── CLI 入口（remnote-rag index / search）
│   └── 未安装 → 走 SDK 搜索
└── 其他命令不受影响
```

- **remnote-rag 是可选依赖**：不装它 remnote-bridge 照常工作，search 用 SDK
- **两个独立包**：npm 和 pip 各管各的，无交叉依赖
- **通信方式**：remnote-bridge 通过 `child_process.spawn('remnote-rag', ['search', ...])` 调用，JSON stdout 传结果

### 平台限制

- **仅支持 macOS**：RemNote 本地数据库位于 `~/remnote/` 目录
- Windows / Linux 的数据库路径未知，网页版的本地存储结构也未调查
- 本版只管 Mac 本地客户端

### 与现有命令的关系

本方案**只增强 search 命令**。其他命令（read-rem、read-tree、read-context、edit-rem、edit-tree）全部不动。

---

## 数据来源

### RemNote 本地数据库

```
~/remnote/
├── remnote-<userId>/          ← 主数据库
│   └── remnote.db             ← SQLite，所有 Rem 数据
├── browser/                   ← 几乎为空，忽略
└── remnote-browser/           ← 少量同步数据，忽略
```

主数据库 `remnote.db` 核心表：

| 表 | 用途 |
|:---|:-----|
| **quanta** (8,317 行) | Rem 主表，`doc` 列存 JSON |
| **remsSearchInfos** (6,030 行) | RemNote 预算好的祖先文本 + 排名数据 |
| **remsContents** (6,042 行) | FTS5 纯文本索引（已提取好的文本） |

> 完整数据库分析见 `docs/remnote-database-research/README.md`。

### 只读访问

索引脚本以**只读方式**打开 `remnote.db`，不修改任何数据。RemNote 客户端运行时也可安全读取（SQLite WAL 模式支持并发读）。

---

## 两库架构

```
remnote.db (只读)
    ↓ 索引脚本
    ├──→ ChromaDB (向量库)
    │     存有实质内容的 Rem
    │     用于语义检索
    │
    └──→ 关系数据 (直接查 remnote.db)
          parent/children/tags/references
          用于祖先路径拼接
```

关系数据不另建表——直接查 `remnote.db` 的 `quanta` 表即可，省去数据同步。

---

## 向量库（ChromaDB）

### 入库条件

从 `quanta` 表筛选，满足**全部**以下条件的 Rem 才入向量库：

| 条件 | SQL 表达 | 理由 |
|:-----|:---------|:-----|
| 用户创建 | `json_extract(doc, '$.z') = 3` | z=1 是系统内置 Rem |
| 非 Portal | `COALESCE(json_extract(doc, '$.type'), 0) != 6` | Portal 只是引用容器 |
| 非 Powerup | 无 `rcrp`/`rcrs`/`rcrt`/`rcre` 键 | Powerup 内部实现节点 |
| 有实质内容 | `key` 转纯文本 ≥ 5 字符 | 太短无检索价值 |

预估：8,317 条 → 过滤后约 **5,000–5,500 条**入库。

### 不入库的 Rem

| 类型 | 数量估计 | 理由 |
|:-----|:---------|:-----|
| Powerup 系列 | ~2,000 | 系统内部实现细节 |
| Portal (type=6) | ~105 | 只是指针，内容在被引用 Rem |
| 系统 Rem (z=1) | 若干 | 模板、内置结构 |
| 纯标题 (< 5 字符) | 若干 | "备注"、"第三章" 无检索价值 |
| deleted_quanta | 289 | 已删除 |

不入向量库的 Rem（如纯标题）仍然可通过关系查询参与祖先路径拼接。

### Embedding 文本格式

使用 Markdown 层级格式，embedding 模型训练数据中最常见的结构化格式：

```markdown
# 机器学习
## 监督学习
支持向量机的核心思想是最大化分类间隔 → 在高维空间中寻找最优超平面
```

拼接规则：

1. **祖先路径**：从 `remsSearchInfos` 表获取祖先文本，每层一级 Markdown 标题（`#` / `##` / `###`...）
2. **正面文本**：`doc.key`（RichText 数组）转纯文本
3. **背面文本**：如果 `doc.value` 存在，用 ` → ` 连接在正面文本后
4. 超过 6 级祖先时，前面的祖先压缩为一行前缀（`远祖1 / 远祖2 / ...`）

#### RichText → 纯文本转换

`doc.key` 和 `doc.value` 的 RichText 格式与 SDK 完全一致（同一套 `i` 类型码）。
数据库存储的 JSON 与 SDK 返回的 `RichTextInterface` 结构完全相同，键名、类型码、格式化字段全部一致。

> 完整 RichText 格式参考：`docs/richtext-format/README.md`
> 现有转换实现：`remnote-plugin/src/services/rem-builder.ts` 的 `richTextFallback()`

SDK 共定义了 **13 种 `i` 类型**（含 1 种遗留类型），RAG 索引的转换规则如下：

| `i` 值 | 类型名 | 转换规则 | 说明 |
|:--------|:-------|:---------|:-----|
| _(纯 string)_ | — | 直接拼接 | 无格式文本 |
| `"m"` | Text | 取 `text` 字段，丢弃格式标记（`b`/`l`/`u`/`h`/`tc` 等） | 最常见的元素类型 |
| `"q"` | Rem 引用 | 查 quanta 表中被引用 Rem（`_id`）的 `key` 字段，转纯文本后拼入 | **不能只存 ID**，必须解析为实际文本，否则 embedding 无语义 |
| `"x"` | LaTeX | 取 `text` 字段原样保留 | 数学公式有检索价值 |
| `"u"` | URL (遗留) | 有 `title` 则取 `title`，否则取 `url` | SDK 不认识的遗留类型，数据库中可能存在 |
| `"p"` | Plugin | 取 `text` 字段 | 插件生成的文本 |
| `"n"` | Annotation | 取 `text` 字段 | 批注文本（SDK 不渲染，但对 RAG 有用） |
| `"o"` | Deprecated Code | 取 `text` 字段 | 旧版代码块 |
| `"g"` | Global Name | 取 `text` 字段 | 内部元素 |
| `"i"` | Image | 跳过（返回空字符串） | 图片无文本语义 |
| `"a"` | Audio/Video | 跳过（返回空字符串） | 音视频无文本语义 |
| `"s"` | Card Delimiter | 转为 ` → ` | 行内正反面分隔符 |
| `"fi"` | Flashcard Icon | 跳过（返回空字符串） | 纯视觉标记 |
| `"ai"` | Add Icon | 跳过（返回空字符串） | 纯视觉标记 |
| _(未知类型)_ | — | 尝试取 `text`，再尝试 `url`，都无则空字符串 | 兜底处理，防止未来新增类型导致崩溃 |

#### Rem 引用解析（`i:"q"`）的特殊处理

Rem 引用是 RAG 索引中最需要注意的类型。数据库中存的是 `{"i":"q","_id":"remId"}`，只有 ID 没有文本。

解析策略：
1. 收集当前 Rem 的 `key`/`value` 中所有 `i:"q"` 元素的 `_id`
2. 批量查 quanta 表获取被引用 Rem 的 `key` 字段
3. 递归转纯文本后替换（注意：被引用 Rem 内部可能还有引用，设置递归深度上限 = 2，防止循环引用）
4. 查不到的 ID（如已删除的 Rem）用 `_id` 字符串原样保留

#### 格式化字段说明

`i:"m"` 的格式化字段（`b`/`l`/`u`/`h`/`tc`/`q`/`code`/`cId`/`iUrl` 等）在纯文本转换时**全部丢弃**。
这些字段控制的是视觉样式（粗体、高亮、颜色等），对语义检索无贡献。

> 注意：格式化字段不是 `i:"m"` 专属——实测除 `i:"n"` 外所有类型都接受格式化字段。
> 但 RAG 转纯文本时统一丢弃，不影响处理逻辑。

### 每条记录存储结构

```python
{
    "id": _id,                          # Rem ID（ChromaDB 主键）
    "document": "# 祖先1\n## 祖先2\n正面文本 → 背面文本",  # embedding 输入
    "metadata": {
        "type": 1,                      # 0=default, 1=Concept, 2=Descriptor
        "is_document": True,            # 是否文档页
        "is_heading": True,             # ih="h"
        "has_back_text": True,          # value 非 null
        "tags": ["tagId1", "tagId2"],   # tp 的 key 列表
        "updated_at": 1709301720000,    # 增量更新用
        "created_at": 1705312200000,    # 可选时间过滤
    }
}
```

### 使用的 quanta.doc 键（仅 7 个）

| doc 键 | 用途 |
|:-------|:-----|
| `_id` | 主键 |
| `key` | 正面文本（RichText → 纯文本做 embedding） |
| `value` | 背面文本（拼在正面后面一起 embed） |
| `type` | 过滤 Portal(6) + 元数据标签 |
| `ih` | `"h"` = heading，元数据标签 |
| `z` | 过滤系统 Rem(1)，只留用户创建(3) |
| `u` | 增量更新检测（updatedAt 毫秒时间戳） |

辅助表：

| 表 | 用途 |
|:---|:-----|
| `remsSearchInfos` | 祖先文本（免递归爬 parent 链） |
| `remsContents` | 备选：已提取的纯文本（省 RichText 解析） |

### Embedding 模型

阿里云 DashScope / Qwen3-Embedding：

- 中英文第一梯队
- OpenAI 兼容 API 格式
- 维度：可配置（默认 1024）

---

## 增量更新

### 变更检测

对比 `doc.u`（updatedAt 毫秒时间戳）与上次索引时间：

```python
def needs_update(doc, last_sync_time):
    updated_at = doc.get('u', doc.get('createdAt'))
    return updated_at > last_sync_time
```

### 更新策略

- 变化的 Rem：重新生成 embedding，`collection.upsert()` 覆盖
- 新增的 Rem：走入库条件筛选后 `collection.add()`
- 删除的 Rem：对比 `quanta` 表与向量库 ID 集合，`collection.delete()` 清理
- **祖先变更级联**：如果某个 Rem 的 `key` 变了，它的所有后代的祖先路径也变了，需要级联重算。通过 `parent` 字段递归查后代

### 索引时间记录

每次索引完成后记录时间戳到本地文件（如 `~/.remnote-rag/last_sync.json`），下次启动时读取。

---

## 增强后的 search 命令

### 调用方式

```bash
# 人类模式
remnote-bridge search "支持向量机" --numResults 10

# JSON 模式
remnote-bridge search --json '{"query":"支持向量机","numResults":10}'
```

参数不变，底层从 SDK 搜索切换为向量检索。

### 返回结构

```json
{
  "ok": true,
  "command": "search",
  "query": "支持向量机",
  "results": [
    {
      "remId": "kLrIOHJLyMd8Y2lyA",
      "text": "支持向量机的核心思想是最大化分类间隔",
      "backText": "在高维空间中寻找最优超平面",
      "ancestorPath": ["机器学习", "监督学习"],
      "type": "concept",
      "isDocument": false,
      "tags": ["统计学习"],
      "score": 0.87
    }
  ],
  "totalFound": 5,
  "source": "rag"
}
```

相比现有 search 新增的字段：

| 字段 | 说明 |
|:-----|:-----|
| `backText` | 背面文本（现有 search 不返回） |
| `ancestorPath` | 祖先路径数组（现有 search 不返回） |
| `type` | Rem 类型（现有 search 不返回） |
| `tags` | 标签名称数组（现有 search 不返回） |
| `score` | 语义相关性分数（0-1） |
| `source` | `"rag"` 标识使用了向量检索 |

### 降级策略

remnote-bridge search 命令的执行逻辑：

```
1. 检测 remnote-rag 是否可用
   which remnote-rag → 找不到 → 走 SDK 搜索（source: "sdk"）

2. 调用 remnote-rag search
   spawn('remnote-rag', ['search', '--json', query]) → 超时/报错 → 走 SDK 搜索

3. 解析 stdout JSON 返回结果（source: "rag"）
```

降级场景：
- `remnote-rag` 未安装（`which` 找不到）→ SDK 搜索
- 向量库未索引（`remnote-rag` 报错 "not indexed"）→ SDK 搜索
- 子进程超时（默认 10s）→ SDK 搜索
- 子进程返回非法 JSON → SDK 搜索

所有降级情况下返回结果中 `"source": "sdk"`，正常 RAG 结果中 `"source": "rag"`。

---

## 技术栈

### 两个独立项目

| 项目 | 包管理 | 语言 | 安装方式 | 必需？ |
|:-----|:-------|:-----|:---------|:-------|
| **remnote-bridge** | npm | TypeScript/Node.js | `npm install -g remnote-bridge` | 是 |
| **remnote-rag** | pip | Python | `pip install remnote-rag` | **否，可选增强** |

### remnote-rag 的职责

| 命令 | 功能 |
|:-----|:-----|
| `remnote-rag index` | 全量索引（首次或手动重建） |
| `remnote-rag index --incremental` | 增量索引（只更新变化的 Rem） |
| `remnote-rag search "query"` | 语义搜索，返回 JSON |
| `remnote-rag search --json '{"query":"...","numResults":10}'` | JSON 模式搜索 |
| `remnote-rag status` | 查看索引状态（已索引数量、上次同步时间） |

### 子进程通信协议

remnote-bridge 通过子进程调用 remnote-rag，约定：

```bash
# remnote-bridge 端调用
remnote-rag search --json '{"query":"支持向量机","numResults":10}'

# remnote-rag stdout 输出（一行 JSON）
{"ok":true,"results":[...],"totalFound":5}

# 错误时
{"ok":false,"error":"Vector index not found. Run 'remnote-rag index' first."}
```

- stdout：**仅一行 JSON**，禁止混入其他输出
- stderr：日志/调试信息（remnote-bridge 忽略）
- exit code：0 = 成功，非 0 = 失败
- 超时：remnote-bridge 等待最多 10 秒

### remnote-rag Python 依赖

| 组件 | 选型 | 版本要求 | 理由 |
|:-----|:-----|:---------|:-----|
| **运行时** | Python | ≥ 3.10 | ChromaDB 最低要求 |
| **向量库** | ChromaDB | ≥ 0.4 | 本地文件存储，`pip install chromadb` 即用，无需外部服务 |
| **Embedding API** | Qwen3-Embedding (DashScope) | — | 中英文第一梯队，OpenAI 兼容格式，按量付费 |
| **数据库读取** | Python sqlite3 (标准库) | — | 无额外依赖，只读访问 remnote.db |
| **HTTP 客户端** | openai (Python SDK) | ≥ 1.0 | DashScope 兼容 OpenAI 格式，复用 SDK |
| **Reranker** | 暂不加 | — | 后续可选 Qwen3-Reranker |

```
# requirements.txt
chromadb>=0.4
openai>=1.0
```

仅 2 个外部依赖。sqlite3 是 Python 标准库。

### Embedding API 参数

| 参数 | 值 |
|:-----|:---|
| 服务商 | 阿里云 DashScope |
| 模型 | qwen3-embedding |
| API 格式 | OpenAI 兼容（`POST /v1/embeddings`） |
| Base URL | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| 向量维度 | 1024（默认） |
| 最大输入 | 8192 tokens / 条 |
| 批量大小 | 最多 6 条 / 次（DashScope 限制） |
| 认证 | `DASHSCOPE_API_KEY` 环境变量 |

### 本地存储

```
~/.remnote-rag/
├── chroma/                  ← ChromaDB 持久化数据（向量 + 元数据）
│   └── remnote_rems/        ← collection 名称
├── last_sync.json           ← 上次索引时间戳 + 统计信息
└── config.json              ← 配置文件
```

#### config.json 结构

```json
{
  "remnote_db_path": "~/remnote/remnote-<userId>/remnote.db",
  "embedding_model": "qwen3-embedding",
  "embedding_dimensions": 1024,
  "dashscope_base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "min_text_length": 5,
  "batch_size": 6
}
```

- `DASHSCOPE_API_KEY` 通过环境变量传入，**不存在 config.json 中**
- `remnote_db_path` 首次运行时自动扫描 `~/remnote/` 目录检测

#### last_sync.json 结构

```json
{
  "last_sync_time": 1709301720000,
  "total_indexed": 5234,
  "last_full_sync": "2026-03-11T10:30:00Z"
}
```

---

## 索引流程

```
1. 定位数据库
   ~/remnote/remnote-<userId>/remnote.db
   （扫描 ~/remnote/ 找到 remnote-* 目录）

2. 过滤
   quanta 表 → 排除 Powerup / Portal / 系统 Rem / 空内容

3. 提取文本
   doc.key → RichText → 纯文本（正面）
   doc.value → RichText → 纯文本（背面）
   remsSearchInfos → 祖先文本

4. 拼接 embedding 文本
   Markdown 层级：# 祖先1\n## 祖先2\n正面 → 背面

5. 调 Qwen3-Embedding API 生成向量

6. 写入 ChromaDB
   collection.upsert(ids, documents, embeddings, metadatas)

7. 记录索引时间
   写入 ~/.remnote-rag/last_sync.json
```

### 首次全量索引

约 5,000 条 Rem，按 Qwen3-Embedding 的 batch 能力，预计几分钟完成。

### 增量索引

检测 `doc.u > last_sync_time` 的 Rem，只重算变化部分。正常使用场景下每次增量几十条。

---

## 项目结构

remnote-rag 作为子目录放在 remnote-bridge-cli 仓库内，与 remnote-plugin 同级：

```
remnote-bridge-cli/                    (repo root)
├── package.json                       (npm 包，files 白名单不包含 remnote-rag/)
├── src/
│   ├── cli/                           ← 命令层（Node.js）
│   └── mcp/                           ← 接入层（Node.js）
├── remnote-plugin/                    ← 子项目：RemNote 插件（JS，跟 npm 包一起发）
├── remnote-rag/                       ← 子项目：RAG 增强（Python，单独发 PyPI）
│   ├── pyproject.toml                 # Python 包配置（包名 remnote-rag）
│   ├── README.md
│   ├── src/
│   │   └── remnote_rag/
│   │       ├── __init__.py
│   │       ├── __main__.py            # CLI 入口（python -m remnote_rag）
│   │       ├── cli.py                 # 命令解析（index / search / status）
│   │       ├── indexer.py             # 索引逻辑（读 DB → 转文本 → embedding → ChromaDB）
│   │       ├── searcher.py            # 搜索逻辑（query → embedding → ChromaDB top-k）
│   │       ├── richtext.py            # RichText → 纯文本转换
│   │       ├── db_reader.py           # SQLite 只读访问封装
│   │       └── config.py              # 配置管理
│   └── tests/
├── docs/
│   ├── remnote-database-research/     ← 共享：数据库研究（两个子项目都参考）
│   └── 初始需求/
│       └── remnote-rag-search-spec.md ← 本文档
└── skills/
```

### 发布方式

| 子项目 | 发布到 | 包含在 npm 包中？ | 说明 |
|:-------|:-------|:-----------------|:-----|
| `remnote-plugin/` | 跟 npm 一起 | 是（files 白名单） | 预构建产物随 npm 包发布 |
| `remnote-rag/` | PyPI | **否** | 独立 `pip install remnote-rag` |

npm 的 `package.json` 的 `files` 字段不包含 `remnote-rag/`，确保 npm 包不膨胀。

---

## 不做的事

- **不修改 RemNote 数据库**：纯只读
- **不替换其他命令**：只增强 search
- **不加 Reranker**：先跑起来看召回质量，不够再加
- **不支持 Windows / Linux**：数据库路径未知
- **不支持网页版**：本地数据库结构不同
- **不做鱼眼展开**：RAG search 返回的结果自带祖先路径和内容，足够 Agent 直接使用。需要更多上下文时 Agent 自行调 read-tree

# search

> 在知识库中按文本搜索 Rem，返回匹配结果列表。

---

## 功能

`search` 调用 RemNote SDK 的全文搜索 API（`plugin.search.search()`），在当前知识库中搜索包含关键词的 Rem，返回匹配结果的 ID、文本和文档标记。

---

## 用法

### 人类模式

```bash
remnote-bridge search <query> [--limit <N>]
```

| 参数/选项 | 类型 | 必需 | 说明 |
|-----------|------|:----:|------|
| `query` | string（位置参数） | 是 | 搜索关键词 |
| `--limit <N>` | number | 否 | 结果数量上限（默认 20） |

输出示例：

```
搜索 "机器学习"，找到 5 条结果：

  [kLrIOHJLyMd8Y2lyA] [Doc] 机器学习笔记
  [abc123def456] 监督学习与机器学习的关系
  [xyz789ghi012] 深度学习是机器学习的子集
```

无结果时：

```
未找到与 "不存在的关键词" 相关的结果
```

### JSON 模式

```bash
remnote-bridge search --json '{"query":"机器学习","numResults":10}'
```

---

## JSON 输入参数

| 字段 | 类型 | 必需 | 说明 |
|------|------|:----:|------|
| `query` | string | 是 | 搜索关键词（不能为空） |
| `numResults` | number | 否 | 结果数量上限（默认 20） |

---

## JSON 输出

### 成功

```json
{
  "ok": true,
  "command": "search",
  "data": {
    "query": "机器学习",
    "results": [
      { "remId": "kLrIOHJLyMd8Y2lyA", "text": "机器学习笔记", "isDocument": true },
      { "remId": "abc123def456", "text": "监督学习与机器学习的关系", "isDocument": false }
    ],
    "totalFound": 2
  },
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 无结果

```json
{
  "ok": true,
  "command": "search",
  "data": {
    "query": "不存在的关键词",
    "results": [],
    "totalFound": 0
  },
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 搜索词为空

```json
{
  "ok": false,
  "command": "search",
  "error": "search query 不能为空",
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### daemon 不可达

```json
{
  "ok": false,
  "command": "search",
  "error": "守护进程未运行，请先执行 remnote-bridge connect",
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

---

## 内部流程

```
1. CLI 解析参数（query, numResults）
2. sendRequest → WS → daemon → forwardToPlugin('search', { query, numResults })
3. Plugin 端：
   ├─ plugin.search.search([query], undefined, { numResults })
   ├─ 遍历结果 Rem：
   │   ├─ plugin.richText.toMarkdown(rem.text) → 转 Markdown 文本
   │   ├─ 换行符替换为空格（保持单行）
   │   └─ rem.isDocument() → 是否文档
   └─ 返回 { query, results, totalFound }
4. CLI 格式化输出
```

---

## 结果字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `query` | string | 原始搜索关键词 |
| `results` | array | 结果数组 |
| `results[].remId` | string | 匹配 Rem 的 ID |
| `results[].text` | string | Rem 正面文本（Markdown 格式，单行） |
| `results[].isDocument` | boolean | 是否为文档页面 |
| `totalFound` | number | 返回的结果数量 |

---

## 退出码

| 退出码 | 含义 | 触发条件 |
|:------:|------|----------|
| 0 | 成功 | 搜索完成（含无结果） |
| 1 | 业务错误 | query 为空、--limit 非数字等 |
| 2 | daemon 不可达 | daemon 未运行或 WS 连接失败 |

---

## 中文及非空格分词语言的搜索限制

`search` 调用的是 RemNote SDK 官方搜索方法（`plugin.search.search()`）。该方法的分词逻辑基于空格分割，对**中文、日文、韩文等无空格分词的语言不友好**。

### 问题原因

RemNote 的 Web 版搜索索引按单字符拆分非空格语言的文本。搜索 "共价键" 时，SDK 可能将其拆为 "共"、"价"、"键" 三个独立 token 进行匹配，导致多字词搜索命中率低甚至返回 0 结果。

> RemNote **本地桌面版**对中文搜索做了优化，体验显著优于 Web 版。

### 应对策略

| 策略 | 说明 |
|:-----|:-----|
| **单字搜索** | 用关键词中最具区分度的**单个字**搜索（如搜 "键" 而非 "共价键"），然后在结果中人工筛选 |
| **英文/拼音替代** | 如果 Rem 中包含英文注释，尝试用英文关键词搜索（如 "covalent"） |
| **read-globe + read-tree 替代** | 当搜索失败时，通过 read-globe 浏览知识库文档结构，定位可能的父文档后用 read-tree 展开查找 |
| **询问用户版本** | 搜索效果差时，可询问用户使用的是 Web 版还是本地桌面版，以判断是否为已知限制 |

### 建议的搜索流程

```
1. 先用完整关键词搜索
2. 若返回 0 结果且关键词为中文/日文/韩文：
   a. 用单字重试（选区分度最高的字）
   b. 若仍无结果，改用 read-globe → read-tree 替代定位
3. 若用户反馈搜索持续不佳，询问：
   - "您使用的是 RemNote Web 版还是本地桌面版？"
   - "Web 版中文搜索存在已知限制，本地版体验更好"
```

---

## 注意事项

- 搜索结果的 `text` 字段是 Markdown 格式的单行文本（多行换行符已替换为空格）
- `totalFound` 等于 `results.length`，即实际返回的数量（受 `numResults` 限制）
- 搜索不会触发缓存写入——search 结果不进入 RemCache
- 如需获取某个搜索结果的完整属性，需对其 `remId` 执行 `read-rem`

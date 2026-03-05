# read-rem 测试结果

> 执行时间: 2026-03-04
> 执行环境: macOS Darwin 25.1.0
> CLI 执行方式: `cd remnote-cli && npx tsx src/index.ts [command]`
> 守护进程状态: 已运行，Plugin 已连接

---

## 测试用例汇总

| 用例 | 描述 | 结果 |
|:-----|:-----|:-----|
| TC-READ-001 | 读取文档 Rem（人类可读输出） | **PASS** |
| TC-READ-002 | --json 模式 | **PASS** |
| TC-READ-003 | --fields 过滤 | **PASS** |
| TC-READ-004 | --full 模式 | **PASS** |
| TC-READ-005 | 不存在的 Rem ID | **PASS** |
| TC-READ-006a | 子 Rem 1（descriptor, 引用） | **PASS** |
| TC-READ-006b | 子 Rem 2（descriptor, highlightColor Blue） | **PASS** |
| TC-READ-006c | 子 Rem 3（default, text 为空） | **PASS** |

**总计: 8/8 PASS**

---

## TC-READ-001: 读取文档 Rem（人类可读输出）

**命令:**
```bash
npx tsx src/index.ts read-rem KBhhq0frjpSdMTleT
```

**实际输出:**
```json
{
  "id": "KBhhq0frjpSdMTleT",
  "text": ["mcp"],
  "backText": null,
  "type": "default",
  "isDocument": true,
  "parent": null,
  "children": ["6zISqSaR2pJjJG1zX", "wlZklC2gCnxvLny3d", "dtiQHcUJ2iEcQewZV"],
  "fontSize": null,
  "highlightColor": null,
  "isTodo": false,
  "todoStatus": null,
  "isCode": false,
  "isQuote": false,
  "isListItem": false,
  "isCardItem": false,
  "isTable": false,
  "isSlot": false,
  "isProperty": false,
  "portalType": null,
  "portalDirectlyIncludedRem": [],
  "propertyType": null,
  "enablePractice": true,
  "practiceDirection": "forward",
  "tags": ["HtkQ8Eke0me1tcaO2"],
  "sources": [],
  "aliases": [],
  "remsBeingReferenced": [],
  "remsReferencingThis": [],
  "taggedRem": [],
  "descendants": ["6zISqSaR2pJjJG1zX", "wlZklC2gCnxvLny3d", "RBoaS1AHMDzVHzVOz", "dtiQHcUJ2iEcQewZV"],
  "siblingRem": [],
  "positionAmongstSiblings": null,
  "createdAt": 1772576549156,
  "updatedAt": 1772658655395
}
```

**验证项:**
- [x] 输出为格式化 JSON（带缩进）
- [x] 包含 id、text、type、isDocument 等字段
- [x] `isDocument` 为 `true`
- [x] `text` 为 `["mcp"]`
- [x] `parent` 为 `null`（顶层文档）
- [x] `children` 包含预期的三个子 Rem ID

**结果: PASS**

---

## TC-READ-002: --json 模式

**命令:**
```bash
npx tsx src/index.ts read-rem --json KBhhq0frjpSdMTleT
```

**实际输出（单行 JSON，此处格式化展示关键部分）:**
```json
{
  "ok": true,
  "command": "read-rem",
  "data": {
    "id": "KBhhq0frjpSdMTleT",
    "text": ["mcp"],
    "type": "default",
    "isDocument": true,
    ...
  }
}
```

**验证项:**
- [x] 输出为单行合法 JSON
- [x] 包含 `ok: true` 字段
- [x] 包含 `command: "read-rem"` 字段
- [x] 包含 `data` 字段，内含 Rem 数据
- [x] `data` 中不包含 R-F 字段（无 `isPowerup`、`deepRemsBeingReferenced`、`ancestorTagRem` 等）

**结果: PASS**

---

## TC-READ-003: --fields 过滤

**命令:**
```bash
npx tsx src/index.ts read-rem --fields text,type KBhhq0frjpSdMTleT
```

**实际输出:**
```json
{
  "id": "KBhhq0frjpSdMTleT",
  "text": ["mcp"],
  "type": "default"
}
```

**验证项:**
- [x] 输出仅包含 `id`、`text`、`type` 三个字段
- [x] `id` 始终包含（即使未指定，作为必要标识字段）
- [x] 无其他多余字段

**结果: PASS**

---

## TC-READ-004: --full 模式

**命令:**
```bash
npx tsx src/index.ts read-rem --full KBhhq0frjpSdMTleT
```

**实际输出（关键新增 R-F 字段摘录）:**
```json
{
  "id": "KBhhq0frjpSdMTleT",
  "text": ["mcp"],
  ...
  "isPowerup": false,
  "isPowerupEnum": false,
  "isPowerupProperty": false,
  "isPowerupSlot": false,
  ...
  "deepRemsBeingReferenced": [],
  "ancestorTagRem": ["HtkQ8Eke0me1tcaO2"],
  "descendantTagRem": [],
  "portalsAndDocumentsIn": [],
  "allRemInDocumentOrPortal": ["6zISqSaR2pJjJG1zX", "wlZklC2gCnxvLny3d", "RBoaS1AHMDzVHzVOz", "dtiQHcUJ2iEcQewZV"],
  "allRemInFolderQueue": [...],
  "timesSelectedInSearch": 0,
  "schemaVersion": 4,
  ...
}
```

**验证项:**
- [x] 包含 R-F 字段: `isPowerup`、`isPowerupEnum`、`isPowerupProperty`、`isPowerupSlot`
- [x] 包含 R-F 字段: `deepRemsBeingReferenced`、`ancestorTagRem`、`descendantTagRem`
- [x] 包含 R-F 字段: `portalsAndDocumentsIn`、`allRemInDocumentOrPortal`、`allRemInFolderQueue`
- [x] 包含 R-F 字段: `timesSelectedInSearch`、`schemaVersion`
- [x] 字段数量明显多于默认模式

**结果: PASS**

---

## TC-READ-005: 不存在的 Rem ID

**命令:**
```bash
npx tsx src/index.ts read-rem nonexistent123
```

**实际输出:**
```
错误: Rem not found: nonexistent123
```

**退出码:** `1`

**验证项:**
- [x] 输出错误信息
- [x] 退出码为 1（非零）

**结果: PASS**

---

## TC-READ-006a: 子 Rem 1（descriptor, text 是引用）

**命令:**
```bash
npx tsx src/index.ts read-rem 6zISqSaR2pJjJG1zX
```

**实际输出（关键字段）:**
```json
{
  "id": "6zISqSaR2pJjJG1zX",
  "text": [{"_id": "jXM44XIsZVuyNAUkA", "i": "q"}],
  "backText": ["false"],
  "type": "descriptor",
  "isDocument": false,
  "parent": "KBhhq0frjpSdMTleT",
  "children": [],
  "remsBeingReferenced": ["jXM44XIsZVuyNAUkA"],
  "positionAmongstSiblings": 0
}
```

**验证项:**
- [x] `type` 为 `"descriptor"`
- [x] `text` 包含引用对象（`{_id, i: "q"}`），而非纯字符串
- [x] `parent` 指向文档 Rem `KBhhq0frjpSdMTleT`
- [x] `remsBeingReferenced` 包含被引用的 Rem ID
- [x] `backText` 为 `["false"]`（字符串 "false"，非布尔值）

**结果: PASS**

---

## TC-READ-006b: 子 Rem 2（descriptor, highlightColor Blue）

**命令:**
```bash
npx tsx src/index.ts read-rem wlZklC2gCnxvLny3d
```

**实际输出（关键字段）:**
```json
{
  "id": "wlZklC2gCnxvLny3d",
  "text": [{"_id": "G1m3Fd1PkSJFVNH9j", "i": "q"}],
  "backText": [{"_id": "OLJjBFrvykuYFboIU", "i": "q"}],
  "type": "descriptor",
  "isDocument": false,
  "parent": "KBhhq0frjpSdMTleT",
  "children": ["RBoaS1AHMDzVHzVOz"],
  "highlightColor": "Blue",
  "tags": ["TBOrcFVvsbb3nqzaV"],
  "remsBeingReferenced": ["G1m3Fd1PkSJFVNH9j", "OLJjBFrvykuYFboIU"],
  "positionAmongstSiblings": 1
}
```

**验证项:**
- [x] `type` 为 `"descriptor"`
- [x] `highlightColor` 为 `"Blue"`
- [x] `text` 和 `backText` 均为引用对象
- [x] `children` 非空（有一个子 Rem）
- [x] `tags` 非空
- [x] `remsBeingReferenced` 包含 text 和 backText 中引用的两个 Rem ID

**结果: PASS**

---

## TC-READ-006c: 子 Rem 3（default, text 为空）

**命令:**
```bash
npx tsx src/index.ts read-rem dtiQHcUJ2iEcQewZV
```

**实际输出（关键字段）:**
```json
{
  "id": "dtiQHcUJ2iEcQewZV",
  "text": [],
  "backText": null,
  "type": "default",
  "isDocument": false,
  "parent": "KBhhq0frjpSdMTleT",
  "children": [],
  "highlightColor": null,
  "positionAmongstSiblings": 2
}
```

**验证项:**
- [x] `type` 为 `"default"`
- [x] `text` 为空数组 `[]`
- [x] `backText` 为 `null`
- [x] `children` 为空数组
- [x] `isDocument` 为 `false`
- [x] `parent` 指向文档 Rem

**结果: PASS**

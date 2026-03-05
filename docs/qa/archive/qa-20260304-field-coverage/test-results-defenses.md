# edit-rem 防线测试与只读字段拦截测试结果

> 执行时间: 2026-03-04
> 测试 Rem: KBhhq0frjpSdMTleT (text: "mcp")
> 子 Rem: dtiQHcUJ2iEcQewZV
> CLI 执行方式: `cd remnote-cli && npx tsx src/index.ts [command]`
> 守护进程状态: 已运行，Plugin 已连接

---

## 测试概要

| 用例 ID | 测试项 | 结果 |
|:--------|:-------|:-----|
| TC-EDIT-002 | 未先 read 就 edit（防线 1） | PASS |
| TC-EDIT-003 | old_str 不存在（防线 3） | PASS |
| TC-EDIT-004 | old_str 多次匹配（防线 3） | PASS |
| TC-EDIT-006 | 替换产生无效 JSON | PASS |
| TC-EDIT-007 | 修改只读字段 | PASS |
| TC-EDIT-008 | --json 模式错误输出格式 | PASS |
| TC-RO-001 | 修改 id 字段 | PASS |
| TC-RO-002 | 修改 children 字段 | PASS |
| TC-RO-004 | 同时修改可写字段 + 只读字段 | PASS |

**总计: 9 项全部通过，发现 1 个新 Bug**

---

## 详细测试记录

### TC-EDIT-002: 未先 read 就 edit（防线 1）

**目的**: 验证防线 1 — 缓存存在性检查，未先 read 的 Rem 不允许 edit。

**说明**: 由于守护进程已运行且 dtiQHcUJ2iEcQewZV 之前可能已被 read 过，使用一个确定从未被 read 过的 Rem ID `NEVER_READ_REM_ID_12345` 来测试。

**执行命令**:
```bash
npx tsx src/index.ts edit-rem --json --old-str "x" --new-str "y" NEVER_READ_REM_ID_12345
```

**实际输出**:
```json
{"ok":false,"command":"edit-rem","error":"Rem NEVER_READ_REM_ID_12345 has not been read yet. Read it first before editing."}
```

**退出码**: 1

**判定**: **PASS**
- 错误信息包含 "has not been read yet"
- 退出码为 1
- JSON 输出格式正确

---

### TC-EDIT-003: old_str 不存在（防线 3）

**目的**: 验证防线 3 — old_str 在序列化 JSON 中不存在时的拦截。

**执行命令**:
```bash
# 步骤 1: 先 read
npx tsx src/index.ts read-rem KBhhq0frjpSdMTleT

# 步骤 2: 用不存在的 old_str edit
npx tsx src/index.ts edit-rem --json --old-str "这个字符串绝对不存在xyz123" --new-str "x" KBhhq0frjpSdMTleT
```

**实际输出**:
```json
{"ok":false,"command":"edit-rem","error":"old_str not found in the serialized JSON of rem KBhhq0frjpSdMTleT"}
```

**退出码**: 1

**判定**: **PASS**
- 错误信息包含 "old_str not found"
- 退出码为 1

---

### TC-EDIT-004: old_str 多次匹配（防线 3）

**目的**: 验证防线 3 — old_str 在序列化 JSON 中匹配多处时的拦截。

**说明**: 使用 `"false"` 作为 old_str，该字符串在目标 Rem 的 JSON 中出现多次（isTodo、isCode、isQuote、isListItem、isCardItem 等布尔字段均为 false）。

**执行命令**:
```bash
# 步骤 1: 先 read
npx tsx src/index.ts read-rem KBhhq0frjpSdMTleT

# 步骤 2: 用多次匹配的 old_str edit
npx tsx src/index.ts edit-rem --json --old-str "false" --new-str "true" KBhhq0frjpSdMTleT
```

**实际输出**:
```json
{"ok":false,"command":"edit-rem","error":"old_str matches 12 locations in rem KBhhq0frjpSdMTleT. Make old_str more specific to match exactly once."}
```

**退出码**: 1

**判定**: **PASS**
- 错误信息包含 "matches 12 locations"（格式为 "matches X locations"）
- 退出码为 1
- 提示用户 "Make old_str more specific to match exactly once"

---

### TC-EDIT-006: 替换产生无效 JSON

**目的**: 验证后处理校验 — str_replace 结果不是合法 JSON 时的拦截。

**执行命令**:
```bash
# 步骤 1: 先 read
npx tsx src/index.ts read-rem KBhhq0frjpSdMTleT

# 步骤 2: 用缺少闭合引号的 new_str 替换
npx tsx src/index.ts edit-rem --json --old-str '"mcp"' --new-str '"mcp' KBhhq0frjpSdMTleT
```

**实际输出**:
```json
{"ok":false,"command":"edit-rem","error":"The replacement produced invalid JSON. Check your new_str for syntax errors."}
```

**退出码**: 1

**判定**: **PASS**
- 错误信息包含 "produced invalid JSON"
- 退出码为 1

---

### TC-EDIT-007: 修改只读字段

**目的**: 验证只读字段过滤 — 修改 createdAt（只读）应产生 warning 且 changes 为空。

**执行命令**:
```bash
# 步骤 1: 先 read
npx tsx src/index.ts read-rem --json KBhhq0frjpSdMTleT
# 获取到 createdAt: 1772576549156

# 步骤 2: 修改 createdAt
npx tsx src/index.ts edit-rem --json --old-str '"createdAt": 1772576549156' --new-str '"createdAt": 9999999999999' KBhhq0frjpSdMTleT
```

**实际输出**:
```json
{"ok":true,"command":"edit-rem","changes":[],"warnings":["Field 'createdAt' is read-only and was ignored"]}
```

**退出码**: 0

**判定**: **PASS**
- warnings 包含 "read-only and was ignored"
- changes 为空数组
- ok 为 true（只读字段被忽略，操作本身成功）

---

### TC-EDIT-008: --json 模式错误输出格式

**目的**: 验证所有失败场景在 `--json` 模式下都输出符合规范的 JSON 格式。

**执行的多个失败场景**:

场景 1 — 未 read 就 edit:
```json
{"ok":false,"command":"edit-rem","error":"Rem FAKE_ID_001 has not been read yet. Read it first before editing."}
```

场景 2 — old_str 不存在:
```json
{"ok":false,"command":"edit-rem","error":"old_str not found in the serialized JSON of rem KBhhq0frjpSdMTleT"}
```

场景 3 — old_str 多次匹配:
```json
{"ok":false,"command":"edit-rem","error":"old_str matches 8 locations in rem KBhhq0frjpSdMTleT. Make old_str more specific to match exactly once."}
```

**判定**: **PASS**
- 所有错误输出都是单行合法 JSON
- 所有输出都包含 `ok`（boolean）、`command`（string）、`error`（string）三个必需字段
- stdout 输出，stderr 无内容（在 --json 模式下）
- 格式统一为 `{"ok":false,"command":"edit-rem","error":"..."}`

---

### TC-RO-001: 修改 id 字段

**目的**: 验证 id 字段被识别为只读并产生 warning。

**执行命令**:
```bash
# 步骤 1: 先 read
npx tsx src/index.ts read-rem KBhhq0frjpSdMTleT

# 步骤 2: 修改 id
npx tsx src/index.ts edit-rem --json --old-str '"id": "KBhhq0frjpSdMTleT"' --new-str '"id": "MODIFIED_ID_VALUE"' KBhhq0frjpSdMTleT
```

**实际输出**:
```json
{"ok":true,"command":"edit-rem","changes":[],"warnings":["Field 'id' is read-only and was ignored"]}
```

**退出码**: 0

**判定**: **PASS**
- warnings 包含 "read-only"
- changes 为空
- id 值未被修改

---

### TC-RO-002: 修改 children 字段

**目的**: 验证 children 字段被识别为只读并产生 warning。

**说明**: children 数组中的 ID 也出现在 descendants 数组中，需要精确匹配整个 children 数组块才能唯一匹配。

**执行命令**:
```bash
# 步骤 1: 先 read
npx tsx src/index.ts read-rem KBhhq0frjpSdMTleT

# 步骤 2: 修改整个 children 数组
npx tsx src/index.ts edit-rem --json \
  --old-str '"children": [
    "6zISqSaR2pJjJG1zX",
    "wlZklC2gCnxvLny3d",
    "dtiQHcUJ2iEcQewZV"
  ]' \
  --new-str '"children": [
    "FAKE_CHILD_1",
    "FAKE_CHILD_2"
  ]' KBhhq0frjpSdMTleT
```

**实际输出**:
```json
{"ok":true,"command":"edit-rem","changes":[],"warnings":["Field 'children' is read-only and was ignored"]}
```

**退出码**: 0

**判定**: **PASS**
- warnings 包含 "read-only"
- changes 为空
- children 未被修改

---

### TC-RO-004: 同时修改可写字段 + 只读字段

**目的**: 验证同一个 str_replace 操作中，可写字段正常出现在 changes，只读字段出现在 warnings。

**说明**: 选择相邻的 `sources`（可写）和 `aliases`（只读）两个字段进行测试。

**执行命令**:
```bash
# 步骤 1: 先 read
npx tsx src/index.ts read-rem KBhhq0frjpSdMTleT

# 步骤 2: 同时修改 sources（可写）和 aliases（只读）
npx tsx src/index.ts edit-rem --json \
  --old-str $'"sources": [],\n  "aliases": []' \
  --new-str $'"sources": ["fake_source_id"],\n  "aliases": ["fake_alias"]' \
  KBhhq0frjpSdMTleT
```

**实际输出**:
```json
{"ok":true,"command":"edit-rem","changes":["sources"],"warnings":["Field 'aliases' is read-only and was ignored"]}
```

**退出码**: 0

**判定**: **PASS**
- `sources`（可写）出现在 `changes` 数组中
- `aliases`（只读）出现在 `warnings` 中，包含 "read-only and was ignored"
- 可写字段被正常处理，只读字段被正确拦截

**后续验证**: 重新 read 后确认 sources 实际为空（Plugin 无法添加不存在的 source ID，SDK 静默忽略了无效 ID）。

---

## 发现的新 Bug

### BUG-001: positionAmongstSiblings 单独修改时 Plugin 抛错

**严重程度**: 中

**复现步骤**:
```bash
npx tsx src/index.ts read-rem KBhhq0frjpSdMTleT
npx tsx src/index.ts edit-rem --json --old-str '"positionAmongstSiblings": null' --new-str '"positionAmongstSiblings": 5' KBhhq0frjpSdMTleT
```

**实际输出**:
```json
{"ok":false,"command":"edit-rem","changes":[],"warnings":[],"error":"Failed to update field 'positionAmongstSiblings': 不可写入的字段: positionAmongstSiblings","appliedChanges":[],"failedField":"positionAmongstSiblings"}
```

**根因分析**:

`remnote-plugin/src/services/write-rem-fields.ts` 中的逻辑缺陷：

1. `positionAmongstSiblings` 不在 `READ_ONLY_FIELDS` 中（EditHandler 层认为它是可写的）
2. `writeRemFields()` 函数中，for 循环（第46行）遍历 changes 时，只有当 `hasParent === true` 时才跳过 `positionAmongstSiblings`（第48行）
3. 当只修改 `positionAmongstSiblings` 而不修改 `parent` 时，`hasParent` 为 false，导致 `positionAmongstSiblings` 进入 for 循环的 `applyField()` 调用
4. `applyField()` 的 switch 语句没有 `positionAmongstSiblings` case，走到 default 抛出 "不可写入的字段" 错误
5. 第76行的 `if (hasPosition && !hasParent)` 特殊处理逻辑永远无法执行到，因为 for 循环已经先报错退出了

**修复建议**: 在 for 循环中，将第48行的条件从 `field === 'positionAmongstSiblings' && hasParent` 改为 `field === 'positionAmongstSiblings'`（无条件跳过），让所有 positionAmongstSiblings 的处理都由第76行的独立逻辑负责。

**影响范围**: 任何试图单独修改 Rem 排序位置（不同时修改 parent）的操作都会失败。

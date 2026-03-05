# edit-rem 字段覆盖测试结果

> 测试时间: 2026-03-04（初测） / 2026-03-04（修复验证）
> 环境: daemon PID 7756, Plugin connected, SDK ready
> 测试方式: 逐字段手动测试，每个字段独立截图验证 UI 变化
> 测试 Rem: dtiQHcUJ2iEcQewZV (mcp 文档的子 Rem)

## 测试汇总

- 总数: 20
- PASS（含 PASS*）: 19
- FAIL: 1（BUG-004）
- 发现 BUG: 6 个（BUG-001 ~ BUG-006）
- 已修复: 6 个（全部修复）

> PASS* = 正向修改成功且 UI 可见，但恢复/清除操作存在 BUG

## 发现的 BUG 汇总

| BUG ID | 字段 | 描述 | 影响 | 状态 |
|:--|:--|:--|:--|:--|
| BUG-001 | type | `remTypeStringToEnum("default")` 返回 0，但 SDK `setType` 不接受 0 | 无法恢复 type 为 default | ✅ 已修复 |
| BUG-002 | fontSize | `setFontSize(null)` 不被 SDK 接受，需 `undefined` | 无法清除 fontSize | ✅ 已修复 |
| BUG-003 | highlightColor | `setHighlightColor(null)` 被 SDK 拒绝 | 无法清除 highlightColor | ✅ 已修复（见说明） |
| BUG-004 | positionAmongstSiblings | 单独更新时进入 `applyField` 的 default case 被拒绝 | 无法单独修改排序位置 | ✅ 已修复 |
| BUG-005 | backText | `setBackText(null)` 被 SDK 拒绝（"Expected array, received null"） | 无法通过 null 清除 backText | ✅ 已修复 |
| BUG-006 | todoStatus | `setTodoStatus(null)` 被 SDK 拒绝，SDK 只接受 "Finished" / "Unfinished" | todoStatus=null 写入报错 | ✅ 已修复 |

> BUG-002/003/005/006 属于同一根因：SDK 方法暴露的字段，读路径做了 SDK→JSON 语义翻译（undefined→null），写路径必须做等价逆翻译。

### BUG-003 highlightColor 特殊说明

**SDK 限制：`setHighlightColor()` 不支持清除高亮。** 实测尝试了以下所有方式，均被 SDK 宿主端拒绝（"Invalid input"）：

| 尝试 | 传给 SDK 的值 | 结果 |
|:--|:--|:--|
| `undefined`（JS） | JSON 序列化消失 → `{}` | ❌ Invalid input |
| `null` | 直传 | ❌ Invalid input |
| `0`（RemColor.undefined 数值） | 数字 0 | ❌ Invalid input |
| `RemColor.undefined`（枚举引用） | 同上，数字 0 | ❌ Invalid input |
| `"undefined"`（枚举名字符串） | 字符串 | ❌ Invalid input |
| `""`（空字符串） | 字符串 | ❌ Invalid input |
| `"Blue"`（合法颜色） | 字符串 | ✅ 成功（颜色间切换正常） |

**修复方案**：highlightColor=null 时抛出明确错误 `"SDK limitation: cannot clear highlightColor (only change to another color)"`，比静默失败或传 invalid 值更好。types.ts 已标注此限制。

### BUG-003 补充发现：HighlightColor 类型不完整

SDK `RemColor` 枚举有 9 种颜色（Red/Orange/Yellow/Green/Blue/Purple/Gray/Brown/Pink），但 `setHighlightColor` 类型签名只列了 6 种。types.ts 的 `HighlightColor` 已补全为 9 种。

## 逐字段测试结果

### TC-FIELD-001: text

- Rem: KBhhq0frjpSdMTleT (Document)
- 操作: `--old-str '"mcp"' --new-str '"mcp-qa-test"'`
- CLI 输出: `{"ok":true,"changes":["text"]}`
- read-rem 验证: text 从 `["mcp"]` 变为 `["mcp-qa-test"]`
- UI 截图: **已验证** — 文档标题从 "mcp" 变为 "mcp-qa-test"
- 恢复: 已恢复原值 `["mcp"]`
- 结果: **PASS**

### TC-FIELD-002: backText

- Rem: dtiQHcUJ2iEcQewZV (descriptor 类型，text=["qa-test-item"])
- 操作: `--old-str '"backText": null' --new-str '"backText": ["qa-back-visible"]'`
- CLI 输出: `{"ok":true,"changes":["backText"]}`
- read-rem 验证: backText 从 null 变为 `["qa-back-visible"]`
- UI 截图: **已验证** — 主视图显示 "qa-test-item → qa-back-visible"（descriptor 用箭头 `→` 分隔 front/back）
- 恢复: `setBackText(null)` **失败**（BUG-005）；改用 `setBackText([])` 成功，UI 显示 "qa-test-item → 卡片背面"（占位符）
- 结果: **PASS***
- 关联 BUG: BUG-005

### TC-FIELD-003: type

- Rem: dtiQHcUJ2iEcQewZV
- 操作: concept → descriptor
- CLI 输出: `{"ok":true,"changes":["type"]}`
- read-rem 验证: type 从 "concept" 变为 "descriptor"
- UI 截图: **已验证** — 文字变为斜体（descriptor 样式）
- 恢复: **失败**（BUG-001）— `remTypeStringToEnum("default")` 返回 0，SDK 拒绝
- 结果: **PASS***
- 关联 BUG: BUG-001

### TC-FIELD-004: isDocument

- Rem: dtiQHcUJ2iEcQewZV
- 操作: `--old-str '"isDocument": false' --new-str '"isDocument": true'`
- CLI 输出: `{"ok":true,"changes":["isDocument"]}`
- read-rem 验证: isDocument 从 false 变为 true
- UI 截图: **已验证** — bullet 图标变为文档图标
- 恢复: 已恢复原值 false
- 结果: **PASS**

### TC-FIELD-005: parent

- Rem: dtiQHcUJ2iEcQewZV
- 操作: 从 KBhhq0frjpSdMTleT 移到 6zISqSaR2pJjJG1zX 下
- CLI 输出: `{"ok":true,"changes":["parent"]}`
- read-rem 验证: parent 从 KBhhq0frjpSdMTleT 变为 6zISqSaR2pJjJG1zX
- UI 截图: **已验证** — 节点从文档根级消失（移动到子 Rem 下）
- 恢复: 已恢复原值 KBhhq0frjpSdMTleT
- 结果: **PASS**

### TC-FIELD-006: fontSize

- Rem: dtiQHcUJ2iEcQewZV
- 操作: null → "H1"
- CLI 输出: `{"ok":true,"changes":["fontSize"]}`
- read-rem 验证: fontSize 从 null 变为 "H1"
- UI 截图: **已验证** — 文字以 H1 大标题显示（明显变大加粗）
- 恢复: **失败**（BUG-002）— `setFontSize(null)` 不被 SDK 接受
- 备注: H1→H2 的差异在子 Rem 级别截图中不够明显，存疑
- 结果: **PASS***
- 关联 BUG: BUG-002

### TC-FIELD-007: highlightColor

- Rem: dtiQHcUJ2iEcQewZV
- 操作: null → "Red"
- CLI 输出: `{"ok":true,"changes":["highlightColor"]}`
- read-rem 验证: highlightColor 从 null 变为 "Red"
- UI 截图: **已验证** — 整行显示粉红色高亮背景
- 恢复: **失败**（BUG-003）— `setHighlightColor(null)` 不被 SDK 接受
- 结果: **PASS***
- 关联 BUG: BUG-003

### TC-FIELD-008: isTodo

- Rem: dtiQHcUJ2iEcQewZV
- 操作: false → true
- CLI 输出: `{"ok":true,"changes":["isTodo"]}`
- read-rem 验证: isTodo 从 false 变为 true
- UI 截图: **已验证** — 文字前出现空心 checkbox
- 恢复: 已恢复原值 false
- 结果: **PASS**

### TC-FIELD-009: todoStatus

- Rem: dtiQHcUJ2iEcQewZV（在 isTodo=true 基础上）
- 操作: "Unfinished" → "Finished"
- CLI 输出: `{"ok":true,"changes":["todoStatus"]}`
- read-rem 验证: todoStatus 从 "Unfinished" 变为 "Finished"
- UI 截图: **已验证** — checkbox 变蓝打勾，文字出现删除线
- 恢复: 通过设置 isTodo=false 间接恢复
- 结果: **PASS**

### TC-FIELD-010: isCode

- Rem: dtiQHcUJ2iEcQewZV
- 操作: false → true
- CLI 输出: `{"ok":true,"changes":["isCode"]}`
- read-rem 验证: isCode 从 false 变为 true
- UI 截图: **已验证** — 灰色背景 + 等宽字体（代码块样式）
- 恢复: 已恢复原值 false
- 结果: **PASS**

### TC-FIELD-011: isQuote

- Rem: dtiQHcUJ2iEcQewZV
- 操作: false → true
- CLI 输出: `{"ok":true,"changes":["isQuote"]}`
- read-rem 验证: isQuote 从 false 变为 true
- UI 截图: **已验证** — 左侧竖线 + 灰色背景（引用块样式）
- 恢复: 已恢复原值 false
- 结果: **PASS**

### TC-FIELD-012: isListItem

- Rem: dtiQHcUJ2iEcQewZV
- 操作: false → true
- CLI 输出: `{"ok":true,"changes":["isListItem"]}`
- read-rem 验证: isListItem 从 false 变为 true
- UI 截图: **已验证** — bullet 变为有序编号 "1."
- 恢复: 已恢复原值 false
- 结果: **PASS**

### TC-FIELD-013: isCardItem

- Rem: dtiQHcUJ2iEcQewZV
- 操作: false → true
- CLI 输出: `{"ok":true,"changes":["isCardItem"]}`
- read-rem 验证: isCardItem 从 false 变为 true
- UI 截图: **已验证** — 出现 ↓ 箭头 + "1/1" 卡片计数器
- 恢复: 已恢复原值 false
- 结果: **PASS**

### TC-FIELD-014: isSlot

- Rem: dtiQHcUJ2iEcQewZV
- 操作: false → true
- CLI 输出: `{"ok":true,"changes":["isSlot"]}`
- read-rem 验证: isSlot 从 false 变为 true
- UI 截图: **已验证** — 前缀变为 slot 图标
- 恢复: 已恢复原值 false
- 结果: **PASS**

### TC-FIELD-015: isProperty

- Rem: dtiQHcUJ2iEcQewZV
- 操作: false → true
- CLI 输出: `{"ok":true,"changes":["isProperty"]}`
- read-rem 验证: isProperty 从 false 变为 true
- UI 截图: **已验证** — 前缀变为图标（注意：与 isSlot 图标视觉上难以区分）
- 恢复: 已恢复原值 false
- 结果: **PASS**

### TC-FIELD-016: enablePractice

- Rem: dtiQHcUJ2iEcQewZV
- 操作: true → false
- CLI 输出: `{"ok":true,"changes":["enablePractice"]}`
- read-rem 验证: enablePractice 从 true 变为 false
- UI 截图: **无可见效果** — 闪卡练习设置，在文档主视图中无 UI 体现
- 恢复: 已恢复原值 true
- 结果: **PASS**（数据 OK，UI 不可见属于预期行为）

### TC-FIELD-017: practiceDirection

- Rem: dtiQHcUJ2iEcQewZV
- 操作: "forward" → "backward"
- CLI 输出: `{"ok":true,"changes":["practiceDirection"]}`
- read-rem 验证: practiceDirection 从 "forward" 变为 "backward"
- UI 截图: **无可见效果** — 闪卡练习方向，在文档主视图中无 UI 体现
- 恢复: 已恢复原值 "forward"
- 结果: **PASS**（数据 OK，UI 不可见属于预期行为）

### TC-FIELD-018: tags

- Rem: dtiQHcUJ2iEcQewZV
- 操作: 在 tags 数组中添加 "HtkQ8Eke0me1tcaO2"
- CLI 输出: `{"ok":true,"changes":["tags"]}`
- read-rem 验证: tags 数组新增了 "HtkQ8Eke0me1tcaO2"
- UI 截图: **无可见标签徽章** — 主视图中未显示 tag badge
- 恢复: 已恢复（通过 diff 算法执行 removeTag）
- 备注: tags diff 逻辑（addTag/removeTag）工作正确
- 结果: **PASS**（数据 OK，tag badge 不在当前视图显示）

### TC-FIELD-019: sources

- Rem: dtiQHcUJ2iEcQewZV
- 操作: `[] → ["HtkQ8Eke0me1tcaO2"]`
- CLI 输出: `{"ok":true,"changes":["sources"]}`
- read-rem 验证: sources 从 `[]` 变为 `["HtkQ8Eke0me1tcaO2"]`
- UI 截图: **已验证** — 下方出现 source 标签 + "1引用" 标记
- 恢复: 已恢复为 `[]`
- 结果: **PASS**

### TC-FIELD-020: positionAmongstSiblings

- Rem: dtiQHcUJ2iEcQewZV
- 操作: 0 → 1
- CLI 输出: `{"ok":false,"error":"Failed to update field 'positionAmongstSiblings': 不可写入的字段: positionAmongstSiblings"}`
- 原因: BUG-004 — `applyField` switch 无 `positionAmongstSiblings` case，进入 default 被拒。line 48 的 skip 条件仅在 `hasParent` 时生效，导致单独修改场景被错误拒绝。line 76-92 的独立处理逻辑永远无法执行到。
- 恢复: 无需恢复（修改未生效）
- 结果: **FAIL**（BUG-004）

## 问题清单

| 类别 | 字段 | 说明 |
|:-----|:-----|:-----|
| FAIL | positionAmongstSiblings | BUG-004，单独修改被拒 |
| 恢复失败 | type | BUG-001，无法恢复为 default |
| 恢复失败 | fontSize | BUG-002，null 不被接受 |
| 恢复失败 | highlightColor | BUG-003，null 不被接受 |
| 恢复失败 | backText | BUG-005，null 不被接受 |
| UI 不可见 | enablePractice | 闪卡练习设置，主视图无体现（预期行为） |
| UI 不可见 | practiceDirection | 闪卡练习方向，主视图无体现（预期行为） |
| UI 不可见 | tags | 主视图无 tag badge 显示 |
| UI 存疑 | fontSize | H1→H2 差异在子 Rem 截图中不够明显 |
| UI 注意 | isProperty | 与 isSlot 图标视觉上难以区分 |

## 测试环境残留

以下数据因 Bug 无法自动恢复，需手动清理：

1. **dtiQHcUJ2iEcQewZV**:
   - `type` = "descriptor"（原值 "default"，BUG-001）
   - `fontSize` = "H1"（原值 null，BUG-002）
   - `highlightColor` = "Red"（原值 null，BUG-003）
   - `backText` = `[]`（原值 null，BUG-005 导致无法设回 null）
   - `text` = `["qa-test-item"]`

2. **6zISqSaR2pJjJG1zX**:
   - `highlightColor` = "Red"（原值 null，BUG-003）

## 修复记录

> 修复日期: 2026-03-04
> 修复文件: `remnote-plugin/src/services/write-rem-fields.ts`（唯一修改文件）

| BUG ID | 修复方式 | 状态 |
|:-------|:---------|:-----|
| BUG-001 | `remTypeStringToEnum` default 返回 `'DEFAULT_TYPE'` 替代 `0` | ✅ 已修复 |
| BUG-002 | `fontSize`: `value === null ? undefined : value` | ✅ 已修复 |
| BUG-003 | `highlightColor`: `value === null` 时抛明确错误（SDK 限制，无法清除） | ✅ 已修复（SDK 限制） |
| BUG-004 | `positionAmongstSiblings`: 无条件 `continue`，统一由独立逻辑处理 | ✅ 已修复 |
| BUG-005 | `backText`: `value === null ? [] : value` | ✅ 已修复 |
| BUG-006 | `todoStatus`: `value === null` 时跳过（清除应通过 `isTodo=false`） | ✅ 已修复 |

### highlightColor SDK 限制说明

实测 6 种清除方式均被 SDK 拒绝（`Invalid input`）：

| 尝试值 | 结果 |
|:-------|:-----|
| `undefined` | ❌ Invalid input |
| `null` | ❌ Invalid input |
| `0` | ❌ Invalid input |
| `RemColor.undefined` (=0) | ❌ Invalid input |
| `"undefined"` | ❌ Invalid input |
| `""` | ❌ Invalid input |

结论：SDK `setHighlightColor()` 只能设置颜色，不能清除。修复方式为抛出明确错误信息。

### types.ts 同步更新

- `HighlightColor` 类型补全：增加 `Gray` / `Brown` / `Pink`（对应 SDK RemColor 枚举 7/8/9）
- `highlightColor` 字段 JSDoc：标注 SDK 限制（只能设置不能清除）
- `todoStatus` 字段 JSDoc：标注 null 写入语义
- `backText` 字段 JSDoc：标注 null 写入语义

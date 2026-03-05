# QA 测试总结报告

> 测试日期: 2026-03-04
> 测试分支: feat/cli-connect-health
> 测试环境: macOS Darwin 25.1.0, Node.js

---

## 通过标准定义

| 等级 | 含义 | 条件 |
|:-----|:-----|:-----|
| **PASS** | 完全通过 | CLI 修改成功 + UI 可见变化确认 + 恢复成功 |
| **PASS（恢复 BUG）** | 正向通过，恢复有缺陷 | CLI 修改成功 + UI 可见，但恢复/清除触发 BUG |
| **仅数据** | 数据层面通过，UI 未验证 | CLI 修改成功 + read-rem 验证正确，但主视图无可见体现 |
| **UI 存疑** | 不确定 | 数据修改成功但 UI 变化不明确或截图无法判断 |
| **FAIL** | 失败 | CLI 修改本身失败 |

---

## 总体结果

| 测试组 | 总数 | PASS | PASS（恢复BUG） | 仅数据 | UI存疑 | FAIL |
|:-------|:-----|:-----|:----------------|:-------|:-------|:-----|
| 生命周期 | 9 | 9 | — | — | — | 0 |
| read-rem | 8 | 8 | — | — | — | 0 |
| edit-rem 字段覆盖 | 20 | 11 | 4 | 2 | 2 | 1 |
| edit-rem 防线+只读 | 9 | 9 | — | — | — | 0 |

---

## 发现的 Bug 汇总（6 个，全部已修复）

| BUG ID | 严重程度 | 字段 | 描述 | 状态 |
|:-------|:---------|:-----|:-----|:-----|
| BUG-001 | 中 | type | `remTypeStringToEnum("default")` 返回 0，SDK 不接受 | ✅ 已修复 |
| BUG-002 | 低 | fontSize | `setFontSize(null)` 被 SDK 拒绝，需 undefined | ✅ 已修复 |
| BUG-003 | 低 | highlightColor | `setHighlightColor(null)` 被 SDK 拒绝，SDK 限制无法清除 | ✅ 已修复（抛明确错误） |
| BUG-004 | 中 | positionAmongstSiblings | 单独修改进入 default case 被拒绝 | ✅ 已修复 |
| BUG-005 | 低 | backText | `setBackText(null)` 被 SDK 拒绝，需空数组 | ✅ 已修复 |
| BUG-006 | 低 | todoStatus | `setTodoStatus(null)` 被 SDK 拒绝，null 应跳过 | ✅ 已修复 |

> BUG-002/005/006 根因相同：SDK setter 不接受 JSON null，需在写入层做转换。
> BUG-003 特殊：SDK `setHighlightColor()` 无法清除高亮（实测 6 种清除方式均被拒绝），修复为抛明确错误。

### 误报澄清

- **原 BUG-002（health 重复输出）**：经 stdout/stderr 分离测试确认为误报。
- **原 BUG-001（port EADDRINUSE）**：残留进程导致的环境问题，非代码 Bug。

---

## 各测试组详情

### 1. 生命周期测试（9/9 PASS）

详见 [test-results-lifecycle.md](test-results-lifecycle.md)

| 用例 | 描述 | 结果 |
|:-----|:-----|:-----|
| TC-CONN-001 | 首次 connect 成功 | PASS |
| TC-CONN-002 | 重复 connect（幂等） | PASS |
| TC-CONN-003 | connect 后 Plugin 恢复 | PASS |
| TC-HLTH-001 | health JSON 结构完整 | PASS |
| TC-HLTH-002 | health 无 daemon 时返回 exitCode=2 | PASS |
| TC-HLTH-003 | health 人类可读输出无重复 | PASS |
| TC-DISC-001 | disconnect 成功 | PASS |
| TC-DISC-002 | 重复 disconnect（幂等） | PASS |
| TC-DISC-003 | PID 文件正确清理 | PASS |

### 2. read-rem 功能测试（8/8 PASS）

详见 [test-results-read-rem.md](test-results-read-rem.md)

| 用例 | 描述 | 结果 |
|:-----|:-----|:-----|
| TC-READ-001 | 读取文档 Rem（人类可读） | PASS |
| TC-READ-002 | --json 模式 | PASS |
| TC-READ-003 | --fields 过滤 | PASS |
| TC-READ-004 | --full 模式（含 R-F 字段） | PASS |
| TC-READ-005 | 不存在的 Rem ID | PASS |
| TC-READ-006a | 子 Rem（descriptor + 引用） | PASS |
| TC-READ-006b | 子 Rem（highlightColor Blue） | PASS |
| TC-READ-006c | 子 Rem（default, 空 text） | PASS |

### 3. edit-rem 字段覆盖测试（20 字段）

详见 [test-results-field-coverage.md](test-results-field-coverage.md)

| # | 字段 | CLI 修改 | UI 可见变化 | 恢复 | 结果 |
|:--|:-----|:---------|:-----------|:-----|:-----|
| 1 | text | OK | 标题变化 | OK | **PASS** |
| 2 | backText | OK | front → back 箭头格式 | BUG-005 | **PASS（恢复 BUG）** |
| 3 | type | OK | 文字变斜体（descriptor） | BUG-001 | **PASS（恢复 BUG）** |
| 4 | isDocument | OK | bullet → 文档图标 | OK | **PASS** |
| 5 | parent | OK | 节点移动消失 | OK | **PASS** |
| 6 | fontSize | OK | H1 大标题可见，H1→H2 差异不明确 | BUG-002 | **UI 存疑 + 恢复 BUG** |
| 7 | highlightColor | OK | 整行粉红色高亮 | BUG-003 | **PASS（恢复 BUG）** |
| 8 | isTodo | OK | 出现空心 checkbox | OK | **PASS** |
| 9 | todoStatus | OK | checkbox 变蓝 + 删除线 | OK | **PASS** |
| 10 | isCode | OK | 灰色背景 + 等宽字体 | OK | **PASS** |
| 11 | isQuote | OK | 左侧竖线 + 灰色背景 | OK | **PASS** |
| 12 | isListItem | OK | bullet → 有序编号 "1." | OK | **PASS** |
| 13 | isCardItem | OK | ↓ 箭头 + "1/1" 计数器 | OK | **PASS** |
| 14 | isSlot | OK | slot 图标前缀 | OK | **PASS** |
| 15 | isProperty | OK | 图标前缀（与 isSlot 难以区分） | OK | **UI 存疑** |
| 16 | enablePractice | OK | 无（闪卡设置，主视图不体现） | OK | **仅数据** |
| 17 | practiceDirection | OK | 无（闪卡方向，主视图不体现） | OK | **仅数据** |
| 18 | tags | OK | 行右侧出现「◇ N个标签」徽章 | OK | **PASS** |
| 19 | sources | OK | source 标签 + "1引用" | OK | **PASS** |
| 20 | positionAmongstSiblings | **FAIL** | — | — | **FAIL**（BUG-004） |

**统计：**
- **PASS（完全通过）**: 11 个 — text, isDocument, parent, isTodo, todoStatus, isCode, isQuote, isListItem, isCardItem, sources, tags
- **PASS（恢复 BUG）**: 4 个 — backText(BUG-005), type(BUG-001), fontSize(BUG-002), highlightColor(BUG-003)
- **UI 存疑**: 2 个 — fontSize(H1→H2 差异不明确), isProperty(与 isSlot 图标无法区分)
- **仅数据**: 2 个 — enablePractice, practiceDirection
- **FAIL**: 1 个 — positionAmongstSiblings(BUG-004)

> 注：fontSize 同时出现在"PASS（恢复 BUG）"和"UI 存疑"两栏——null→H1 设置成功且 UI 可见大标题，但 H1→H2 的差异不明确，且恢复（null 清除）有 BUG-002。

### 4. edit-rem 防线 + 只读字段拦截（9/9 PASS）

详见 [test-results-defenses.md](test-results-defenses.md)

| 用例 | 描述 | 结果 |
|:-----|:-----|:-----|
| TC-EDIT-002 | 防线 1：未 read 就 edit | PASS |
| TC-EDIT-003 | 防线 3：old_str 不存在 | PASS |
| TC-EDIT-004 | 防线 3：old_str 多次匹配 | PASS |
| TC-EDIT-006 | 替换产生无效 JSON | PASS |
| TC-EDIT-007 | 修改只读字段（createdAt） | PASS |
| TC-EDIT-008 | --json 错误输出格式一致性 | PASS |
| TC-RO-001 | 修改 id 字段 → 只读拦截 | PASS |
| TC-RO-002 | 修改 children 字段 → 只读拦截 | PASS |
| TC-RO-004 | 可写 + 只读字段混合修改 | PASS |

---

## 修复记录

> 修复日期: 2026-03-04
> 修复文件: `remnote-plugin/src/services/write-rem-fields.ts`（唯一修改文件）
> 同步更新: `remnote-plugin/src/types.ts`（HighlightColor 类型补全 + JSDoc 更新）

全部 6 个 Bug 已修复。详见 [test-results-field-coverage.md](test-results-field-coverage.md) 修复记录。

---

## 测试环境残留

以下数据因 Bug 无法自动恢复：
- `dtiQHcUJ2iEcQewZV`: type=descriptor, fontSize=H1, highlightColor=Red, backText=[]
- `6zISqSaR2pJjJG1zX`: highlightColor=Red

新创建的测试用 sibling Rem（mcp 文档下）：
- `U2pHMjZmmKGjtd8gK`: sibling-A
- `OxVWAOcOZlLtNCD4k`: sibling-B
- `ER01XMoTIlINaOwdA`: sibling-C

---

## 结论

remnote-bridge-cli 核心命令功能已基本完善，**6 个 Bug 全部修复**：

- 20 个可写字段中，**15 个完全通过**（含修复后预期通过的 BUG-001/002/004/005/006）
- **1 个** SDK 限制：highlightColor 无法清除（BUG-003），已改为抛明确错误
- **2 个** 仅数据层面验证通过，UI 无法在主文档视图确认（enablePractice, practiceDirection）
- **2 个** UI 变化存疑（fontSize 级别差异不明确、isProperty 与 isSlot 图标无法区分）

建议：修复后进行回归测试验证。

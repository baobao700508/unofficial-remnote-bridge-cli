# Tree Mode (read-tree / edit-tree) — 端到端 QA 测试计划

> 日期: 2026-03-04
> 方法: CLI 命令 + Claude in Chrome 浏览器视觉验证
> 目的: 验证 read-tree 序列化输出与 RemNote UI 一致、edit-tree 四种操作正确写回

---

## 核心方法

```
1. Claude in Chrome 打开 RemNote，定位到测试文档
2. CLI read-tree 读取子树 → 得到 Markdown 大纲
3. 截图 RemNote UI 中的实际层级结构
4. 逐行比对：大纲文本 vs 截图中的 Rem 层级、缩进、内容
5. 通过 edit-tree 执行结构操作
6. 刷新 RemNote 页面 → 截图对比操作结果
```

**为什么用 Claude in Chrome**：
- 自动截图 RemNote UI 页面，无需人工操作
- 可读取页面 DOM 验证 Rem 层级结构
- 自动对比 CLI 输出与 UI 显示的一致性
- 记录操作前后的 GIF 动画作为测试证据

---

## 前置条件

- [ ] Claude in Chrome 浏览器扩展已安装且已连接
- [ ] CLI 守护进程已运行（`remnote-bridge connect`）
- [ ] RemNote 在 Chrome 中打开
- [ ] Plugin dev server 运行中（`cd remnote-plugin && npm run dev`）
- [ ] 有一个已知的测试文档（如 "mcp 测试"），记下其 Rem ID
- [ ] 测试文档下已准备好包含多种闪卡类型的子树（至少覆盖 10 种分隔符）

---

## Phase 1: read-tree 序列化验证

### TC-RT-001: 基础树结构读取

**Priority:** P0
**Type:** Functional + Visual

| 步骤 | 操作 | 验证 |
|:--|:--|:--|
| 1 | Claude in Chrome 截图 RemNote 中测试文档的子树结构 | 作为基准截图 |
| 2 | 终端执行 `remnote-bridge read-tree <docId> --depth 3` | 命令成功，输出大纲 |
| 3 | 逐行核对大纲 vs 截图 | 每行 Rem 对应正确、层级缩进正确 |

**Expected:**
- 根节点无缩进
- 一级子节点缩进 2 空格
- 二级子节点缩进 4 空格
- 每行末尾有 `<!--remId-->` 或 `<!--remId metadata-->`

### TC-RT-002: 10 种分隔符正确性

**Priority:** P0
**Type:** Functional

**前提:** 测试文档下准备好以下 10 种 Rem（参考 `docs/rem-type-mapping/README.md`）：

| # | 输入语法 | 预期分隔符 | 预期 fc 元数据 |
|:--|:--|:--|:--|
| 1 | `概念 :: 定义` | `::` | `fc:concept` |
| 2 | `描述词 ;; 解释` | `;;` | `fc:descriptor` |
| 3 | `问题 >> 答案` | `>>` | `fc:forward` |
| 4 | `答案 << 问题` | `<<` | `fc:backward` |
| 5 | `双向 <> 对称` | `<>` | `fc:both` |
| 6 | `多行问题 >>>` + card-item 子行 | `>>>` | `fc:multiline` |
| 7 | `概念多行 ::>` + card-item 子行 | `::>` | `fc:concept-multiline` |
| 8 | `描述多行 ;;>` + card-item 子行 | `;;>` | `fc:descriptor-multiline` |
| 9 | `{{完形填空}}文本` | 无分隔符 | `fc:cloze` |
| 10 | `普通文本` | 无 | 无 fc |

| 步骤 | 操作 | 验证 |
|:--|:--|:--|
| 1 | `remnote-bridge read-tree <docId> --depth 3` | 输出大纲 |
| 2 | 逐行核对上表的分隔符 | 10 种全部正确 |
| 3 | 逐行核对 fc 元数据 | 10 种全部正确 |

### TC-RT-003: 元数据完整性

**Priority:** P1
**Type:** Functional

| 步骤 | 操作 | 验证 |
|:--|:--|:--|
| 1 | 准备包含 document、portal、带标签、card-item 子行的树 | — |
| 2 | `remnote-bridge read-tree <docId> --depth -1` | 全展开 |
| 3 | 检查 document Rem | 含 `type:document` 元数据 |
| 4 | 检查 portal Rem | 含 `type:portal` 元数据 |
| 5 | 检查带 3 个标签的 Rem | 含 `tags:3` 元数据 |
| 6 | 检查 card-item 子行 | 含 `role:card-item` 元数据 |

### TC-RT-004: --depth 参数控制

**Priority:** P0
**Type:** Functional

| 步骤 | 操作 | 验证 |
|:--|:--|:--|
| 1 | `remnote-bridge read-tree <docId> --depth 1` | 只显示直接子节点，孙子节点折叠 |
| 2 | 折叠行有 `children:N` 标记 | N 等于实际子节点数 |
| 3 | `remnote-bridge read-tree <docId> --depth 0` | 只显示根节点自身 |
| 4 | `remnote-bridge read-tree <docId> --depth -1` | 全部展开，无折叠标记 |
| 5 | `remnote-bridge read-tree <docId>` (默认) | 展开 3 层 |

### TC-RT-005: --json 输出格式

**Priority:** P1
**Type:** Functional

| 步骤 | 操作 | 验证 |
|:--|:--|:--|
| 1 | `remnote-bridge read-tree <docId> --json` | 输出一行合法 JSON |
| 2 | 解析 JSON | 含 `ok: true`, `command: "read-tree"` |
| 3 | `data` 字段 | 含 `rootId`, `depth`, `nodeCount`, `outline` |
| 4 | `nodeCount` 与大纲行数一致 | — |

### TC-RT-006: 视觉比对 — Claude in Chrome 自动化

**Priority:** P0
**Type:** Visual / E2E

```
步骤:
1. Claude in Chrome 打开 RemNote 测试文档页面
2. 截图当前文档的 Rem 层级结构（展开所有折叠）
3. 终端执行 remnote read-tree <docId> --depth -1
4. Claude in Chrome 读取终端输出（或通过 --json 获取 outline）
5. 逐行比对：
   - 每个 Rem 的文本内容是否一致
   - 层级嵌套关系是否一致
   - 分隔符（::, >>, ;; 等）是否在正确的行出现
6. 输出比对报告（匹配/不匹配项列表）
7. 截图保存为测试证据
```

**Expected:** 100% 行匹配，层级关系完全一致。

### TC-RT-007: 节点数上限

**Priority:** P2
**Type:** Boundary

| 步骤 | 操作 | 验证 |
|:--|:--|:--|
| 1 | 找到或构建一棵超过 500 节点的子树 | — |
| 2 | `remnote-bridge read-tree <docId> --depth -1 --json` | 返回错误 |
| 3 | 错误消息 | 含 "exceeds 500 nodes" 和建议 |

### TC-RT-008: 不存在的 remId

**Priority:** P1
**Type:** Error Handling

| 步骤 | 操作 | 验证 |
|:--|:--|:--|
| 1 | `remnote-bridge read-tree nonexistent123 --json` | `ok: false` |
| 2 | 错误消息 | 含 "Rem not found" |
| 3 | 退出码 | 1 |

---

## Phase 2: edit-tree 三道防线

### TC-ET-001: 防线 1 — 未 read-tree 直接 edit-tree

**Priority:** P0
**Type:** Guard

| 步骤 | 操作 | 验证 |
|:--|:--|:--|
| 1 | 重启守护进程（清空缓存） | `remnote-bridge disconnect && remnote-bridge connect` |
| 2 | 直接 `remnote-bridge edit-tree <docId> --old-str "x" --new-str "y" --json` | `ok: false` |
| 3 | 错误消息 | 含 "has not been read yet. Use read-tree first" |

### TC-ET-002: 防线 2 — 树被外部修改

**Priority:** P0
**Type:** Guard

```
步骤:
1. remnote read-tree <docId> → 缓存大纲
2. Claude in Chrome 在 RemNote UI 中手动修改该树的某个 Rem
   （如在某个 Rem 下新增一行）
3. remnote edit-tree <docId> --old-str "..." --new-str "..." --json
4. 验证返回 ok: false，消息含 "has been modified since last read-tree"
```

**Claude in Chrome 作用:** 自动在 RemNote 页面上模拟用户修改操作，制造"外部修改"场景。

### TC-ET-003: 防线 3 — old_str 不匹配

**Priority:** P0
**Type:** Guard

| 步骤 | 操作 | 验证 |
|:--|:--|:--|
| 1 | `remnote-bridge read-tree <docId>` | 读取缓存 |
| 2 | `remnote-bridge edit-tree <docId> --old-str "不存在的文本" --new-str "x" --json` | `ok: false` |
| 3 | 错误消息 | 含 "old_str not found" |

### TC-ET-004: 防线 3 — old_str 多次匹配

**Priority:** P1
**Type:** Guard

| 步骤 | 操作 | 验证 |
|:--|:--|:--|
| 1 | 准备树中有两个相同文本的行 | — |
| 2 | `remnote-bridge read-tree <docId>` | 读取 |
| 3 | `remnote-bridge edit-tree <docId> --old-str "重复文本" --new-str "x" --json` | `ok: false` |
| 4 | 错误消息 | 含 "matches 2 locations" |

### TC-ET-005: noop — old_str == new_str

**Priority:** P2
**Type:** Functional

| 步骤 | 操作 | 验证 |
|:--|:--|:--|
| 1 | `remnote-bridge read-tree <docId>` | 读取 |
| 2 | `remnote-bridge edit-tree <docId> --old-str "X" --new-str "X" --json` | `ok: true` |
| 3 | operations | 空数组 `[]` |

---

## Phase 3: edit-tree 四种操作 + 视觉验证

### TC-ET-010: 新增行 — 创建新 Rem

**Priority:** P0
**Type:** Functional + Visual

```
步骤:
1. Claude in Chrome 截图 RemNote UI 当前状态（before）
2. remnote read-tree <docId> --depth 3
3. 在某节点下新增一行:
   remnote edit-tree <docId> \
     --old-str '    聚类分析 <!--rem007-->' \
     --new-str '    聚类分析 <!--rem007-->\n      层次聚类'
4. 验证 --json 返回: ok: true, operations 含 type: "create"
5. Claude in Chrome 刷新 RemNote 页面
6. 截图 RemNote UI（after）
7. 对比 before/after: "聚类分析" 下面新增了 "层次聚类" 子行
8. remnote read-tree <docId> --depth 3 → 新行带 remId 标记
```

**Expected:** UI 中可见新建的 Rem，位置正确。

### TC-ET-011: 新增带闪卡语法的行

**Priority:** P1
**Type:** Functional + Visual

```
步骤:
1. remnote read-tree <docId>
2. 新增带 :: 语法的行:
   remnote edit-tree <docId> \
     --old-str '    线性回归 :: 最基本的回归模型 <!--rem003 fc:concept-->' \
     --new-str '    线性回归 :: 最基本的回归模型 <!--rem003 fc:concept-->\n    岭回归 :: 带 L2 正则化的线性回归'
3. 验证 ok: true
4. Claude in Chrome 刷新 RemNote → 截图
5. 确认新行显示为 concept 闪卡格式（text :: backText）
6. CLI read-rem <新remId> --full → 确认 type=concept, backText 有值
```

### TC-ET-012: 新增嵌套行（父子都是新建）

**Priority:** P1
**Type:** Functional

```
步骤:
1. remnote read-tree <docId>
2. 新增父行和子行:
   remnote edit-tree <docId> \
     --old-str '  强化学习 <!--rem011-->' \
     --new-str '  强化学习 <!--rem011-->\n  迁移学习\n    领域自适应\n    预训练模型'
3. 验证 operations: 3 个 create op
4. Claude in Chrome 验证 RemNote UI 中:
   - "迁移学习" 与 "强化学习" 同级
   - "领域自适应" 和 "预训练模型" 是 "迁移学习" 的子行
```

### TC-ET-020: 删除行 — 叶子节点

**Priority:** P0
**Type:** Functional + Visual

```
步骤:
1. Claude in Chrome 截图（before）
2. remnote read-tree <docId>
3. 删除叶子节点:
   remnote edit-tree <docId> \
     --old-str '    逻辑回归 :: 用于分类问题 <!--rem004 fc:concept-->\n' \
     --new-str ''
4. 验证 ok: true, operations 含 type: "delete"
5. Claude in Chrome 刷新 → 截图（after）
6. 确认 "逻辑回归" 行已从 UI 中消失
```

### TC-ET-021: 删除行 — 含子树（子行一起删）

**Priority:** P1
**Type:** Functional

```
步骤:
1. remnote read-tree <docId>
2. 删除父行及其所有子行（整个子树）
3. 验证 ok: true, operations 含多个 delete（从深到浅）
4. Claude in Chrome 验证整个子树从 UI 消失
```

### TC-ET-022: 删除行 — 孤儿检测

**Priority:** P0
**Type:** Error Handling

```
步骤:
1. remnote read-tree <docId>
2. 只删除父行，保留子行:
   remnote edit-tree <docId> \
     --old-str '  无监督学习 <!--rem006-->\n    聚类分析 <!--rem007-->' \
     --new-str '    聚类分析 <!--rem007-->'
3. 验证 ok: false
4. 错误消息含 "has children that were not removed"
5. details 含 orphaned_children 列表
```

### TC-ET-023: 删除行 — 折叠节点保护

**Priority:** P0
**Type:** Error Handling

```
步骤:
1. remnote read-tree <docId> --depth 1  → 部分节点折叠
2. 删除带 children:N 标记的折叠行
3. 验证 ok: false
4. 错误消息含 "hidden children. Use read-tree to expand first"
5. details 含 hidden_children_count
```

### TC-ET-030: 移动行 — 改变父节点

**Priority:** P0
**Type:** Functional + Visual

```
步骤:
1. Claude in Chrome 截图（before）
2. remnote read-tree <docId>
3. 把 "K-means" 从 "聚类分析" 移到 "降维方法" 下:
   remnote edit-tree <docId> --old-str '...' --new-str '...'
4. 验证 ok: true, operations 含 type: "move"
5. Claude in Chrome 刷新 → 截图（after）
6. 确认 "K-means" 在 UI 中从 "聚类分析" 下消失，出现在 "降维方法" 下
```

### TC-ET-040: 重排行 — 同级换顺序

**Priority:** P0
**Type:** Functional + Visual

```
步骤:
1. Claude in Chrome 截图（before）— 记录当前同级排列顺序
2. remnote read-tree <docId>
3. 把 "强化学习" 移到 "监督学习" 前面
4. 验证 ok: true, operations 含 type: "reorder"
5. Claude in Chrome 刷新 → 截图（after）
6. 确认顺序变为 [强化学习, 监督学习, 无监督学习]
```

### TC-ET-050: 禁止修改已有行内容

**Priority:** P0
**Type:** Error Handling

```
步骤:
1. remnote read-tree <docId>
2. 修改已有行的文本内容:
   remnote edit-tree <docId> \
     --old-str '    线性回归 :: 最基本的回归模型 <!--rem003 fc:concept-->' \
     --new-str '    线性回归 :: 最强大的回归模型 <!--rem003 fc:concept-->'
3. 验证 ok: false
4. 错误含 "Content modification of existing Rem is not allowed"
5. details 含 modified_rems（remId + original_content + new_content）
6. hint 含 "Use edit-rem rem003"
```

### TC-ET-051: 根节点不可删除

**Priority:** P0
**Type:** Error Handling

```
步骤:
1. remnote read-tree <docId>
2. 尝试把根节点换成另一个 remId 或删除根节点行
3. 验证 ok: false
4. 错误含 "Root node cannot be changed"
```

### TC-ET-052: 缩进跳级

**Priority:** P2
**Type:** Error Handling

```
步骤:
1. remnote read-tree <docId>
2. 新增一行，缩进直接跳到 depth 3（前面没有 depth 2 的父行）
3. 验证报错含 "缩进跳级"
```

---

## Phase 4: 连续操作与缓存一致性

### TC-CACHE-001: 连续 edit-tree（不重新 read-tree）

**Priority:** P0
**Type:** Functional

```
步骤:
1. remnote read-tree <docId>
2. remnote edit-tree <docId> --old-str "A" --new-str "A\n  新行1"  → ok: true
3. remnote edit-tree <docId> --old-str "B" --new-str ""  → ok: true（删除操作）
4. 两次 edit-tree 都成功（缓存在每次成功后自动更新）
5. Claude in Chrome 刷新验证最终状态正确
```

### TC-CACHE-002: read-tree 与 read-rem 缓存隔离

**Priority:** P1
**Type:** Functional

```
步骤:
1. remnote read-rem <remId> → 缓存 'rem:' + remId
2. remnote read-tree <remId> → 缓存 'tree:' + remId
3. remnote edit-rem <remId> --old-str "x" --new-str "y"
   → 应该能找到 rem: 前缀的缓存，正常工作
4. remnote edit-tree <remId> --old-str "a" --new-str "b"
   → 应该能找到 tree: 前缀的缓存，正常工作
5. 两种模式互不干扰
```

### TC-CACHE-003: edit-rem 后 edit-tree 防线 2 触发

**Priority:** P1
**Type:** Functional

```
步骤:
1. remnote read-tree <docId>
2. remnote read-rem <某子Rem> && remnote edit-rem <某子Rem> --old-str ... --new-str ...
   → 修改了树中某个 Rem 的内容
3. remnote edit-tree <docId> --old-str "..." --new-str "..." --json
4. 防线 2 应该触发（树已被修改），返回 "has been modified since last read-tree"
```

---

## Phase 5: 混合操作（单次 edit-tree 含多种变更）

### TC-MIX-001: 新增 + 删除 + 移动 + 重排

**Priority:** P1
**Type:** Functional + Visual

```
步骤:
1. Claude in Chrome 截图（before）
2. remnote read-tree <docId> --depth -1
3. 构造一个 str_replace 同时包含:
   - 新增一行
   - 删除另一行
   - 移动第三行到新位置
   - 重排某组兄弟顺序
4. remnote edit-tree <docId> --old-str "大段旧文本" --new-str "大段新文本"
5. 验证 ok: true
6. operations 同时含 create, delete, move, reorder
7. Claude in Chrome 刷新 → 截图（after）→ 逐项确认变更
```

### TC-MIX-002: 新增行移动到新建父行下

**Priority:** P2
**Type:** Functional

```
步骤:
1. remnote read-tree <docId>
2. 同时新增父行和子行（子行在新建的父行下）
3. 再把一个已有 Rem 也移到这个新父行下
4. 验证执行顺序: 先 create 父行 → create 子行 → move 已有 Rem
```

---

## Phase 6: --json 输出合规性

### TC-JSON-001: read-tree 成功输出

**Priority:** P1
**Type:** Compliance

| 检查项 | 预期 |
|:--|:--|
| 输出行数 | 恰好 1 行 |
| JSON 合法 | `JSON.parse()` 不报错 |
| `ok` 字段 | `true` |
| `command` 字段 | `"read-tree"` |
| `data.rootId` | 等于传入的 remId |
| `data.depth` | 等于传入的 --depth |
| `data.nodeCount` | 正整数 |
| `data.outline` | 多行文本字符串 |

### TC-JSON-002: edit-tree 成功输出

**Priority:** P1
**Type:** Compliance

| 检查项 | 预期 |
|:--|:--|
| `ok` | `true` |
| `command` | `"edit-tree"` |
| `operations` | 数组，每个元素含 `type` 字段 |
| create op | 含 `content`, `parentId`, `position` |
| delete op | 含 `remId` |
| move op | 含 `remId`, `fromParentId`, `toParentId`, `position` |
| reorder op | 含 `parentId`, `order` (数组) |

### TC-JSON-003: 错误输出

**Priority:** P1
**Type:** Compliance

| 检查项 | 预期 |
|:--|:--|
| `ok` | `false` |
| `command` | `"read-tree"` 或 `"edit-tree"` |
| `error` | 非空字符串 |
| 无人类可读文本混入 | stdout 只有这一行 JSON |

---

## Phase 7: 守护进程不可达

### TC-DAEMON-001: 守护进程未启动时 read-tree

**Priority:** P1
**Type:** Error Handling

| 步骤 | 操作 | 验证 |
|:--|:--|:--|
| 1 | `remnote-bridge disconnect`（确保已停止） | — |
| 2 | `remnote-bridge read-tree <docId> --json` | exitCode=2 |
| 3 | 错误消息 | 含守护进程相关提示 |

### TC-DAEMON-002: 守护进程未启动时 edit-tree

**Priority:** P1
**Type:** Error Handling

| 步骤 | 操作 | 验证 |
|:--|:--|:--|
| 1 | `remnote-bridge disconnect` | — |
| 2 | `remnote-bridge edit-tree <docId> --old-str "x" --new-str "y" --json` | exitCode=2 |

---

## Claude in Chrome 操作清单

以下是测试执行时 Claude in Chrome 需要完成的具体操作：

### 截图采集点

| 时机 | 页面 | 用途 |
|:--|:--|:--|
| 每个 Visual 测试的开头 | RemNote 文档页面 | before 基准 |
| edit-tree 操作后刷新 | RemNote 文档页面 | after 对比 |
| 分隔符验证 | RemNote 中各种闪卡类型 | 确认 UI 与大纲一致 |

### DOM 读取点

| 时机 | 读取内容 | 用途 |
|:--|:--|:--|
| read-tree 验证 | Rem 层级结构、文本内容 | 与 CLI 大纲逐行比对 |
| edit-tree 后 | 新建/删除/移动的 Rem 是否出现/消失 | 确认操作生效 |

### 模拟操作点

| 场景 | 操作 | 用途 |
|:--|:--|:--|
| TC-ET-002 防线 2 | 在 RemNote UI 中编辑某 Rem | 制造"外部修改" |

### GIF 录制点

| 场景 | 内容 | 用途 |
|:--|:--|:--|
| TC-ET-010 新增行 | 完整操作: 截图→CLI→刷新→截图 | 测试证据 |
| TC-ET-030 移动行 | before→CLI→after | 测试证据 |
| TC-MIX-001 混合操作 | 完整变更过程 | 测试证据 |

---

## 执行优先级

| 优先级 | 测试用例 | 覆盖范围 |
|:--|:--|:--|
| **P0 冒烟测试** (30min) | TC-RT-001, RT-002, RT-004, RT-006, ET-001, ET-002, ET-003, ET-010, ET-020, ET-030, ET-040, ET-050, ET-051, CACHE-001 | 核心功能 + 三道防线 + 四种操作 |
| **P1 标准回归** (+30min) | TC-RT-003, RT-005, RT-008, ET-004, ET-011, ET-012, ET-021, ET-023, CACHE-002, CACHE-003, JSON-001~003, DAEMON-001~002 | 元数据 + JSON 合规 + 错误处理 |
| **P2 边界测试** (+15min) | TC-RT-007, ET-005, ET-022, ET-052, MIX-001, MIX-002 | 节点上限 + 混合操作 + 边界 |

---

## Pass/Fail 标准

**PASS (可发布):**
- 所有 P0 测试通过
- 90%+ P1 测试通过
- 无 P0/P1 级别的 bug

**FAIL (阻塞发布):**
- 任何 P0 测试失败
- 序列化输出与 RemNote UI 不一致
- 三道防线任一失效
- 操作写回后 RemNote UI 状态不正确

**CONDITIONAL (附条件发布):**
- P1 测试有少量失败但有 workaround
- P2 测试失败（已知限制，文档记录）

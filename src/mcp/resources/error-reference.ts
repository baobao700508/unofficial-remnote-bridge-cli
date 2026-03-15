export const ERROR_REFERENCE_CONTENT = `
# Error Reference

所有工具错误的完整参考，按类别分组。

---

## 1. 连接与会话错误

| 错误信息 | 触发命令 | 原因 | 恢复操作 |
|:---------|:---------|:-----|:---------|
| 守护进程未运行，请先执行 remnote-bridge connect | 所有业务命令 | 未执行 connect 或 daemon 已超时关闭 | 执行 \\\`connect\\\` |
| Plugin 未连接 | health / 业务命令 | RemNote 未打开或插件未加载 | 打开 RemNote 并确认插件加载 |
| SDK 未就绪 | health | 知识库尚未加载完成 | 等待几秒后重试 \\\`health\\\` |
| 连接超时 | connect | daemon 启动但 Plugin 未在超时时间内连接 | 确认 RemNote 已打开、插件已加载；检查端口配置 |

---

## 2. 防线错误（edit_rem / edit_tree 共用）

### 防线 1：缓存存在性

| 错误信息 | 触发命令 | 恢复操作 |
|:---------|:---------|:---------|
| Rem {remId} has not been read yet. Read it first before editing. | edit_rem | 执行 \\\`read_rem\\\` 同一个 remId |
| Tree rooted at {remId} has not been read yet. Use read-tree first. | edit_tree | 执行 \\\`read_tree\\\` 同一个 remId |

### 防线 2：乐观并发检测

| 错误信息 | 触发命令 | 恢复操作 |
|:---------|:---------|:---------|
| Rem {remId} has been modified since last read. Please read it again before editing. | edit_rem | 重新执行 \\\`read_rem\\\` 获取最新状态 |
| Tree rooted at {remId} has been modified since last read-tree. Please read-tree again. | edit_tree | 重新执行 \\\`read_tree\\\` 获取最新状态 |

**关键**：防线 2 失败时**不会自动更新缓存**，必须手动重新 read。

### 防线 3：str_replace 精确匹配（仅 edit_tree）

| 错误信息 | 触发命令 | 恢复操作 |
|:---------|:---------|:---------|
| old_str not found in the tree outline of {remId} | edit_tree | 检查 oldStr 是否精确匹配缓存大纲 |
| old_str matches {N} locations in the tree outline of {remId}. Make old_str more specific to match exactly once. | edit_tree | 扩大 oldStr 范围 |

---

## 3. edit_rem 专用错误

| 错误信息 | 原因 | 恢复操作 |
|:---------|:-----|:---------|
| Failed to update field 'type': Portal 不可通过 setType() 设置 | 尝试将 type 设为 portal | Portal 只能通过 SDK 专用 API 创建，不可通过 edit_rem 设置 |
| Failed to update field '{field}': ... | SDK setter 调用失败 | 检查字段值是否在允许范围内 |
| Invalid value for '{field}': ... | 字段值不符合约束 | 检查字段值类型和允许范围（参考枚举类型速查表） |
| Field '{fieldName}' is read-only and was ignored | 修改了只读字段 | **警告**（非阻断），该字段不可修改 |
| Field '{fieldName}' is unknown and was ignored | changes 中包含不存在的字段名 | **警告**（非阻断），检查字段名拼写 |
| Setting 'todoStatus' without 'isTodo: true' may have no effect | todoStatus 非 null 但 isTodo=false | 先将 isTodo 设为 true |

---

## 4. edit_tree 专用错误

| 错误信息 | 错误类型 | 原因 | 恢复操作 |
|:---------|:---------|:-----|:---------|
| Content modification of existing Rem is not allowed in tree edit mode. | \\\`content_modified\\\` | 修改了已有行的文字内容 | 使用 \\\`edit_rem\\\` 修改内容 |
| Root node cannot be changed, deleted or moved. | \\\`root_modified\\\` | 尝试修改/删除/移动根节点 | 根节点不可操作 |
| Cannot delete {id} because it has {N} hidden children. | \\\`folded_delete\\\` | 删除了有折叠（未展开）子节点的行 | 用更大的 depth 重新 \\\`read_tree\\\` |
| Cannot delete {id} because it has children that were not removed. | \\\`orphan_detected\\\` | 删除了父行但保留了子行 | 必须同时删除所有子行 |
| Cannot delete or modify elided region directly. | \\\`elided_modified\\\` | 删除或修改了省略占位符 | 用更大的 depth/maxSiblings 重新 \\\`read_tree\\\` 展开 |
| 缩进跳级：行 ... 的缩进级别为 N，但找不到上一级的父节点。 | \\\`indent_skip\\\` | 新增行的缩进不正确 | 检查缩进（每级 2 空格） |
| New line "..." accidentally captured existing children (...). Insert the new line after the last child, not between a parent Rem and its children. | \\\`children_captured\\\` | 新增行插在了一个有子节点的 Rem 和它的 children 之间，劫持了已有子节点 | 把新行插到目标层级所有兄弟的**末尾**，不要插在父 Rem 紧后面 |

---

## 5. 读取错误

| 错误信息 | 触发命令 | 原因 | 恢复操作 |
|:---------|:---------|:-----|:---------|
| Rem not found: {remId} | read_rem / read_tree | remId 无效或 Rem 已被删除 | 使用 \\\`search\\\` 重新定位 |
| 指定的 Rem 不存在: {remId} | read_context (focus + focusRemId) | focusRemId 无效或 Rem 已被删除 | 使用 \\\`search\\\` 重新定位 |
| focusRemId 仅在 focus 模式下有效 | read_context (page + focusRemId) | page 模式下不应传 focusRemId | 去掉 focusRemId 参数，或改用 focus 模式 |
| 无法获取当前聚焦的 Rem | read_context (focus) | 用户未在 RemNote 中点击任何 Rem（且未指定 focusRemId） | 提醒用户在 RemNote 中点击一个 Rem，或传入 focusRemId |
| 无法获取当前页面 | read_context (page) | RemNote 未打开文档页面 | 提醒用户打开一个文档页面 |

---

## 6. 搜索错误

| 错误信息 | 触发命令 | 原因 | 恢复操作 |
|:---------|:---------|:-----|:---------|
| 搜索无结果 | search | 关键词未匹配任何 Rem | 中文搜索尝试单字策略；或改用 \\\`read_globe\\\` → \\\`read_tree\\\` 手动定位 |

---

## 错误诊断决策树

\\\`\\\`\\\`
命令失败
├─ "守护进程未运行"
│   └─ 执行 connect
│
├─ "Plugin 未连接" / "SDK 未就绪"
│   └─ 确认 RemNote 已打开 → health 检查
│
├─ "has not been read yet"
│   └─ 执行对应 read 命令（read_rem / read_tree）
│
├─ "has been modified since last read"
│   └─ 重新执行 read → 然后重试 edit
│
├─ "old_str not found"（edit_tree）
│   ├─ 检查空格、换行是否精确匹配
│   └─ 重新 read_tree 确认当前内容
│
├─ "old_str matches N locations"（edit_tree）
│   └─ 扩大 oldStr，包含更多上下文
│
├─ "Invalid value for" / "Field ... is unknown"（edit_rem）
│   └─ 检查字段名拼写和值类型
│
├─ "Content modification not allowed"
│   └─ 改用 edit_rem 修改内容
│
├─ "children_captured"
│   └─ 把新行插到所有兄弟末尾，不要插在父 Rem 和 children 之间
│
├─ "orphan_detected"
│   └─ 同时删除父行的所有子行
│
├─ "folded_delete"
│   └─ 用更大 depth 重新 read_tree
│
├─ "Rem not found"
│   └─ 使用 search 重新定位目标 Rem
│
└─ 其他
    └─ 执行 health 检查系统状态
\\\`\\\`\\\`
`;

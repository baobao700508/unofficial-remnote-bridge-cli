export const SERVER_INSTRUCTIONS = `
# RemNote Bridge MCP Server — Agent 操作手册

RemNote 知识库操作工具集。你可以通过这些工具读取、搜索、编辑用户的 RemNote 笔记和知识结构。不能操控闪卡（Card/Flashcard）本身——闪卡由 RemNote 根据 Rem 属性自动生成；也不能管理 Plugin 或系统配置。

---

## 1. Core Concepts

### Everything is Rem

用户说的"笔记"、"文档"、"文件夹"、"闪卡"，底层都是 **Rem**。不同形态通过属性区分：

| 用户说的 | 实际上是 | 区分方式 |
|:---------|:---------|:---------|
| 笔记 / 条目 | Rem | 最基本的数据单元 |
| 文档 / 页面 | Rem（\\\`isDocument=true\\\`） | 可独立打开的页面 |
| 文件夹 | Rem（Document + 子节点全是 Document） | UI 概念，无独立标记 |
| 闪卡 | Card——由 Rem 属性自动生成 | **不可直接操控** |

### Type 系统

Rem 有两个独立维度：**type**（闪卡语义）和 **isDocument**（页面语义），二者互不影响。

| type | 含义 | UI 表现 |
|:-----|:-----|:--------|
| \\\`concept\\\` | 概念定义 | 文字**加粗** |
| \\\`descriptor\\\` | 描述/属性 | 文字*斜体* |
| \\\`default\\\` | 普通 Rem | 正常字重 |
| \\\`portal\\\` | 嵌入引用容器 | 紫色边框（**只读**，不可设置） |

### Separator 与闪卡创建

分隔符决定 Rem 的 type、backText 和练习方向。创建闪卡的本质是设置正确的分隔符：

| 分隔符 | type | 用途 |
|:-------|:-----|:-----|
| \\\`::\\\` | concept | 概念定义（双向） |
| \\\`;;\\\` | descriptor | 描述属性（正向） |
| \\\`>>\\\` | default | 正向问答 |
| \\\`<<\\\` | default | 反向问答 |
| \\\`<>\\\` | default | 双向问答 |
| \\\`>>>\\\` | default | 多行答案（子 Rem 为答案） |
| \\\`{{}}\\\` | default | 完形填空 |

完整分隔符-闪卡映射表见 \\\`resource://separator-flashcard\\\`。

### 链接机制

| 机制 | 用户操作 | 说明 |
|:-----|:---------|:-----|
| Reference \\\`[[\\\` | 文本内引用 | 只是指针，不同步编辑 |
| Tag \\\`##\\\` | 附加标签 | 分类标记 |
| Portal \\\`((\\\` | 嵌入实时视图 | 编辑同步，大纲中标为 \\\`type:portal\\\` |

### Powerup 过滤

RemNote 的格式设置（标题、高亮、代码等）会注入隐藏的系统 Tag 和子 Rem。这些噪音数据**默认自动过滤**，你通常无需关心。

---

## 2. Session Lifecycle

所有操作都依赖一个活跃的会话。会话 = 守护进程的生命周期。

\\\`\\\`\\\`
connect → 启动 daemon（幂等，重复调用安全）
  ↓
health → 确认三层就绪（daemon / Plugin / SDK）
  ↓
业务操作（read / search / edit）
  ↓
disconnect → 关闭 daemon，清空所有缓存
\\\`\\\`\\\`

**关键要点**：
- \\\`connect\\\` 是所有业务操作的前提，未 connect 时任何命令都会报"守护进程未运行"
- \\\`health\\\` 检查三层状态：daemon 运行 → Plugin 已连接 → SDK 就绪，三者全部通过才能执行业务命令
- \\\`disconnect\\\` 会销毁所有缓存，之前的 read 结果全部失效
- daemon 默认 30 分钟无活动自动关闭

---

## 3. Common Scenarios

### 场景 A：探索知识库

> 用户说："帮我看看知识库里有什么"、"有哪些文档"

使用 \\\`read_globe\\\`。它返回知识库中所有 Document 的层级结构鸟瞰图，非 Document 内容不展开。这是了解知识库整体组织的起点。拿到感兴趣的 remId 后，可以用 \\\`read_tree\\\` 深入。

### 场景 B：搜索并深入

> 用户说："搜一下关于 X 的笔记"、"找找 X 在哪里"

先用 \\\`search\\\` 搜索关键词，获得匹配的 Rem 列表（含 remId）。然后根据需要：
- 用 \\\`read_rem\\\` 查看某条结果的详细属性
- 用 \\\`read_tree\\\` 展开某条结果的子树结构

**注意**：中文等无空格语言搜索效果较差。如果完整词搜索无结果，尝试用单个最具区分度的字搜索；如果仍然无果，改用 \\\`read_globe\\\` → \\\`read_tree\\\` 手动定位。

### 场景 C：了解当前上下文

> 用户说："我现在在看什么"、"当前页面是什么"

使用 \\\`read_context\\\`：
- **focus 模式**（默认）：以用户当前光标所在的 Rem 为中心，构建鱼眼视图——焦点处完全展开，周围递减。焦点行以 \\\`* \\\` 前缀标记。需要用户在 RemNote 中已点击某个 Rem。
- **page 模式**：以当前打开的页面为根，均匀展开子树。

两种模式都会返回面包屑路径，帮助你理解当前位置在知识库中的层级。

### 场景 D：修改文本或属性

> 用户说："把这个标题改成..."、"把类型改成概念"、"加个高亮"

工作流程：**必须先 read 再 edit**。

1. \\\`read_rem\\\` 获取目标 Rem 的 JSON 属性（建立缓存）
2. 在返回的 JSON 文本中定位要修改的部分
3. \\\`edit_rem\\\` 用 str_replace 替换：oldStr 精确匹配原文，newStr 是修改后的文本

str_replace 操作的是格式化 JSON 文本（2 空格缩进）。oldStr 要包含足够上下文（如字段名 + 值），避免模糊匹配。替换后必须是合法 JSON。

### 场景 E：修改结构（新增/删除/移动/重排）

> 用户说："在这下面加几个子项"、"删掉这个"、"把这个移到那下面"

工作流程：**必须先 read_tree 再 edit_tree**。

1. \\\`read_tree\\\` 获取目标区域的 Markdown 大纲（建立缓存）
2. 在大纲中用 str_replace 进行结构修改：
   - **新增**：插入无 remId 注释的新行（通过缩进确定父子关系）
   - **删除**：移除带 remId 的行（必须同时删除所有子行）
   - **移动**：改变行的缩进级别或位置
   - **重排**：调换同级行的顺序

**红线**：edit_tree **禁止修改已有行的文字内容**——改内容必须用 edit_rem。edit_tree 只做结构操作。

### 场景 F：创建闪卡

> 用户说："创建一个概念定义"、"做个正向问答卡"

创建闪卡的本质是创建带正确分隔符的 Rem。通过 \\\`edit_tree\\\` 新增行时使用箭头分隔符：

- 概念定义：\\\`新概念 → 定义内容\\\`（然后用 edit_rem 将 type 改为 concept）
- 正向问答：\\\`问题 → 答案\\\`
- 多行答案：\\\`问题 ↓\\\`（子行自动成为答案）
- 双向问答：\\\`问题 ↔ 答案\\\`

如果要修改现有 Rem 的闪卡行为（改分隔符类型），使用 \\\`read_rem\\\` → \\\`edit_rem\\\` 修改 type、backText、practiceDirection 等字段。

### 场景 G：排查连接问题

> 用户说："连不上"、"命令报错了"

使用 \\\`health\\\` 检查三层状态，然后对症处理：
- daemon 未运行 → 执行 \\\`connect\\\`
- Plugin 未连接 → 提醒用户打开 RemNote 并确认插件已加载
- SDK 未就绪 → 等待几秒后重试 health

---

## 4. Safety Rules

### 黄金法则：先 read 再 edit

- \\\`edit_rem\\\` 前必须先 \\\`read_rem\\\` 同一个 remId
- \\\`edit_tree\\\` 前必须先 \\\`read_tree\\\` 同一个 remId

跳过 read 直接 edit 会被拒绝。这不是建议，是硬性要求。

### 三道防线

每次 edit 操作都经过三重安全检查：
1. **缓存存在**：必须有对应的 read 缓存
2. **并发检测**：edit 时重新读取最新数据，与缓存比较。如果 Rem 在 read 之后被外部修改，拒绝编辑——你必须重新 read
3. **精确匹配**：oldStr 必须在目标文本中恰好匹配 1 次

### edit_tree 禁止事项

- 禁止修改已有行的文字内容（改内容用 edit_rem）
- 禁止删除根节点
- 禁止删除有隐藏子节点的行（先用更大 depth 重新 read_tree）
- 禁止删除父行但保留子行（必须一起删）
- 禁止修改或删除省略占位符（先用更大参数重新 read_tree 展开）

详细规则见各工具的 description。

---

## 5. Output Format Quick Reference

\\\`read_tree\\\`、\\\`read_globe\\\`、\\\`read_context\\\` 返回 Markdown 大纲格式。

### 行结构

\\\`\\\`\\\`
{缩进}{Markdown 前缀}{内容}{箭头}{backText} <!-- {remId} {标记} -->
\\\`\\\`\\\`

- 缩进：每级 2 空格
- Markdown 前缀：\\\`# \\\`(H1)、\\\`## \\\`(H2)、\\\`### \\\`(H3)、\\\`- [ ] \\\`(待办)、\\\`- [x] \\\`(已完成)、\\\`\\\\\\\`\\\`(代码)

### 关键元数据标记

| 标记 | 含义 |
|:-----|:-----|
| \\\`type:concept\\\` / \\\`type:descriptor\\\` / \\\`type:portal\\\` | Rem 类型（default 不标记） |
| \\\`doc\\\` | 是文档页面 |
| \\\`children:N\\\` | 有 N 个未展开的子节点 |
| \\\`tag:Name(id)\\\` | 已附加的标签 |
| \\\`role:card-item\\\` | 多行闪卡的答案行 |
| \\\`top\\\` | 知识库顶层 Rem |

### 箭头含义

- **单行箭头** \\\`→\\\` \\\`←\\\` \\\`↔\\\`：text 与 backText 之间的分隔，方向为 practiceDirection
- **多行箭头** \\\`↓\\\` \\\`↑\\\` \\\`↕\\\`：表示子节点为答案的多行闪卡

### 省略占位符

\\\`\\\`\\\`
<!--...elided 3 siblings (parent:remIdB range:2-4 total:5)-->
<!--...elided >=10 nodes (parent:remIdB range:5-14 total:20)-->
\\\`\\\`\\\`

\\\`siblings\\\` 为精确省略（超 maxSiblings），\\\`>=N nodes\\\` 为预算耗尽的非精确省略。

详细格式规范见 \\\`resource://outline-format\\\`。

---

## 6. Error Quick Reference

| 错误信息 | 原因 | 恢复操作 |
|:---------|:-----|:---------|
| 守护进程未运行 | 未 connect 或 daemon 已超时 | 执行 \\\`connect\\\` |
| Plugin 未连接 | RemNote 未打开或插件未加载 | 提醒用户打开 RemNote |
| has not been read yet | 未先执行 read | 先 read 同一个 remId，再重试 edit |
| has been modified since last read | Rem 在 read 后被外部修改 | 重新 read 获取最新状态，再重试 |
| old_str not found | oldStr 在文本中不存在 | 检查是否精确匹配（含引号、空格、换行） |
| old_str matches N locations | oldStr 匹配多处 | 扩大 oldStr 范围，包含更多上下文以唯一定位 |
| invalid JSON | edit_rem 替换后不是合法 JSON | 检查 newStr 的引号、逗号、括号 |
| Content modification not allowed | edit_tree 中修改了行内容 | 改用 \\\`edit_rem\\\` 修改内容 |
| orphan_detected | 删了父行但保留了子行 | 同时删除所有子行 |
| folded_delete | 删除有隐藏子节点的行 | 用更大 depth 重新 read_tree |

完整错误参考见 \\\`resource://error-reference\\\`。
`;

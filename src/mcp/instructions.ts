export const SERVER_INSTRUCTIONS = `
# RemNote Bridge MCP Server — Agent 操作手册

RemNote 知识库操作工具集。你可以通过这些工具读取、搜索、编辑用户的 RemNote 笔记和知识结构。不能操控闪卡（Card/Flashcard）本身——闪卡由 RemNote 根据 Rem 属性自动生成；也不能管理 Plugin 或系统配置。

> **架构备注**：本 MCP Server 是 \\\`remnote-bridge\\\` CLI 的包装层，每个工具调用在底层都会转化为一次 CLI 子进程调用（\\\`--json\\\` 模式）。因此工具的参数、返回值、错误信息与 CLI 完全一致。如果你在错误消息中看到"守护进程"、"daemon"等字样，指的就是 CLI 的后台守护进程。

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
| \\\`descriptor\\\` | 描述/属性 | 正常字重（与 default 无视觉差异） |
| \\\`default\\\` | 普通 Rem | 正常字重 |
| \\\`portal\\\` | 嵌入引用容器 | 紫色边框（**只读**，不可设置） |

### 闪卡的操作方式

闪卡由 Rem 的 \\\`type\\\`、\\\`backText\\\`、\\\`practiceDirection\\\` 三个字段控制。创建/修改闪卡，操作的是这些**字段**，而非分隔符。

**禁止**：在文本中插入分隔符（\\\`::\\\`、\\\`;;\\\`、\\\`>>\\\` 等）来创建闪卡。分隔符是 RemNote 编辑器的输入语法，工具端无法识别。

| 闪卡操作 | 方法 |
|:---------|:---------|
| 创建概念定义 | \\\`edit_tree\\\` 新增行 \\\`概念 ↔ 定义\\\`，再 \\\`edit_rem\\\` 设 \\\`type: "concept"\\\` |
| 创建正向问答 | \\\`edit_tree\\\` 新增行 \\\`问题 → 答案\\\` |
| 创建多行答案 | \\\`edit_tree\\\` 新增行 \\\`问题 ↓\\\`（子行自动成为答案） |
| 改变闪卡类型 | \\\`edit_rem\\\` 修改 \\\`type\\\`、\\\`backText\\\`、\\\`practiceDirection\\\` |

### 理解用户意图：分隔符映射

用户在 RemNote 编辑器中通过分隔符创建闪卡。当用户提到这些分隔符时，你需要理解其意图并映射到对应的工具操作：

| 用户说 / 编辑器分隔符 | 对应的 type | 对应的 practiceDirection |
|:----------------------|:-----------|:-----------------------|
| \\\`::\\\` | concept | both |
| \\\`;;\\\` | descriptor | forward |
| \\\`>>\\\` / \\\`<<\\\` / \\\`<>\\\` | default | forward / backward / both |
| \\\`>>>\\\` / \\\`::>\\\` / \\\`;;>\\\` | default / concept / descriptor | forward / both / forward（多行） |

完整映射表见 \\\`resource://separator-flashcard\\\`。

### 链接机制

| 机制 | 用户操作 | 说明 |
|:-----|:---------|:-----|
| Reference \\\`[[\\\` | 文本内引用 | 只是指针，不同步编辑 |
| Tag \\\`##\\\` | 附加标签 | 分类标记 |
| Portal \\\`((\\\` | 嵌入实时视图 | 编辑同步，大纲中标为 \\\`type:portal\\\` |

### Portal 操作速查

| 操作 | 命令 | 方式 |
|:-----|:-----|:-----|
| 创建 Portal | \\\`edit_tree\\\` | 新增行 \\\`<!--portal refs:id1,id2-->\\\` |
| 删除 Portal | \\\`edit_tree\\\` | 从大纲中移除 Portal 行（与删除普通行相同） |
| 修改引用列表（增删引用的 Rem） | \\\`edit_rem\\\` | str_replace 简化 JSON 中的 \\\`portalDirectlyIncludedRem\\\` 数组 |
| 移动 Portal（换父节点/位置） | \\\`edit_tree\\\` | 与移动普通行相同 |
| 读取 Portal | \\\`read_rem\\\` | 自动输出 9 字段简化 JSON |

### Powerup 过滤

RemNote 的格式设置（标题、高亮、代码等）会注入隐藏的系统 Tag 和子 Rem。这些噪音数据**默认自动过滤**，你通常无需关心。

---

## 2. Session Lifecycle

所有操作都依赖一个活跃的会话。会话 = 守护进程的生命周期。

### 标准模式（需要用户配合）

\\\`\\\`\\\`
connect → 启动 daemon（幂等，重复调用安全）
  ↓
⚠️ 用户操作：确保 RemNote 中已加载插件（见下方说明）
  ↓
health → 确认三层就绪（daemon / Plugin / SDK）
  ↓
业务操作（read / search / edit）
  ↓
disconnect → 关闭 daemon，清空所有缓存
\\\`\\\`\\\`

### Headless 模式（自动连接）

标准模式每次 connect 后都需要用户手动操作 RemNote。Headless 模式通过 setup（一次性）+ headless Chrome 实现自动连接，后续 connect 无需用户介入。

**⚠️ 模式选择建议**：日常使用推荐**标准模式**。Headless 模式下 Chrome 在后台运行，**无法感知用户正在 RemNote 中浏览和操作的界面**（\\\`read_context\\\` 返回的是 headless Chrome 的上下文，而非用户的浏览器）。只有在全自动化场景（CI/CD、定时任务、批量操作等无需与用户界面交互的场景）才建议使用 Headless 模式。

#### 首次使用（setup）

\\\`setup\\\` 会弹出 Chrome 窗口，用户需要完成两件事：
1. **登录 RemNote**
2. **配置 dev plugin**：插件图标 → 开发你的插件 → 填入 \\\`http://localhost:8080\\\`

完成后**彻底退出 Chrome**（macOS 必须 Cmd+Q，仅关窗口不够）。

**你必须这样与用户交互**：
1. 调用 \\\`setup\\\`
2. 立即告知用户：
   "已打开 Chrome 浏览器。请完成以下操作：
    1. 登录 RemNote
    2. 在 RemNote 中配置开发插件：点击左下角插件图标 → 开发你的插件 → 输入 http://localhost:8080
    3. 完成后彻底退出 Chrome（macOS 请按 Cmd+Q）"
3. 等待 \\\`setup\\\` 返回（阻塞，最长 10 分钟）
4. 成功 → 进入下一步 \\\`connect(headless=true)\\\`

setup 只需执行一次。之后每次连接直接用 \\\`connect(headless=true)\\\`。

#### 后续使用

\\\`\\\`\\\`
connect(headless=true) → 启动 daemon + headless Chrome 自动加载 RemNote 和 Plugin
  ↓
health → 等待三层就绪（Plugin 需要 10-30 秒连接，可多次轮询）
  ↓
业务操作（read / search / edit）
  ↓
disconnect → 关闭 daemon + headless Chrome，清空所有缓存
\\\`\\\`\\\`

**无需任何用户操作**——headless Chrome 在后台自动完成登录和 Plugin 加载。

#### 排查

- \\\`health(diagnose=true)\\\`：截图 + Chrome 状态 + console 错误（确认页面是否正常加载）
- \\\`health(reload=true)\\\`：重载 headless Chrome 页面（Plugin 未连接时尝试）
- 如果 Plugin 始终不连接，可能是 RemNote 登录 session 过期，需重新 setup

**关键要点**：
- \\\`connect\\\` 是所有业务操作的前提，未 connect 时任何命令都会报"守护进程未运行"
- \\\`health\\\` 检查三层状态：daemon 运行 → Plugin 已连接 → SDK 就绪，三者全部通过才能执行业务命令
- \\\`disconnect\\\` 会销毁所有缓存，之前的 read 结果全部失效
- daemon 默认 30 分钟无活动自动关闭

### Windows 注意事项

- **默认模式秒级启动**：使用预构建 plugin，无需安装依赖
- **\`--dev\` 模式首次较慢**：会自动安装 remnote-plugin 的依赖（约 600+ 个包），在 Windows 上可能需要 30-60 秒，connect 超时设为 60 秒
- **\`--dev\` 依赖自动修复**：如果 webpack-dev-server 因依赖损坏而崩溃，daemon 会自动清洁重装依赖（删除 node_modules 后重新安装）并重试，最多重试 2 次
- **端口残留**：多次 connect 失败后可能出现端口被占用（EADDRINUSE），用 \\\`remnote-bridge disconnect\\\` 或手动终止占用端口的进程后重试

### ⚠️ 标准模式：connect 后需要用户配合（重要）

\\\`connect\\\`（不传 headless）成功只意味着 daemon 和 Plugin 服务已启动，**Plugin 并未自动连接**。用户必须在 RemNote 中完成以下操作，Plugin 才能连接到 daemon：

**首次使用**（RemNote 从未加载过此插件）：
1. 打开 RemNote 桌面端或网页端
2. 点击左侧边栏底部的插件图标（拼图形状）
3. 点击「开发你的插件」（Develop Your Plugin）
4. 在输入框中填入 \\\`http://localhost:8080\\\`（即 connect 输出的 Plugin 服务地址）
5. 等待插件加载完成

**非首次使用**（之前已加载过此插件）：
- 只需**刷新 RemNote 页面**即可（浏览器 F5 或 Cmd+R），插件会自动重新连接

**你必须这样做**：
1. 执行 \\\`connect\\\` 后，**立即告知用户需要完成上述操作**
2. **不要在 connect 后直接调用业务命令**——此时 Plugin 尚未连接，命令会失败
3. 引导用户完成操作后，用 \\\`health\\\` 确认三层就绪，再执行业务命令

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

### 场景 C：了解当前上下文（⚠️ 高优先级）

> 用户说："我现在在看什么"、"当前页面是什么"

**重要：用户正在看的页面对你来说是不可见的。** 用户在跟你沟通时，往往默认你也能看到他正在浏览的 RemNote 页面，但实际上你们的信息是不对等的。当你发现以下情况时，**必须主动调用 \\\`read_context\\\` 来对齐信息**：
- 用户提到了你没有上下文的内容（如"这个"、"当前页面"、"这里"）
- 用户的描述与你已知的信息对不上
- 你搜索不到用户提到的某些内容
- 用户似乎在引用他正在查看的界面

先用 \\\`read_context\\\` 看到用户所看到的，再做决策，沟通才能顺畅。

使用 \\\`read_context\\\`：
- **focus 模式**（默认）：以用户当前光标所在的 Rem 为中心，构建鱼眼视图——焦点处完全展开，周围递减。焦点行以 \\\`* \\\` 前缀标记。需要用户在 RemNote 中已点击某个 Rem。可通过 \\\`focusRemId\\\` 指定任意 Rem 作为鱼眼中心，此时不依赖用户焦点。
- **page 模式**：以当前打开的页面为根，均匀展开子树。

两种模式都会返回面包屑路径，帮助你理解当前位置在知识库中的层级。

### 场景 D：修改文本或属性

> 用户说："把这个标题改成..."、"把类型改成概念"、"加个高亮"

工作流程：**必须先 read 再 edit**。

1. \\\`read_rem\\\` 获取目标 Rem 的 JSON 属性（建立缓存）
2. 在返回的 JSON 文本中定位要修改的部分
3. \\\`edit_rem\\\` 用 str_replace 替换：oldStr 精确匹配原文，newStr 是修改后的文本

str_replace 操作的是 \\\`JSON.stringify(remObject, null, 2)\\\` 格式化文本。oldStr 要包含足够上下文（如字段名 + 值），避免模糊匹配。替换后必须是合法 JSON。

**RichText 编辑要点**（\\\`text\\\` 和 \\\`backText\\\` 字段）：

RichText 在格式化 JSON 中是多行结构，对象内 key 按**字母序**排列（\\\`_id\\\` 排最前，因为 \\\`_\\\` < \\\`a\\\`）。

示例——将纯文本改为粗体：

\\\`\\\`\\\`
oldStr:  "text": [\\n    "普通标题"\\n  ]
newStr:  "text": [\\n    {\\n      "b": true,\\n      "i": "m",\\n      "text": "粗体标题"\\n    }\\n  ]
\\\`\\\`\\\`

示例——给文本加超链接：

\\\`\\\`\\\`
oldStr:  "text": [\\n    "点击访问官网"\\n  ]
newStr:  "text": [\\n    "点击",\\n    {\\n      "i": "m",\\n      "iUrl": "https://remnote.com",\\n      "text": "访问官网"\\n    }\\n  ]
\\\`\\\`\\\`

注意：\\\`highlightColor\\\`（Rem 顶层字段，字符串如 \\\`"Red"\\\`）和 RichText 的 \\\`h\\\`（行内格式标记，数字 0-9）是两个独立属性。详见 \\\`resource://rem-object-fields\\\`。

### 缓存行为速查

| 工具 | 缓存行为 | 用途 |
|:-----|:---------|:-----|
| \\\`read_rem\\\` | 写入缓存 | 供 \\\`edit_rem\\\` 使用 |
| \\\`read_tree\\\` | 写入缓存 | 供 \\\`edit_tree\\\` 使用 |
| \\\`search\\\` / \\\`read_globe\\\` / \\\`read_context\\\` | **不缓存** | 不能作为 edit 前置 |

### 场景 E：修改结构（新增/删除/移动/重排）

> 用户说："在这下面加几个子项"、"删掉这个"、"把这个移到那下面"

工作流程：**必须先 read_tree 再 edit_tree**。

1. \\\`read_tree\\\` 获取目标区域的 Markdown 大纲（建立缓存）
2. 在大纲中用 str_replace 进行结构修改：
   - **新增**：插入无 remId 注释的新行（通过缩进确定父子关系）。可在行尾加元数据注释指定属性：\\\`新行 <!--type:concept doc tag:Name(id)-->\\\`
   - **删除**：移除带 remId 的行（必须同时删除所有子行）
   - **移动**：改变行的缩进级别或位置
   - **重排**：调换同级行的顺序

**红线**：edit_tree **禁止修改已有行的文字内容**——改内容必须用 edit_rem。edit_tree 只做结构操作。

**⚠️ 新增行的插入位置**：新行必须插在目标层级所有兄弟的**末尾**，不能插在一个有子节点的 Rem 和它的 children 之间。否则 children 会被新行"劫持"，触发 \\\`children_captured\\\` 错误。

\\\`\\\`\\\`
❌ 错误：插在父 Rem 和 children 之间
oldStr:   水分子 ↓ <!--idA-->
newStr:   水分子 ↓ <!--idA-->
          新行                    ← children 会变成新行的子节点！

✅ 正确：插在末尾
oldStr:   最后一个兄弟 <!--idZ-->
newStr:   最后一个兄弟 <!--idZ-->
          新行
\\\`\\\`\\\`

**需要"创建新节点并把已有 children 移过去"？** 分两步：
1. 第一次 \\\`edit_tree\\\`：在末尾创建新节点（获得 remId）
2. 第二次 \\\`edit_tree\\\`：把已有行移动到新节点下面（此时新节点已有 remId，走正常 move 逻辑）

### 场景 F：创建 / 修改闪卡

> 用户说："创建一个概念定义"、"做个正向问答卡"、"把这个改成 concept"

闪卡由 \\\`type\\\`、\\\`backText\\\`、\\\`practiceDirection\\\` 三个字段控制。操作方式：

**创建新闪卡**（\\\`edit_tree\\\` 新增行 + 箭头 + 可选元数据注释）：
- 正向问答：\\\`问题 → 答案\\\`
- 双向问答：\\\`问题 ↔ 答案\\\`
- 多行答案：\\\`问题 ↓\\\`（子行自动成为答案）
- 概念定义：\\\`概念 ↔ 定义 <!--type:concept-->\\\`（一步完成，无需再 edit_rem）
- 描述属性：\\\`属性 → 值 <!--type:descriptor-->\\\`

**修改现有 Rem 的闪卡行为**（\\\`read_rem\\\` → \\\`edit_rem\\\`）：
- 改类型：修改 \\\`type\\\` 字段（\\\`"default"\\\` → \\\`"concept"\\\`）
- 改方向：修改 \\\`practiceDirection\\\`（\\\`"forward"\\\` / \\\`"backward"\\\` / \\\`"both"\\\` / \\\`"none"\\\`）
- 加/改背面：修改 \\\`backText\\\` 字段

**禁止**：在文本内容中插入 \\\`::\\\`、\\\`;;\\\`、\\\`>>\\\` 等分隔符——这些是 RemNote 编辑器语法，工具端不识别。

### 场景 G：排查连接问题

> 用户说："连不上"、"命令报错了"

使用 \\\`health\\\` 检查三层状态，然后对症处理：
- daemon 未运行 → 执行 \\\`connect\\\`，然后引导用户在 RemNote 中加载插件
- Plugin 未连接 → 提醒用户：首次使用需在 RemNote 的「开发你的插件」中填入 \\\`http://localhost:8080\\\`；非首次使用只需刷新 RemNote 页面
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
| children_captured | 新行插在父 Rem 和它的 children 之间，劫持了已有子节点 | 把新行插到所有兄弟的**末尾**而非紧跟父 Rem 之后（见下方说明） |

完整错误参考见 \\\`resource://error-reference\\\`。
`;

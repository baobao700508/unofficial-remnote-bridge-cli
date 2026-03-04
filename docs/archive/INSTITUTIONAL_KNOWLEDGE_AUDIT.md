# 项目机构知识体系审计报告

> 审计日期：2026-03-03
> 审计范围：remnote-bridge-cli 项目的设计决策、实现约束、踩坑经验

---

## 执行总结

本项目**不存在** `docs/solutions/` 目录结构。现有的知识资产采用**需求文档 + 设计决策文档** 的模式组织。

### 现有知识资产清单

| 类别 | 文件位置 | 内容概要 |
|------|---------|--------|
| **核心约束红线** | `.claude/CLAUDE.md` | Flashcard 禁操规则（1 条重要约束）|
| **架构指导** | `AGENTS.md` | 四层分工、依赖方向、约束与经验 |
| **初始需求** | `docs/初始需求/` | 单 Rem 和多 Rem 读写规范（完整） |
| **设计决策** | `docs/plans/` / `docs/brainstorms/` | connect/health/disconnect 命令设计 |
| **数据映射** | `docs/rem-object-field-mapping.md` | RemNote SDK 字段到数据库的映射（深度分析） |

---

## 一、核心约束总览

### 1.1 Flashcard 红线（CLAUDE.md）

**现状**：本项目目前**禁止操控 Flashcard / Card**。

**理由**：
- Card 由 RemNote 根据 Rem 对象的属性（text、backText、RichText 内部标记、children 关系）自动生成
- RemNote 内部决定卡片生成规则，SDK 不暴露卡片修改 API
- RemObject 定义中**不包含任何闪卡/Card 字段**

**应用场景**：
- ✅ 允许：修改 text、backText、RichText 标记（卡片会自动重新生成）
- ❌ 禁止：直接调用 `rem.getCards()`、`CardNamespace`、任何Card-related API

---

### 1.2 层边界与依赖方向（AGENTS.md 2.1）

#### 职责划分

| 层 | 职责 | 禁止事项 |
|:--|:--|:--|
| **remnote-plugin** | 通过 RemNote SDK 与知识库交互，暴露 WebSocket API | 禁止包含 CLI 逻辑或 MCP 协议代码 |
| **remnote-cli** | 封装 RemNote 操作为统一命令接口 | 禁止直接调用 RemNote SDK（必须通过 plugin） |
| **remnote-skills** | 定义 Agent 可调用的技能（Markdown） | 禁止包含运行时代码逻辑 |
| **remnote-mcp** | 通过 MCP 协议暴露操作为标准工具 | 禁止绕过 CLI 直连 plugin |

#### 依赖方向（严格单向）

```
接入层（skills + mcp）
    ↓
命令层（cli）
    ↓
桥接层（plugin）
    ↓
RemNote SDK

禁止：任何反向依赖或同级依赖
```

#### Plugin 内部分层

```
核心链（业务数据流）：bridge → services → utils
  └─ bridge 依赖 services ✓
  └─ services 依赖 utils ✓
  └─ utils 无依赖 ✓
  └─ 禁止反向：utils → services、services → bridge

宿主层（独立）：widgets（插件入口 + 状态展示）
  └─ widgets 可依赖 bridge（接线和读状态）✓
  └─ 禁止：bridge/services/utils 依赖 widgets ✗
```

**检查工具**：`npm run lint:deps` 或 `node scripts/check-layer-deps.js`

---

### 1.3 CLI 命令输出规范（AGENTS.md 2.3）

**所有 CLI 命令必须同时支持两种输出模式：**

1. **人类可读输出**（默认）
2. **`--json` 结构化输出**（必须）

#### JSON 输出约定

```json
// 成功
{ "ok": true, "command": "<cmd>", ...字段 }

// 失败
{ "ok": false, "command": "<cmd>", "error": "<msg>", ...上下文 }
```

#### 命令函数签名

```typescript
export interface XxxOptions {
  json?: boolean;
}
export async function xxxCommand(options: XxxOptions = {}): Promise<void> { ... }
```

**检查方式**：新增命令时务必实现 `--json` 模式，否则 Agent（Skills/MCP）无法可靠解析输出。

---

### 1.4 SDK 文档时效性（AGENTS.md 2.2）

**规则**：`docs/RemNote API Reference/INDEX.md` 头部记录爬取时间。若距上次爬取超过 **7 天**，必须先更新。

**更新命令**：
```bash
./scripts/crawl-remnote-docs.sh
```

**当前状态**：爬取时间 20260302_170143（151 个文档文件）

---

## 二、设计决策已正式化的功能

### 2.1 Connect/Health/Disconnect 命令（已完成）

**文档**：
- 原始构想：`docs/brainstorms/2026-03-02-cli-health-connect-brainstorm.md`
- 正式规范：`docs/plans/2026-03-02-feat-cli-health-connect-commands-plan.md`

**核心决策**：

| 决策 | 选择 | 理由 |
|:--|:--|:--|
| CLI ↔ Plugin 通信 | WebSocket | 与参考项目一致，双向实时通信 |
| 连接方向 | CLI 是 WS Server，Plugin 是 Client | 避免 Plugin 需要 native 权限 |
| 守护进程架构 | 单进程（方案 A） | 最简单，先跑起来 |
| 运行模式 | 后台守护 + 自动超时关闭 | 平衡易用性和资源管理 |
| 超时时长 | 30 分钟无交互自动关闭 | 避免占用资源 |
| 配置文件 | JSON（`.remnote-bridge.json`） | Node.js 原生支持 |

---

### 2.2 单 Rem 读写规范（设计完成，实现待进行）

**文档**：`docs/初始需求/remnote-cli-single-rem-spec.md`

#### 命令签名

```bash
remnote-cli read-rem <remId> [--fields text,tags,type] [--full] [--json]
remnote-cli edit-rem <remId> --old-str <old_str> --new-str <new_str> [--json]
```

#### RemObject 字段分类（51 个字段）

| 分类 | 数量 | 说明 |
|------|------|------|
| **[RW]** | 21 | 可读可写，默认输出 |
| **[R]** | 13 | 只读，默认输出 |
| **[R-F]** | 17 | 只读，仅 `--full` 输出 |

#### 写保护三道防线

1. **第一道防线：先读后写门卫**
   - 硬性规则：目标 Rem 必须在当前会话中被 read 过（缓存存在）
   - 目的：防止 AI 凭"记忆"修改未真正查看过的 Rem

2. **第二道防线：写前变更检测**
   - 动作：执行 edit-rem 前，从 SDK 重新抓取目标 Rem，与缓存对比
   - 目的：检测外部修改，确保 AI 的 old_str 构造基于准确认知
   - **失败时缓存不更新**——迫使 AI 走 read → edit 的正确流程

3. **第三道防线：精确字符串匹配**
   - 规则：old_str 必须在缓存 JSON 中精确且唯一地匹配
   - 多次匹配时返回各匹配项的上下文，帮助 AI 区分

#### 缓存机制

- 缓存存储：守护进程内存（跨 CLI 命令调用）
- LRU 策略：上限 200 条目，超出时淘汰最久未访问
- TTL：无过期机制（防线 2 已能捕获陈旧数据）
- 缓存生命周期：`connect` 启动 → 会话开始，`disconnect` 关闭 → 会话结束

---

### 2.3 多 Rem 树模式读写规范（设计完成，实现待进行）

**文档**：`docs/初始需求/remnote-cli-tree-mode-spec.md`

#### 命令签名

```bash
remnote-cli read-tree <remId> [--depth 3] [--json]
remnote-cli edit-tree <remId> --old-str <old_str> --new-str <new_str> [--json]
```

#### 行级操作（只允许结构变更）

| 操作 | 允许 | 说明 |
|------|------|------|
| 新增行 | ✅ | 创建新 Rem（通过 parseFromMarkdown） |
| 删除行 | ✅ | 删除 Rem 及其子树 |
| 移动行 | ✅ | 改变父节点 |
| 重排行 | ✅ | 同级换顺序 |
| **修改已有行内容** | ❌ | 禁止（RichText round-trip 有损） |

#### 行格式

```
{缩进}{Markdown 内容} <!--{remId} {元数据}-->
```

元数据：`fc:concept`, `role:card-item`, `type:document`, `tags:3`, `children:5`

---

## 三、数据模型深度分析

### 3.1 Rem 对象字段映射（docs/rem-object-field-mapping.md）

**来源**：
- 数据库：`~/remnote/remnote-<userId>/remnote.db`（SQLite，表 `quanta`）
- SDK：RemNote Plugin SDK 的 RemObject 类

#### SDK 直接属性（8 个）

| SDK 属性 | 类型 | 数据库字段 | 说明 |
|:--|:--|:--|:--|
| `_id` | RemId | `_id` | Rem 唯一 ID |
| `createdAt` | number | `createdAt` | 创建时间（毫秒） |
| `updatedAt` | number | `u` | 最后修改时间 |
| `parent` | RemId \| null | `parent` | 父 Rem ID |
| `children` | RemId[] | **不存储** | 通过反查 `parent` + 按 `f` 排序 |
| `type` | RemType | `type` | 1=Concept, 2=Descriptor, 6=Portal |
| `text` | RichText | `key` | 正面文本 |
| `backText` | RichText | `value` | 背面文本（或 null） |

#### children 的重要发现

**数据库中没有 `children` 字段**。SDK 的 `RemObject.children` 是动态生成的：

```typescript
children = DB.query("SELECT * FROM quanta WHERE parent == thisRemId").sort(by: f)
```

**启示**：
- 任何修改 children 顺序的操作，实际是修改子 Rem 的 `f`（分数索引）字段
- CLI 不可能直接赋值 `children`，只能通过 setParent 或类似 SDK 方法改变

#### 重要数据库字段汇总

| 数据库字段 | 频次 | 含义 | SDK 对应 |
|:--|:--|:--|:--|
| `f` | 8237 | 分数索引（兄弟排序） | 通过 SDK 方法间接修改 |
| `tp` | 2323 | 标签映射 `{remId: {t:bool}}` | `getTagRems()` / 标签操作 |
| `ih` | 2066 | 层级类型（heading/todo） | `getFontSize()` / `isTodo()` |
| `efc` / `enableBackSR` | 1860/3409 | 闪卡设置 | `getEnablePractice()` |
| `crt` | 1991 | 卡片调度数据 | `getCards()`（禁用） |

---

## 四、现有实现状态

### 4.1 已完成

- ✅ 架构设计和约束定义（AGENTS.md）
- ✅ Flashcard 禁操规则（CLAUDE.md）
- ✅ connect/health/disconnect 规范设计
- ✅ 单 Rem 读写规范（包含三道防线、缓存机制、字段映射）
- ✅ 多 Rem 树模式规范（包含 diff 算法、行级操作定义）
- ✅ RemNote SDK 字段深度映射分析

### 4.2 实现中

- 🔄 CLI 命令实现（Phase 1-4）
- 🔄 Plugin WebSocket 客户端（Phase 5）
- 🔄 集成验证（Phase 6）

### 4.3 待开发

- ⏳ remnote-skills（Markdown 格式的 Agent Skills）
- ⏳ remnote-mcp（MCP Server 实现）
- ⏳ 搜索、创建、删除等高级命令

---

## 五、经验与陷阱记录

### 5.1 已识别的风险

| 风险 | 来源 | 影响 | 现状 |
|------|------|------|------|
| webpack-dev-server 稳定性 | 作为守护进程子进程运行 | 崩溃影响 WS Server | 已认识，可接受 |
| child_process.fork 跨平台行为 | macOS/Linux/Windows 差异 | 进程管理不一致 | 需测试 |
| WebSocket 浏览器安全策略限制 | RemNote 在浏览器内运行 | Plugin 连接可能被限制 | 参考项目已验证可行 |
| RichText round-trip 有损 | toMarkdown → parseFromMarkdown | 额外格式信息丢失 | 已硬性禁止（树模式不允许修改已有行） |

### 5.2 设计原则

1. **缓存 = AI 的认知**
   - 守护进程缓存语义上代表 AI 当前对数据库的理解
   - 失败时不自动更新缓存，迫使 AI 走正确流程

2. **str_replace 优于 JSON Patch**
   - 通用性高，所有 LLM 都熟悉
   - 灵活度高，可跨字段修改

3. **三道防线分工明确**
   - 防线 1：确保 read→edit 流程
   - 防线 2：确保数据一致性
   - 防线 3：确保字符串匹配精确

4. **硬性约束优于软性建议**
   - 树模式禁止修改已有行内容（硬性）比建议（软性）可靠

5. **JSON 保真，Markdown 仅用于展示**
   - read-rem 返回 JSON（完整保真）
   - read-tree 返回 Markdown（仅用于视觉展示）

---

## 六、如何利用这些知识

### 实现新功能时的检查清单

- [ ] 是否违反了层边界或依赖方向？（AGENTS.md 2.1）
- [ ] 命令是否实现了 `--json` 输出？（AGENTS.md 2.3）
- [ ] 是否涉及 Flashcard 操作？（CLAUDE.md，如有立即停止）
- [ ] 是否需要修改 RemObject？查阅 rem-object-field-mapping.md（3.1）
- [ ] 是否需要操作多 Rem？是否违反了树模式的禁止修改已有行内容规则？（2.3）

### 参考资源优先级

1. **AGENTS.md** — 开始任何新功能前必读（架构约束）
2. **CLAUDE.md** — 快速参考（禁操规则）
3. **docs/初始需求/\*** — 实现单 Rem / 树模式时的完整规范
4. **docs/rem-object-field-mapping.md** — 理解数据库设计和 SDK 方法映射
5. **docs/plans/ + brainstorms/** — 理解设计决策的来龙去脉

---

## 七、当前项目文档缺口

### 缺失的文档

- ❌ `docs/solutions/` — 不存在制度化的问题-解决方案库
- ❌ `critical-patterns.md` — 不存在关键模式汇总
- ⚠️ 实现细节文档 — 各个命令、缓存、diff 算法的实现细节尚未文档化

### 建议补充

1. **添加 `docs/solutions/` 结构**（参考 CLAUDECODE 标准），记录：
   - 构建错误、测试失败、运行时错误
   - 性能优化经验、安全问题修复
   - 集成问题、逻辑错误的根因分析

2. **添加 `critical-patterns.md`**，汇总：
   - 三道防线机制的完整流程
   - 分数索引（fractional indexing）的排序原理
   - RichText 数据结构和序列化格式

3. **添加 `docs/implementation/` 目录**，记录：
   - 缓存实现细节和 LRU 策略
   - 树 diff 算法的伪代码
   - WebSocket 协议消息定义

---

## 附录：文件导航

```
remnote-bridge-cli/
├── .claude/
│   └── CLAUDE.md                           ← 项目约束（Flashcard 禁操）
├── AGENTS.md                               ← 架构指导（必读）
├── docs/
│   ├── RemNote API Reference/              ← SDK 文档（151 个文件）
│   ├── rem-object-field-mapping.md         ← 数据库字段映射
│   ├── brainstorms/
│   │   └── 2026-03-02-cli-health-connect-brainstorm.md
│   ├── plans/
│   │   └── 2026-03-02-feat-cli-health-connect-commands-plan.md
│   └── 初始需求/
│       ├── remnote-cli-single-rem-spec.md  ← 单 Rem 完整规范
│       └── remnote-cli-tree-mode-spec.md   ← 树模式完整规范
├── remnote-cli/                            ← 命令层（实现中）
├── remnote-plugin/                         ← 桥接层（实现中）
├── remnote-skills/                         ← 接入层（待开发）
├── remnote-mcp/                            ← 接入层（待开发）
└── scripts/
    ├── check-layer-deps.js                 ← 依赖检查
    └── crawl-remnote-docs.sh                ← SDK 文档更新
```

---

**审计完成**
下一步：根据需求启动 docs/solutions/ 目录结构的建立，逐步积累问题解决的机构知识。

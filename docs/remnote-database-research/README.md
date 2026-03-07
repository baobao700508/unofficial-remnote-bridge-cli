# RemNote 本地数据库研究报告

> 调查日期: 2026-03-07
> 调查环境: macOS (Darwin 25.1.0)
> RemNote 版本: 1.22.56（基于 `tiny_graph_metadata.highestLoadedVersion`）

---

## 1. 数据库存放路径

RemNote 本地数据在 `~/remnote/` 目录下，按知识库 ID 和用途分为三个子目录，各含一个 SQLite 数据库：

```
~/remnote/
├── remnote-<userId>/          ← 主数据库（33 MB）
│   ├── remnote.db             ← 所有 Rem、Card、用户数据
│   ├── backups/               ← 自动备份（zip，每份约 11 MB）
│   └── files/                 ← 本地附件（图片、PDF 等，84 个文件）
├── browser/                   ← 浏览器端数据库（4.1 MB）
│   └── remnote.db             ← 几乎为空，仅存日志和 FTS 配置
└── remnote-browser/           ← 浏览器端本地存储（896 KB）
    └── remnote.db             ← 少量 local_stored_data + 同步元数据
```

- `<userId>` 是知识库 ID，本例为 `678200155dd583977e1d03ed`
- 整个 `~/remnote/` 目录总计 469 MB（含备份和附件）

### 三个数据库对比

| 数据库 | 大小 | 核心用途 | 有数据的表数 |
|:--|:--|:--|:--|
| `remnote-<userId>/remnote.db` | 33 MB | **主数据库**：所有 Rem、Card、同步、搜索索引 | 20+ |
| `browser/remnote.db` | 4.1 MB | 浏览器日志：仅 `persisted_logging`（4402 条）和 FTS 配置 | 3 |
| `remnote-browser/remnote.db` | 896 KB | 浏览器本地存储：`local_stored_data`（26 条）、同步元数据 | 5 |

**结论**：只有 `remnote-<userId>/remnote.db` 是真正的主数据库，另外两个基本为空或只存辅助数据。

---

## 2. 主数据库表清单

主数据库共 **47 个表**（含 FTS 虚拟表的内部表）。按功能分组如下：

### 2.1 核心业务表

| 表名 | 行数 | Schema | 说明 |
|:--|--:|:--|:--|
| **quanta** | 8,317 | `_id TEXT PK, doc TEXT, x INTEGER` | **Rem 主表**，每行一个 Rem，`doc` 为 JSON |
| **cards** | 3,223 | `_id TEXT PK, doc TEXT, rId GENERATED, x INTEGER` | **卡片表**，`rId` 是关联的 Rem ID（计算列） |
| **knowledge_base_data** | 112 | `_id TEXT PK, doc TEXT` | 知识库级配置（迁移标记、设置等） |
| **user_data** | 623 | `_id TEXT PK, doc TEXT` | 用户数据（使用统计、偏好等） |
| **spaced_repetition_scheduler** | 2 | `_id TEXT PK, doc TEXT` | 间隔重复调度器配置（FSRS 参数） |

### 2.2 同步与变更追踪

| 表名 | 行数 | 说明 |
|:--|--:|:--|
| **sync2** | 7 | 各集合的同步状态（lastSync、lastServerTime 等） |
| **sync** | 0 | 旧同步表（已弃用） |
| **client_sync_log** | 0 | 客户端同步日志 |
| **staged_changes_quanta** | 0 | 待提交的 Rem 变更 |
| **staged_changes_cards** | 0 | 待提交的卡片变更 |
| **staged_changes_knowledge_base_data** | 0 | 待提交的知识库数据变更 |
| **staged_changes_spaced_repetition_scheduler** | 0 | 待提交的调度器变更 |
| **staged_changes_user_data** | 0 | 待提交的用户数据变更 |
| **sync_debug_logs** | 0 | 同步调试日志 |

### 2.3 软删除表（deleted_*）

每个核心表都有对应的软删除表，结构相同但多一个 `deletedAt` 索引：

| 表名 | 行数 |
|:--|--:|
| **deleted_quanta** | 289 |
| **deleted_cards** | 42 |
| **deleted_user_data** | 609 |
| **deleted_knowledge_base_data** | 16 |
| **deleted_spaced_repetition_scheduler** | 3 |
| **deleted_missing_quanta** | 0 |
| **deleted_client_sync_log** | 0 |
| **deleted_knowledgebase_local_stored_data** | 0 |
| **deleted_local_stored_data** | 0 |
| **deleted_sync** | 0 |
| **deleted_tutorialTasks** | 0 |

### 2.4 全文搜索（FTS5）

| 表名 | 行数 | 说明 |
|:--|--:|:--|
| **remsContents** | 6,042 | FTS5 虚拟表，tokenize='simple'，prefix='1 2 3' |
| **remsContents_content** | 6,042 | FTS 内容存储 |
| **remsContents_data** | 1,211 | FTS 段数据 |
| **remsContents_docsize** | 6,042 | FTS 文档大小 |
| **remsContents_idx** | 948 | FTS 倒排索引 |
| **remsContents_config** | 1 | FTS 配置 |
| **remsSearchInfos** | 6,030 | 搜索元信息（祖先文本、排名数据、频次） |
| **remsSearchRanks** | 6,030 | 搜索排名分数 |
| **searchOptions** | 1 | 搜索配置（`isInitiallySeeded5=1`） |
| **pendingRecomputeRems** | 2,298 | 待重新计算搜索索引的 Rem 队列 |

搜索排名公式（从 trigger 中提取）：

```
rank = w*5000 + wl*5000 + i*(-2000) + rd*400 + (y==1 ? -500 : 0)
     + t + (-sqrt(u)) + (-sqrt(tc)) + x + (k ? 100 : 0)
```

### 2.5 辅助表

| 表名 | 行数 | 说明 |
|:--|--:|:--|
| **missing_quanta** | 819 | 引用但尚未同步到本地的 Rem |
| **missing_ids_quanta** | 1,378 | 缺失 Rem 的 ID 索引 |
| **missing_ids_cards** | 0 | 缺失 Card 的 ID 索引 |
| **descendant_cards** | 0 | 祖先→后代卡片映射（`ancestorRemId, cardType, descendantRemId`） |
| **cached** | 0 | 通用缓存表 |
| **key_value_store** | 1 | KV 存储（标记初始下载完成） |
| **tiny_graph_metadata** | 6 | 图元数据（版本、存储 ID、迁移状态等） |
| **migrations** | 18 | 数据库迁移历史（18 次迁移） |
| **knowledgebase_local_stored_data** | 10 | 知识库本地存储 |
| **local_stored_data** | 0 | 通用本地存储 |
| **tutorialTasks** | 0 | 教程任务 |
| **persisted_logging** | 0 | 持久化日志（环形缓冲区） |

---

## 3. quanta 表详细分析（Rem 主表）

### 3.1 表结构

```sql
CREATE TABLE quanta (
  _id TEXT NOT NULL PRIMARY KEY,  -- Rem ID
  doc TEXT,                        -- JSON 文档（所有字段存在此处）
  x INTEGER                       -- 排序序号（递增整数）
);
```

所有 Rem 数据以 JSON 形式存储在 `doc` 列中。SQLite 通过 `JSON_EXTRACT` 建立了 18 个索引用于高效查询。

### 3.2 Triggers

quanta 表有 3 个触发器，用于维护搜索索引：

| 触发器 | 事件 | 作用 |
|:--|:--|:--|
| `addRemToRecomputeOnInsert` | INSERT | 将新 Rem 加入 `pendingRecomputeRems` 队列 |
| `addRemToRecomputeOnUpdate` | UPDATE | 将修改的 Rem 加入重算队列 |
| `deleteSearchInfoOnQuantaDelete` | DELETE | 清理 FTS 索引和搜索信息 |

### 3.3 doc JSON 全部键（93 个基础键 + 对应的时间戳键）

以下列出 quanta 表 `doc` 中出现的**所有顶层 JSON 键**，按出现频率排序。带 `,u` 后缀的是该字段的最后更新时间戳，带 `,o` 后缀的是 origin 时间戳。

#### 通用字段（所有 Rem 都有）

| 键 | 频次 | 类型 | 含义 |
|:--|--:|:--|:--|
| `_id` | 8,317 | text | Rem 唯一 ID |
| `createdAt` | 8,317 | integer | 创建时间（毫秒时间戳） |
| `key` | 8,317 | array | **正面文本**（RichText 数组） |
| `m` | 8,317 | integer | 创建时间（与 `createdAt` 相同值，冗余） |
| `owner` | 8,317 | text | 知识库 ID |
| `parent` | 8,317 | text/null | 父 Rem ID（null = 顶级） |
| `v` | 8,317 | integer | 版本号（观察到值 = 4） |
| `x` | 8,317 | integer | 排序权重/全局序号（递增整数） |
| `y` | 8,317 | integer | 最后同步时间戳 |
| `z` | 8,317 | integer | 数据源标识（1=系统默认, 3=用户创建） |

#### 排序与结构

| 键 | 频次 | 类型 | 含义 |
|:--|--:|:--|:--|
| `f` | 8,268 | text | 兄弟间排序索引（分数索引，如 `"a0"`, `"a1"`, `"a2n"`） |
| `o` | 8,232 | integer | 最后 origin 更新时间戳 |
| `u` | 8,054 | integer | **最后修改时间**（毫秒）→ SDK `updatedAt` |
| `p` | 6,341 | integer | **本地最后更新时间** → 可能对应 SDK `localUpdatedAt` |

#### 内容字段

| 键 | 频次 | 类型 | 含义 |
|:--|--:|:--|:--|
| `k` | 5,571 | text | 查找键（`"parentName.remName"` 或 `"null.remName"`），`findByName()` 的索引 |
| `value` | 3,810 | array/null | **背面文本**（RichText 数组） |
| `type` | 2,892 | integer | Rem 类型：1=Concept, 2=Descriptor, 6=Portal |

#### 闪卡相关

| 键 | 频次 | 类型 | 含义 |
|:--|--:|:--|:--|
| `forget` | 3,720 | boolean | 是否标记为"忘记" |
| `enableBackSR` | 3,414 | boolean | 是否启用反向间隔重复 |
| `crt` | 1,999 | object | 卡片调度数据（`{g:{}}` 等） |
| `efc` | 1,535 | boolean | 是否启用正向卡片（enable forward card） |

#### 显示与格式

| 键 | 频次 | 类型 | 含义 |
|:--|--:|:--|:--|
| `ie` | 2,371 | text/boolean | 内嵌类型/编辑器信息（如 `"g.c"`, `"ip.s"`, `true`） |
| `tp` | 2,332 | object | 标签/Powerup 映射（`{remId: {t:bool, ",u":timestamp}}`） |
| `ih` | 2,067 | text | 层级类型：`"h"`=heading, `"t"`=todo |
| `iv` | 1,861 | boolean/integer | 可见性/展开状态 |
| `folderOpen` | 374 | boolean | 文件夹是否展开 |
| `mh` | 336 | object | 移动历史（`{remId: {m: {d: timestamp}}}`） |
| `noBullet` | 52 | boolean | 是否隐藏项目符号 |

#### Powerup / 内置属性

| 键 | 频次 | 类型 | 含义 |
|:--|--:|:--|:--|
| `e` | 2,285 | text | 完整路径标识（如 `"u.p.d"`, `"s.parentId.b.u"`） |
| `rcrp` | 1,889 | text | 此 Rem 是某个 Powerup 的 property（如 `"b.u"`, `"d.s"`） |
| `ck` | 541 | text | Powerup code key（如 `"tree"`, `"clo"`） |
| `rcrs` | 128 | text | 此 Rem 是某个 Powerup 的 slot |
| `rcrt` | 81 | text | 此 Rem 是某个 Powerup 的根 |
| `nck` | 81 | text | normalized concept key |
| `rcre` | 30 | text | Powerup 相关扩展标识 |
| `ft` | 7 | text | 属性类型：`"text"`, `"single_select"`, `"checkbox"` 等 |

#### 统计与缓存

| 键 | 频次 | 类型 | 含义 |
|:--|--:|:--|:--|
| `qe` | 268 | - | 队列相关 |
| `r` | 206 | - | 引用相关 |
| `cd` | 203 | integer | 子孙中的卡片总数 |
| `cq` | 197 | integer | 子孙中待练习的卡片数 |
| `dm` | 196 | object | 学习状态分布（`{New:N, Acquiring:N, Growing:N, Stale:N}`） |
| `opfl` | 190 | - | 操作标记 |
| `ic` | 178 | - | 内部计数 |
| `docUpdated` | 164 | integer | 文档更新时间 |

#### Portal 与文档

| 键 | 频次 | 类型 | 含义 |
|:--|--:|:--|:--|
| `pd` | 145 | - | Portal 相关数据 |
| `portalType` | 105 | integer | Portal 类型 |
| `spo` | 103 | - | 搜索 Portal 相关 |
| `searchResults` | 74 | - | 搜索结果 |
| `ph` | 75 | - | Portal 历史 |
| `embeddedSearchId` | 45 | text | 嵌入式搜索 ID |
| `selectedInSearch` | 40 | - | 搜索中选中状态 |
| `searchAliases` | 40 | - | 搜索别名 |

#### AI 与导入

| 键 | 频次 | 类型 | 含义 |
|:--|--:|:--|:--|
| `ai` | 1,450 | object | AI 生成的定义（`{def: "..."}`） |
| `deletionReason` | 1,337 | - | 删除原因 |
| `autoImport` | 15 | boolean | 是否自动导入 |
| `srcRemId` | 15 | text | 来源 Rem ID |
| `srcRemC` | 15 | text | 来源 Rem 上下文标识 |

#### 表格与视图

| 键 | 频次 | 类型 | 含义 |
|:--|--:|:--|:--|
| `vt` | 69 | - | 视图类型 |
| `qt` | 69 | - | 查询类型 |
| `tco` | 59 | - | 表格列顺序 |
| `tcld` | 58 | - | 表格列定义 |
| `stv` | 58 | - | 表格子视图 |
| `stsc` | 58 | - | 表格排序配置 |
| `stsh` | 57 | - | 表格显示/隐藏 |
| `tsvl` | 26 | - | 表格子视图布局 |
| `dwtl` | 24 | - | 文档宽度/表格布局 |

#### 练习与调度

| 键 | 频次 | 类型 | 含义 |
|:--|--:|:--|:--|
| `lastPracticed` | 22 | integer | 最后练习时间 |
| `hato` | 21 | - | 练习相关标记 |
| `history` | 7 | array | 练习历史 |

#### 低频杂项（出现 ≤5 次）

| 键 | 频次 | 含义 |
|:--|--:|:--|
| `t` | 39 | 时间相关 |
| `pe` | 39 | 权限/导出 |
| `tw` | 28 | 推特/外部链接 |
| `tc` | 35 | 文本计数 |
| `dci` | 19 | 数据完整性 |
| `scp` | 5 | 拷贝源 |
| `tgs` | 4 | 标签组 |
| `gc` | 3 | 垃圾回收标记 |
| `edi` | 3 | 编辑器信息 |
| `cp` | 3 | 复制相关 |
| `cofh` | 3 | 折叠历史 |
| `ccop` | 3 | 复制操作 |
| `ltc` | 2 | 最后文本变更 |
| `ln` | 2 | 链接 |
| `aziq` | 2 | AI 问答 |
| `as` | 2 | 别名/源 |
| `ap` | 2 | 附件/属性 |
| `ttic` | 1 | - |
| `timesMovedTo` | 1 | 移动次数 |
| `sst` | 1 | 子状态 |
| `src` | 1 | 源 |
| `sl` | 1 | 选择 |
| `showAiFlashcardExplanation` | 1 | 显示 AI 闪卡解释 |
| `sh` | 1 | 共享 |
| `sgd` | 1 | - |
| `sc` | 1 | - |
| `sb` | 1 | 侧边栏 |
| `op` | 1 | 操作 |
| `mpi` | 1 | - |
| `mpdi` | 1 | - |
| `lttdd` | 1 | - |
| `drawing` | 1 | 绘图数据 |
| `daitd` | 1 | - |

---

## 4. cards 表详细分析

### 4.1 表结构

```sql
CREATE TABLE cards (
  _id TEXT NOT NULL PRIMARY KEY,
  doc TEXT,
  rId AS (json_extract(doc, '$.rId')),  -- 计算列：关联的 Rem ID
  x INTEGER
);
```

特点：`rId` 是 SQLite 计算列（generated column），自动从 JSON 中提取。

### 4.2 doc JSON 键

| 键 | 频次 | 类型 | 含义 |
|:--|--:|:--|:--|
| `_id` | 3,223 | text | 卡片 ID |
| `rId` | 3,223 | text | 关联的 Rem ID |
| `c` | 3,223 | text | 卡片方向：`"f"`=正向, `"b"`=反向 |
| `st` | 3,223 | integer | 调度时间 |
| `ml` | 3,223 | text | 记忆等级：`"New"`, `"Acquiring"`, `"Growing"` 等 |
| `n` | 3,223 | integer | 下次复习时间 |
| `e` | 3,223 | integer | 创建/进入时间 |
| `m` | 3,223 | integer | 创建时间 |
| `k` | 3,223 | text | 查找键（`"remId.f"` 或 `"remId.b"`） |
| `createdAt` | 3,223 | integer | 创建时间 |
| `x` | 3,223 | integer | 排序序号 |
| `z` | 3,223 | integer | 数据源 |
| `owner` | 3,223 | text | 知识库 ID |
| `a` | 2,984 | integer | 上次答题时间 |
| `d` | 2,865 | integer | 难度/间隔 |
| `h` | 2,095 | - | 历史 |
| `ny` | 2,077 | integer | 下一次 Y 值 |
| `l` | 2,066 | - | 学习状态 |
| `ne` | 2,063 | - | 下一次事件 |
| `t` | 902 | - | 时间标记 |
| `b` | 412 | - | 反向相关 |

### 4.3 卡片示例

```json
{
  "m": 1737393198430,
  "e": 1737393198430,
  "ml": "New",
  "c": "f",
  "rId": "2HUhG1Q7AxvUQEmEn",
  "n": 1737393198430,
  "a": 1737393198430,
  "st": 1737997998430,
  "d": 1737393198430,
  "createdAt": 1737393198430,
  "k": "2HUhG1Q7AxvUQEmEn.f",
  "_id": "49QXz7WRjxBbquLdx",
  "x": 21,
  "z": 1,
  "owner": "678200155dd583977e1d03ed"
}
```

---

## 5. 其他重要表

### 5.1 knowledge_base_data（知识库配置）

存储知识库级别的配置项，采用 `key-value` 模式：

```json
{
  "m": 1736572958752,
  "key": "hasMigratedAccountV46",
  "value": true,
  "_id": "05uQ0907NyWQfcmbG",
  "z": 1,
  "owner": "678200155dd583977e1d03ed"
}
```

共 112 条，大多是迁移标记（`hasMigratedAccountV*`）和知识库设置。

### 5.2 user_data（用户数据）

存储用户级别的使用统计和偏好，同样 `key-value` 模式：

```json
{
  "key": "usage.Unsubscribed",
  "_id": "lV2M1VCu1Rax5OeTd",
  "value": {"count": 9, "lastUsed": "2026-02-14T21:17:06.545Z"},
  "z": 1,
  "owner": "678200155dd583977e1d03ed"
}
```

共 623 条。

### 5.3 spaced_repetition_scheduler（间隔重复调度器）

仅 2 条记录，存储 FSRS 算法参数：

```json
{
  "st": "fsrs",
  "ift": "1, 2",
  "eb": 1.3,
  "se": 2.3,
  "lfs": "0, 1, 4",
  "ei": 4,
  "lni": 0.1,
  "im": 1,
  "md": 1825
}
```

### 5.4 tiny_graph_metadata

| key | value | 说明 |
|:--|:--|:--|
| `highestLoadedVersion` | `1.22.56` | RemNote 客户端版本 |
| `storageID` | `3158070127408138` | 存储 ID |
| `migrated` | `true` | 已完成迁移 |
| `migrated_ids-quanta` | `true` | quanta ID 迁移完成 |
| `migrated_ids-cards` | `true` | cards ID 迁移完成 |
| `lastFlushedTime` | `1772754522972` | 最后刷盘时间 |

### 5.5 migrations（迁移历史）

数据库经历了 18 次 schema 迁移，从 2022 年到 2025 年：

| 迁移 | 名称 |
|:--|:--|
| 2022-11 | `createInitialTables` |
| 2023-03 | `createDeckTables` |
| 2023-06 | `fixClusteredIndex` |
| 2023-06 | `createMissingIdTables` |
| 2023-06 | `createTinyGraphTable` |
| 2023-06 | `createFtsTables` |
| 2023-06 | `addRankingFtsTable` |
| 2023-08 | `recursiveSearchFtsTable` |
| 2023-09 | `createStagedChangesTables` |
| 2023-10 | `createConceptIndex` |
| 2023-12 | `createSyncLogTable` |
| 2024-03 | `createNormalizedConceptIndex` |
| 2024-03 | `addisSearchableColumn` |
| 2024-05 | `createAncestorsRowIdsIndex2` |
| 2025-06 | `recursiveSearchFtsTableHierarchicalSearchFix` |
| 2025-07 | `createKeyValueTable` |
| 2025-11 | `createPersistedLoggingTable` |

---

## 6. 设计模式总结

### 6.1 文档数据库模式

RemNote 将 SQLite 当作**文档数据库**使用：
- 每个核心表只有 `_id`（主键）、`doc`（JSON 文本）、`x`（排序号）三列
- 所有业务字段都存在 `doc` JSON 中
- 通过 `JSON_EXTRACT` 创建索引实现高效查询

### 6.2 时间戳伴生键

每个业务字段 `<field>` 都可能有两个伴生时间戳键：
- `<field>,u` — 该字段的最后更新时间（update time）
- `<field>,o` — 该字段的 origin 时间（origin time，可能用于 CRDT 冲突解决）

### 6.3 软删除 + 暂存变更

- 删除不是物理删除，而是移到 `deleted_*` 表
- 写操作先记录到 `staged_changes_*` 表，再批量同步到服务器

### 6.4 全文搜索

- 使用 SQLite FTS5 实现，带 `simple` tokenizer 和 1-3 字符前缀索引
- `remsSearchInfos` 表维护祖先文本（支持层级搜索）
- 通过多个递归触发器自动更新祖先文本和排名

### 6.5 children 不存储

数据库中**没有** `children` 字段。SDK 的 `children` 列表是通过查询 `parent = thisRemId` 的所有 Rem，按 `f`（分数索引）排序后反向组装的。

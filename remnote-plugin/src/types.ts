/**
 * RemObject — 本项目定义的 Rem 数据对象
 *
 * 包含 SDK Rem 类所有可获取的信息。
 * 由 plugin services 层组装，通过 WS 传给 CLI，最终交给 AI Agent 消费。
 *
 * 设计原则：
 * - 所有字段均来自 SDK 可获取的数据，无猜测
 * - type 和 isDocument 是两个独立维度，不合并
 * - 不包含任何 Flashcard/Card 相关字段
 * - 关联关系只存 ID，不嵌套对象（避免循环引用和体积膨胀）
 * - 需要参数的方法（如 isCollapsed(portalId)）不纳入，留给按需查询
 *
 * 读写标注：
 * - [RW]   = 可读可写（SDK 有对应的 setter/add/remove 方法）
 * - [R]    = 只读，默认输出（SDK 仅有 getter）
 * - [R-F]  = 只读，仅 --full 模式输出（低频 / 细粒度 / 可由其他字段推导）
 *
 * 输出模式（CLI --full 选项）：
 * - 默认模式：输出 [RW] + [R] 字段（34 个），覆盖 Agent 常用场景
 * - --full 模式：额外输出 [R-F] 字段（+17 个），用于调试或深度分析
 *
 * 实测标注（2026-03-03 在 RemNote UI 中逐字段截图观察）：
 * - ✅ 已实测 = 在真实 RemNote 环境中创建独立 Rem 并截图观察视觉行为
 * - 每个 [RW] 字段的 JSDoc 记录了实际 UI 行为（非仅 PASS/FAIL）
 */

// ─── RichText ────────────────────────────────────────────────

/**
 * RichText 元素 — 直接透传 SDK 的 RichTextElementInterface
 *
 * 每个元素为 string（纯文本）或带 i 字段的格式化对象：
 *   i="m" → 带格式文本（bold/italic/underline/code/highlight/cloze/url）
 *   i="q" → Rem 引用（含 _id、aliasId?）
 *   i="i" → 图片（url/width/height）
 *   i="g" → 全局名称
 *   i="fi" → 闪卡图标
 *   以及 audio、latex、plugin、annotation、card delimiter、add icon 等
 */
export type RichTextElement = string | Record<string, unknown>;
export type RichText = RichTextElement[];

// ─── 枚举 / 字面量类型 ──────────────────────────────────────

/** Rem 类型（对应 SDK RemType 枚举） */
export type RemTypeValue = 'concept' | 'descriptor' | 'portal' | 'default';

/** 标题大小 */
export type FontSize = 'H1' | 'H2' | 'H3';

/** 待办状态 */
export type TodoStatus = 'Finished' | 'Unfinished';

/** 高亮颜色（SDK setHighlightColor 支持的值） */
export type HighlightColor = 'Red' | 'Orange' | 'Yellow' | 'Green' | 'Blue' | 'Purple';

/** Portal 子类型（仅 type === 'portal' 时有值） */
export type PortalType = 'portal' | 'embedded_queue' | 'scaffold' | 'search_portal';

/** 练习方向 */
export type PracticeDirection = 'forward' | 'backward' | 'both' | 'none';

/**
 * 属性类型（对应 SDK PropertyType 枚举）
 * 当 Rem 作为 tag/powerup 的属性时，标识该属性的数据类型
 */
export type PropertyTypeValue =
  | 'text'
  | 'number'
  | 'date'
  | 'checkbox'
  | 'single_select'
  | 'multi_select'
  | 'url'
  | 'image'
  | 'title'
  | 'definition'
  | 'created_at'
  | 'last_updated'
  | 0; // IMPLICIT_TEXT

// ─── RemObject 主体 ─────────────────────────────────────────

export interface RemObject {

  // ══════════════════════════════════════════════════════════
  //  核心标识
  // ══════════════════════════════════════════════════════════

  /** [R] Rem 唯一 ID。SDK 直接属性 _id */
  id: string;

  // ══════════════════════════════════════════════════════════
  //  内容
  // ══════════════════════════════════════════════════════════

  /**
   * [RW] ✅ 正面文本（RichText 数组）。SDK: text / setText()
   * UI 行为：文本内容立即更新显示，无格式副作用
   */
  text: RichText;
  /**
   * [RW] ✅ 背面文本。SDK: backText / setBackText()
   * UI 行为：设值后 Rem 显示为 "正面文本 → 背面文本" 格式（箭头分隔符）
   *         默认 null（无背面）；设值即产生闪卡正反面结构
   */
  backText: RichText | null;

  // ══════════════════════════════════════════════════════════
  //  类型系统（两个独立维度）
  // ══════════════════════════════════════════════════════════

  /**
   * [RW] ✅ Rem 类型。SDK: type, getType() / setType(SetRemType)
   * UI 行为：CONCEPT → 文字变粗体；DESCRIPTOR → 保持正常字重（与默认无视觉差异）
   *         SetRemType 不含 PORTAL(6)，Portal 只能通过 createPortal() 创建
   */
  type: RemTypeValue;
  /**
   * [RW] ✅ 是否作为独立文档页面打开。SDK: isDocument() / setIsDocument()
   * UI 行为：bullet (•) 变为文档页面图标（小方块），Rem 可作为独立页面打开
   *         独立于 type，CONCEPT Rem 可以同时是 Document
   */
  isDocument: boolean;

  // ══════════════════════════════════════════════════════════
  //  结构
  // ══════════════════════════════════════════════════════════

  /**
   * [RW] ✅ 父 Rem ID。null 表示顶级。SDK: parent / setParent(parent, position?)
   * UI 行为：Rem 从原位置消失，出现在新父级的子列表中
   */
  parent: string | null;
  /** [R] 子 Rem ID 有序数组。SDK 直接属性 children（修改子的 parent 间接改变） */
  children: string[];

  // ══════════════════════════════════════════════════════════
  //  格式 / 显示
  // ══════════════════════════════════════════════════════════

  /**
   * [RW] ✅ 标题大小。SDK: getFontSize() / setFontSize()
   * UI 行为：H1 → 超大粗体；H2 → 大粗体（略小于 H1）；H3 → 中粗体
   *         默认 null（普通大小）；setFontSize(undefined) 恢复
   */
  fontSize: FontSize | null;
  /**
   * [RW] ✅ 高亮颜色。SDK: getHighlightColor() / setHighlightColor()
   * UI 行为：整行背景变为对应颜色（Red→粉红、Blue→浅蓝），bullet 也着色
   *         默认 null（无高亮）
   */
  highlightColor: HighlightColor | null;

  // ══════════════════════════════════════════════════════════
  //  状态标记 — 所有 is*() 布尔方法
  // ══════════════════════════════════════════════════════════

  /**
   * [RW] ✅ 是否待办。SDK: isTodo() / setIsTodo()
   * UI 行为：文本前出现空心 checkbox（☐）；副作用：todoStatus 自动初始化为 "Unfinished"
   */
  isTodo: boolean;
  /**
   * [RW] ✅ 待办完成状态。SDK: getTodoStatus() / setTodoStatus()
   * UI 行为：Finished → checkbox 变蓝色已勾选（☑）+ 文本加删除线
   *         前提：需先 setIsTodo(true)，否则无意义
   */
  todoStatus: TodoStatus | null;
  /**
   * [RW] ✅ 是否代码块。SDK: isCode() / setIsCode()
   * UI 行为：Rem 变为代码块容器——等宽字体、灰色背景、块级缩进
   */
  isCode: boolean;
  /**
   * [RW] ✅ 是否引用块。SDK: isQuote() / setIsQuote()
   * UI 行为：左侧出现灰色竖线 + 行背景变浅灰（经典 blockquote 样式）
   */
  isQuote: boolean;
  /**
   * [RW] ✅ 是否列表项。SDK: isListItem() / setIsListItem()
   * UI 行为：bullet (•) 变为数字编号 "1."（有序列表样式）
   */
  isListItem: boolean;
  /**
   * [RW] ✅ 是否卡片项。SDK: isCardItem() / setIsCardItem()
   * UI：无明显变化。功能：标记 Rem 以卡片样式显示（类似看板布局），
   *     而非默认项目符号列表，在 RemNote 的 Card View 中生效
   */
  isCardItem: boolean;
  /** [R] 是否表格。SDK: isTable()（无 setIsTable，只有 setTableFilter） */
  isTable: boolean;
  /**
   * [RW] ✅ 是否 Powerup 插槽。SDK: isSlot() / setIsSlot()
   * UI：bullet 变为方形图标（☐）。功能：标记 Rem 为 Powerup 的数据插槽（slot），
   *     Powerup 注册时通过 slots 配置定义，用于存储键值对数据（值为 RichText）。
   *     通过 getPowerupProperty(code, slot) / setPowerupProperty() 读写
   */
  isSlot: boolean;
  /**
   * [RW] ✅ 是否 Tag 属性（表格列）。SDK: isProperty() / setIsProperty()
   * UI：bullet 变为方形图标（☐，与 isSlot 相同）。功能：标记 Rem 为父级 Tag 的
   *     结构化属性列，可通过 getPropertyType() 指定数据类型（text/number/date/checkbox/
   *     single_select/multi_select/url/image 等），通过 getTagPropertyValue(propertyId) /
   *     setTagPropertyValue() 读写单元格值。是 RemNote 表格系统的核心机制
   */
  isProperty: boolean;
  /** [R-F] 是否 Powerup。SDK: isPowerup()（写入用 addPowerup/removePowerup，参数化）。Powerup 系统标识 */
  isPowerup: boolean;
  /** [R-F] 是否 Powerup 枚举。SDK: isPowerupEnum()。Powerup 细分类型 */
  isPowerupEnum: boolean;
  /** [R-F] 是否 Powerup 属性。SDK: isPowerupProperty()。Powerup 细分类型 */
  isPowerupProperty: boolean;
  /** [R-F] 是否 Powerup 属性列表项。SDK: isPowerupPropertyListItem()。Powerup 细分类型 */
  isPowerupPropertyListItem: boolean;
  /** [R-F] 是否 Powerup 插槽。SDK: isPowerupSlot()。Powerup 细分类型 */
  isPowerupSlot: boolean;

  // ══════════════════════════════════════════════════════════
  //  Portal 专用
  // ══════════════════════════════════════════════════════════

  /** [R] Portal 子类型。仅 type === 'portal' 时有值。SDK: getPortalType() */
  portalType: PortalType | null;
  /** [R] Portal 直接包含的 Rem ID 数组。SDK: getPortalDirectlyIncludedRem() */
  portalDirectlyIncludedRem: string[];

  // ══════════════════════════════════════════════════════════
  //  属性类型（当此 Rem 是 tag/powerup 的属性时）
  // ══════════════════════════════════════════════════════════

  /** [R] 属性数据类型。SDK: getPropertyType() */
  propertyType: PropertyTypeValue | null;

  // ══════════════════════════════════════════════════════════
  //  练习设置（Rem 本身的配置，非 Card 操控）
  // ══════════════════════════════════════════════════════════

  /**
   * [RW] ✅ 是否启用间隔重复练习。SDK: getEnablePractice() / setEnablePractice()
   * UI：无明显变化。功能：为 true 时，RemNote 根据 Rem 的 text/backText 结构
   *     自动生成闪卡并纳入间隔重复调度。setType(CONCEPT) 可能自动置为 true
   */
  enablePractice: boolean;
  /**
   * [RW] ✅ 闪卡练习方向。SDK: getPracticeDirection() / setPracticeDirection()
   * UI：无明显变化。功能：控制闪卡生成方向——forward=正面→背面，
   *     backward=背面→正面，both=双向生成，none=不生成闪卡
   */
  practiceDirection: PracticeDirection;

  // ══════════════════════════════════════════════════════════
  //  关联 — 直接关系（ID 数组）
  // ══════════════════════════════════════════════════════════

  /**
   * [RW] ✅ 标签 Rem ID 数组。SDK: getTagRems() / addTag() / removeTag()
   * UI 行为：行右侧出现标签徽章（圆角矩形，显示标签名 + × 删除按钮）
   *         setType(CONCEPT) 等操作可能自动添加系统标签
   */
  tags: string[];
  /**
   * [RW] ✅ 来源 Rem ID 数组。SDK: getSources() / addSource() / removeSource()
   * UI 行为：Rem 下方出现来源引用子元素（灰色圆角框，显示来源 Rem 名 + ↗ 图标）
   */
  sources: string[];
  /**
   * [RW] ✅ 别名 Rem ID 数组。SDK: getAliases() / getOrCreateAliasWithText()
   * UI 行为：Rem 下方出现别名子元素（≡ 三横线图标 + 别名文本，深色背景）
   *         getOrCreateAliasWithText 有副作用（不存在则创建新 alias Rem）
   */
  aliases: string[];

  // ══════════════════════════════════════════════════════════
  //  关联 — 引用关系（ID 数组）
  // ══════════════════════════════════════════════════════════

  /** [R] 本 Rem 引用的其他 Rem ID 数组。SDK: remsBeingReferenced() */
  remsBeingReferenced: string[];
  /** [R-F] 本 Rem 深层引用的 Rem ID 数组。SDK: deepRemsBeingReferenced()。可由 remsBeingReferenced 递归获取 */
  deepRemsBeingReferenced: string[];
  /** [R] 引用本 Rem 的 Rem ID 数组（反向链接）。SDK: remsReferencingThis() */
  remsReferencingThis: string[];

  // ══════════════════════════════════════════════════════════
  //  关联 — 标签体系（ID 数组）
  // ══════════════════════════════════════════════════════════

  /** [R] 被本 Rem 标记的 Rem ID 数组（本 Rem 作为 tag 时）。SDK: taggedRem() */
  taggedRem: string[];
  /** [R-F] 祖先标签 Rem ID 数组。SDK: ancestorTagRem()。标签继承链，低频 */
  ancestorTagRem: string[];
  /** [R-F] 后代标签 Rem ID 数组。SDK: descendantTagRem()。标签继承链，低频 */
  descendantTagRem: string[];

  // ══════════════════════════════════════════════════════════
  //  关联 — 层级遍历（ID 数组）
  // ══════════════════════════════════════════════════════════

  /** [R] 所有后代 Rem ID 数组。SDK: getDescendants() */
  descendants: string[];
  /** [R] 兄弟 Rem ID 数组。SDK: siblingRem() */
  siblingRem: string[];
  /** [R-F] 包含的 Portal 和文档 Rem ID 数组。SDK: portalsAndDocumentsIn()。使用场景有限 */
  portalsAndDocumentsIn: string[];
  /** [R-F] 文档/Portal 中所有 Rem ID 数组。SDK: allRemInDocumentOrPortal()。可能数据量大 */
  allRemInDocumentOrPortal: string[];
  /** [R-F] 文件夹队列中的 Rem ID 数组。SDK: allRemInFolderQueue()。场景有限 */
  allRemInFolderQueue: string[];

  // ══════════════════════════════════════════════════════════
  //  位置 / 统计
  // ══════════════════════════════════════════════════════════

  /**
   * [RW] ✅ 在兄弟间的位置（0 起始）。SDK: positionAmongstSiblings() / setParent(parent, position)
   * UI 行为：Rem 在父级子列表中的显示位置改变（测试：A→B→C 变为 B→C→A）
   *         position 超过实际数量会被钳位到末尾；位置相对于父 Rem 的全部 children
   */
  positionAmongstSiblings: number | null;
  /** [R-F] 搜索中被选次数。SDK: timesSelectedInSearch()。统计数据，低频 */
  timesSelectedInSearch: number;
  /** [R-F] 上次移动时间（毫秒时间戳）。SDK: getLastTimeMovedTo()。过于细粒度 */
  lastTimeMovedTo: number;
  /** [R-F] Schema 版本号。SDK: getSchemaVersion()。内部版本号 */
  schemaVersion: number;

  // ══════════════════════════════════════════════════════════
  //  队列视图
  // ══════════════════════════════════════════════════════════

  /** [R-F] 嵌入式队列视图模式。SDK: embeddedQueueViewMode()。场景有限 */
  embeddedQueueViewMode: boolean;

  // ══════════════════════════════════════════════════════════
  //  元数据 / 时间戳
  // ══════════════════════════════════════════════════════════

  /** [R] 创建时间（毫秒时间戳）。SDK 直接属性 createdAt */
  createdAt: number;
  /** [R] 最后更新时间（毫秒时间戳）。SDK 直接属性 updatedAt */
  updatedAt: number;
  /** [R-F] 本地最后更新时间（毫秒时间戳）。SDK 直接属性 localUpdatedAt。与 updatedAt 重叠 */
  localUpdatedAt: number;
  /** [R-F] 上次练习时间（毫秒时间戳）。SDK: getLastPracticed()。间隔重复内部数据 */
  lastPracticed: number;
}

// ══════════════════════════════════════════════════════════════
//  以下 SDK 方法需要参数，不纳入 RemObject 静态字段，
//  留给按需查询接口：
//
//  [RW] isCollapsed(portalId) → bool          / setIsCollapsed(bool, portalId)
//  [R]  positionAmongstVisibleSiblings(portalId?) → number
//  [R]  visibleSiblingRem(portalId?) → Rem[]
//  [RW] hasPowerup(code) → bool               / addPowerup(code) / removePowerup(code)
//  [RW] getPowerupProperty(code, slot)         / setPowerupProperty(code, slot, value)
//  [RW] getPowerupPropertyAsRichText(code, slot) / setPowerupProperty(code, slot, value)
//  [R]  getPowerupPropertyAsRem(code, slot) → Rem
//  [RW] getTagPropertyValue(propertyId) → RT   / setTagPropertyValue(propertyId, value)
//  [R]  getTagPropertyAsRem(propertyId) → Rem
//  [RW] getOrCreateAliasWithText(aliasText) → Rem（含副作用，创建+读取）
//
//  以下 SDK 方法是纯动作/副作用，不对应任何可读字段：
//  （2026-03-03 在 RemNote UI 中逐个截图观察，初态→终态对比）
//
//  [W] ✅ remove()                      — UI：Rem 从文档中完全消失
//  [W] ✅ indent(portal?)               — UI：Rem 变为上方兄弟的子级（缩进一层，出现左竖线）
//  [W] ❌ outdent(portal?)              — UI：无可见变化（Rem 仍为子级）。可能需要编辑器焦点上下文
//  [W] ✅ merge(remId)                  — UI：被合并 Rem 消失，目标 Rem 保留原始文本（文本未追加）
//  [W]    mergeAndSetAlias(rem)         — 未测试（与 merge 类似 + 设别名）
//  [W] ✅ addToPortal(portal)           — UI：原始 Rem 保留；Portal 内出现引用副本（紫色左边框）
//  [W]    removeFromPortal(portal)      — 未测试（addToPortal 的逆操作）
//  [W] ❌ collapse(portal)              — UI：无可见变化（子级仍然可见）。可能需要 portalId 或编辑器上下文
//  [W] ❌ expand(portal, recurse)       — UI：无可见变化（collapse 未生效故 expand 也无效果）
//  [W]    setTableFilter(filter)        — 未测试（需要表格 Rem）
//  [W]    openRemAsPage()               — 未测试（会导致页面导航）
//  [W]    openRemInContext()            — 未测试（会导致页面导航）
//  [W]    scrollToReaderHighlight()     — 未测试（需要 Reader 上下文）
//  [W]    copyReferenceToClipboard()    — 未测试（剪贴板操作，无 UI 变化）
//  [W]    copyPortalReferenceToClipboard() — 未测试（同上）
//  [W]    copyTagReferenceToClipboard() — 未测试（同上）
// ══════════════════════════════════════════════════════════════

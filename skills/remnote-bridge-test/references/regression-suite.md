# 回归测试基线

固定的回归测试用例集。按级别组织，前序级别不过则后续全部跳过。

**本文件是活的**：随着功能增加，往对应级别里追加新用例。

---

## 使用方式

### 全量回归（发布前）

从 L1 逐级跑到 L5，全部 PASS 才算通过。

### 快速回归（小改后）

只跑 L1 + 受影响级别。例如改了 edit-tree → 跑 L1 + L2 + L3。

### 选择性回归

用户指定跑哪些用例。

### 双接口执行

**每个用例必须在 MCP 和 Skill 两个接口各跑一遍**：
- MCP：用 MCP 测试模板（prompt 禁止 Bash/Read，只用 `mcp__remnote-bridge__*`）
- Skill：用 Skill 测试模板（prompt 禁止 MCP 工具，只用 Bash + Read 执行 CLI）

隔离通过 prompt 纪律实现，审计时检查 subagent 是否违反工具限制。一侧过另一侧不过 → 说明对应接口的文档有问题。

---

## 级别定义

| 级别 | 主题 | 典型规模 | 覆盖工具 |
|:-----|:-----|:---------|:---------|
| **L1** | 基础设施 + 导航 | — | health, connect, disconnect, read_globe, read_context, search |
| **L2** | 单页面真实任务 | 10-20 行输出 | read_tree, edit_tree, read_rem, edit_rem |
| **L3** | 多步工作流 | 20-40 行输出 | 组合使用读写工具 + search |
| **L4** | 大规模真实任务 | 40+ 行输出 | 全工具协调 |
| **L5** | 极端边界 + 错误恢复 | — | 防线触发、大树省略、并发检测 |

---

## L1 基础设施 + 导航

> 连接不通一切白搭。

### L1-01: 连接生命周期

> ⚠️ **不可并行**：此用例执行 connect/disconnect，会干扰其他 subagent 的连接状态。必须单独串行执行。

**task_description**:
```
检查 RemNote 工具的连接状态并验证完整的连接/断开生命周期。

1. 检查系统健康状态（health）
2. 如果未连接，建立连接（connect）
3. 再次检查健康状态，确认 daemon / Plugin / SDK 三层都正常
4. 断开连接（disconnect）
5. 检查健康状态，确认已断开（daemon 应不再运行）
6. 重新连接，确保恢复正常
```

**验证**：无需 Chrome（纯基础设施）。检查 subagent 是否正确理解三层依赖、正确执行生命周期。

**断言**：
- [ ] 正确调用 health 并解读三层状态
- [ ] connect 成功启动 daemon
- [ ] disconnect 后 health 显示断开
- [ ] 重连后三层恢复

---

### L1-02: 探索 + 搜索 + 上下文

**task_description**:
```
综合使用导航和搜索工具探索知识库。

1. 确认连接正常（health 三层就绪）
2. 获取知识库的全局文档鸟瞰图（read_globe）
3. 从结果中找到名为"MCP 测试"的文档，报告它的 remId
4. 搜索关键词"测试"，报告搜到多少条结果
5. 获取当前上下文信息（read_context）
6. 综合报告：
   - read_globe 返回了多少个顶层文档
   - search 返回了多少条匹配
   - read_context 返回了什么面包屑路径
```

**验证**：subagent 能正确使用三个导航工具并综合报告结果。

**断言**：
- [ ] read_globe 成功，返回文档鸟瞰图
- [ ] 正确识别"MCP 测试"文档及其 remId
- [ ] search 成功返回结果
- [ ] read_context 成功返回上下文信息
- [ ] 综合报告包含三个工具的关键输出

---

## L2 单页面真实任务

> 模拟用户实际会让 AI 做的单页面操作。

### L2-01: 生成一章学习笔记

**task_description**:
```
在测试页面下创建"机器学习基础"学习笔记结构。

1. 确认连接正常
2. 读取测试页面的子树（read_tree）
3. 在测试页面下创建以下结构（edit_tree）：

   {prefix} 机器学习基础 （H1 标题）
     ## 监督学习
       分类 → 预测离散标签
       回归 → 预测连续值
       过拟合 → 模型在训练集表现好但泛化差 （Yellow 高亮）
     ## 无监督学习
       聚类 → 将相似数据分组
       降维 → 减少特征维度同时保留信息
     ## 模型评估
       准确率 → 正确预测占总预测的比例
       精确率 → 预测为正例中实际为正例的比例
       召回率 → 实际正例中被正确预测的比例 （Yellow 高亮）

4. 重新读取子树，确认：
   - 根节点是 H1 标题
   - 3 个 H2 章节都在
   - 每章下的知识点数量和内容正确
   - 闪卡方向（→）正确
```

**Chrome 验证**：
- ⬜ 根节点 "{prefix} 机器学习基础" 为 H1 大标题
- ⬜ 3 个 H2 章节标题存在
- ⬜ 监督学习下 3 个知识点、无监督学习下 2 个、模型评估下 3 个
- ⬜ 有箭头分隔符和 backText
- ⬜ "过拟合"和"召回率"节点有 Yellow 高亮

**注意**：高亮需要通过 edit_rem 单独设置（edit_tree 新增行不支持 highlightColor），subagent 需要：创建结构后 → read_rem 获取目标节点 → edit_rem 设置 highlightColor=Yellow。

---

### L2-02: 批量生成闪卡组

**task_description**:
```
帮用户做 8 张日语 N3 语法闪卡，涵盖所有闪卡类型。

1. 确认连接正常
2. 读取测试页面的子树
3. 在测试页面下创建以下闪卡（edit_tree）：

   {prefix} 日语 N3 语法 （H2 标题）

   a. 4 张概念定义（concept ↔ 双向）：
      ～ために ↔ 表示目的，"为了……" <!--type:concept-->
      ～ようにする ↔ 表示努力做到，"尽量……" <!--type:concept-->
      ～ことにする ↔ 表示决定做某事 <!--type:concept-->
      ～ことになる ↔ 表示（被）决定做某事 <!--type:concept-->

   b. 2 张正向问答（→）：
      「彼は医者になるために勉強しています」的语法点 → ～ために（表示目的）
      「毎日運動するようにしている」的语法点 → ～ようにする（表示习惯性努力）

   c. 2 张多行闪卡（↓ + 答案行）：
      ～ために的三个用法 ↓
        目的：試験に合格するために勉強する
        原因：風邪のために学校を休んだ
        利益：家族のために働く
      ～ようにする vs ～ことにする的区别 ↓
        ようにする：渐进的努力/习惯养成
        ことにする：明确的一次性决定
        共同点：都表示主观意愿

4. 重新读取子树确认：
   - 8 张闪卡都存在
   - 概念定义（前 4 张）是加粗的 concept 类型
   - 正向问答（第 5-6 张）有 → 方向
   - 多行闪卡（第 7-8 张）有 ↓ 方向，子行作为答案
5. 对任意 2 张概念定义闪卡执行 read_rem，验证 type=concept、practiceDirection=both、backText 内容正确
```

**Chrome 验证**：
- ⬜ 标题 "{prefix} 日语 N3 语法" 为 H2
- ⬜ 4 张概念定义加粗（concept），有 :: 分隔
- ⬜ 2 张正向问答有 >> 分隔
- ⬜ 2 张多行闪卡展开后有 3 个答案行
- ⬜ 总共 8 张闪卡 + 标题 = 9 个直接子节点

---

### L2-03: 批量格式化整理

**task_description**:
```
创建 5 个知识点后批量修改它们的属性。

1. 确认连接正常
2. 读取测试页面的子树
3. 创建 5 个节点（edit_tree）：
   {prefix} 线性代数
   {prefix} 微积分
   {prefix} 概率论
   {prefix} 离散数学
   {prefix} 复习清单

4. 重新读取子树，获取 5 个节点的 remId
5. 逐个读取（read_rem）+ 修改（edit_rem）：
   - "线性代数"：type=concept + highlightColor=Yellow
   - "微积分"：type=concept + highlightColor=Yellow
   - "概率论"：type=concept + highlightColor=Yellow
   - "离散数学"：fontSize=H1
   - "复习清单"：isTodo=true + todoStatus=Unfinished

6. 逐个 read_rem 确认所有属性已生效
```

**Chrome 验证**：
- ⬜ 前 3 个节点加粗（concept）+ 黄色高亮背景
- ⬜ "离散数学"为 H1 大标题
- ⬜ "复习清单"前面有未勾选复选框

---

### L2-04: 删除 + 重建子树

**task_description**:
```
创建一个 3 层结构，删除中间子树后重建不同内容。

1. 确认连接正常
2. 读取测试页面的子树
3. 创建以下 3 层结构（edit_tree）：

   {prefix} 编程语言
     Python
       动态类型
       解释执行
     Java
       静态类型
       编译执行
     Rust
       所有权系统
       零成本抽象

4. 读取子树确认 3 层结构完整（根 → 3 子 → 每子 2 孙 = 共 10 节点）
5. 删除 "Java" 整个子树（含 "静态类型" 和 "编译执行" 两个孙节点）
   注意：edit_tree 删除时必须同时删除父和子，不能留下孤儿节点
6. 读取子树确认 Java 子树已消失（剩 7 节点）
7. 在 Python 和 Rust 之间的位置（即 Rust 之前）新增：
   Go
     并发原生支持
     垃圾回收

   注意：因为不能在有子节点的 Rem 和其 children 之间插入，
   新节点应插在同级兄弟末尾（Rust 之后），然后如果需要调整顺序则重排

8. 读取最终结构确认：根下有 Python、Go、Rust（或 Python、Rust、Go）
```

**Chrome 验证**：
- ⬜ "Java" 子树已消失
- ⬜ "Go" 节点存在且有 2 个子节点
- ⬜ 总共 10 个节点（根 + 3 子 + 每子 2 孙）

---

## L3 多步工作流

> 多步骤组合链路，模拟真实的知识整理流程。

### L3-01: 搜索定位 → 整理 → 验证

**task_description**:
```
搜索已有内容，整理为结构化知识树。

1. 确认连接正常
2. 读取测试页面的子树
3. 先创建一些"原始笔记"作为搜索素材（edit_tree）：
   {prefix} raw-uniquetoken-ml-001 线性回归是最基本的回归模型
   {prefix} raw-uniquetoken-ml-002 逻辑回归用于二分类问题
   {prefix} raw-uniquetoken-ml-003 决策树通过特征分裂做预测

4. 搜索关键词 "uniquetoken-ml"（search）
5. 确认搜到 3 条结果

6. 创建一个新的结构化文档来整理这些知识（edit_tree）：
   {prefix} 机器学习模型整理 <!--doc-->
     回归模型 ↔ 预测连续值的模型 <!--type:concept-->
       线性回归 → 最基本的回归模型，假设线性关系 <!--type:descriptor-->
     分类模型 ↔ 预测离散标签的模型 <!--type:concept-->
       逻辑回归 → 用于二分类问题 <!--type:descriptor-->
     树模型 ↔ 基于特征分裂的模型 <!--type:concept-->
       决策树 → 通过特征分裂做预测 <!--type:descriptor-->

7. 读取新创建的文档子树，验证：
   - 是 Document（isDocument=true）
   - 3 个概念（concept）都有双向闪卡
   - 3 个描述（descriptor）都有正向闪卡
   - CDF 结构正确（descriptor 是 concept 的子节点）

8. 用 read_rem 抽查 2 个节点，确认 type 和 practiceDirection 正确
```

**Chrome 验证**：
- ⬜ "{prefix} 机器学习模型整理" 是可独立打开的文档页面
- ⬜ 3 个概念加粗（concept），有 :: 双向分隔
- ⬜ 3 个描述有 ;; 或 >> 正向分隔
- ⬜ 层级正确：概念 → 描述（descriptor 在 concept 下）

---

### L3-02: 知识体系构建（CDF + Portal）

> ⚠️ **不可并行**：此用例涉及 16+ 节点创建 + Portal 创建，高频操作可能导致 Plugin 连接中断。必须单独串行执行。

**task_description**:
```
从零搭建"数据结构与算法"知识树，使用 CDF 格式 + Portal 引用。

1. 确认连接正常
2. 读取测试页面子树

3. 第一步：创建 5 个核心概念 + 描述属性（edit_tree）

   {prefix} 数据结构与算法 （H1 标题）
     数组 ↔ 连续内存存储的线性结构 <!--type:concept-->
       时间复杂度 → 访问 O(1)，插入/删除 O(n) <!--type:descriptor-->
       使用场景 → 需要快速随机访问的场景 <!--type:descriptor-->
     链表 ↔ 非连续内存的链式结构 <!--type:concept-->
       时间复杂度 → 访问 O(n)，插入/删除 O(1) <!--type:descriptor-->
       使用场景 → 频繁插入删除的场景 <!--type:descriptor-->
     栈 ↔ 后进先出（LIFO）的线性结构 <!--type:concept-->
       实现方式 → 数组或链表均可实现 <!--type:descriptor-->
       使用场景 → 函数调用栈、括号匹配、撤销操作 <!--type:descriptor-->
     队列 ↔ 先进先出（FIFO）的线性结构 <!--type:concept-->
       实现方式 → 数组（循环队列）或链表 <!--type:descriptor-->
       使用场景 → 任务调度、BFS、消息队列 <!--type:descriptor-->
     树 ↔ 非线性层次结构 <!--type:concept-->
       二叉搜索树 → 左小右大的二叉树 <!--type:descriptor-->
       使用场景 → 层次数据、搜索、排序 <!--type:descriptor-->

4. 读取子树获取"数组"和"链表"的 remId

5. 第二步：创建 Portal 对比视图（edit_tree）
   在"数据结构与算法"的子节点末尾新增一个 Portal，引用"数组"和"链表"：
   <!--portal refs:{数组remId},{链表remId}-->

6. 读取最终结构确认：
   - 5 个 concept 都加粗
   - 10 个 descriptor 都有正向闪卡
   - Portal 存在且引用了数组和链表
   - 总节点数正确（1 根 + 5 概念 + 10 描述 + 1 Portal = 17）
```

**Chrome 验证**：
- ⬜ H1 标题 "{prefix} 数据结构与算法"
- ⬜ 5 个概念加粗（concept），有 :: 双向分隔
- ⬜ 10 个描述属性有正向分隔
- ⬜ Portal 区域存在（紫色边框），显示数组和链表内容
- ⬜ 总共约 17 个节点

---

### L3-03: 移动 + 重排 + 重组

**task_description**:
```
创建 10 个平级节点后按规则重组。

1. 确认连接正常
2. 读取测试页面子树
3. 创建 10 个平级节点（edit_tree）：
   {prefix} A
   {prefix} B
   {prefix} C
   {prefix} D
   {prefix} E
   {prefix} F
   {prefix} G
   {prefix} H
   {prefix} I
   {prefix} J

4. 读取子树获取所有 remId

5. 重组操作（分多次 edit_tree）：

   a. 先在末尾新增两个分组父节点：
      {prefix} 第一组
      {prefix} 第二组

   b. 读取子树获取新节点的 remId

   c. 将 A、B、C 移到"第一组"下面（通过调整缩进）
   d. 将 D、E、F 移到"第二组"下面

   e. 将 G-J 重排为 J、G、H、I 的顺序

6. 读取最终结构确认：
   - "第一组"下有 A、B、C
   - "第二组"下有 D、E、F
   - 顶层剩余节点顺序为 J、G、H、I、第一组、第二组（或合理的最终顺序）
```

**Chrome 验证**：
- ⬜ "第一组"展开后有 A、B、C 三个子节点
- ⬜ "第二组"展开后有 D、E、F 三个子节点
- ⬜ G-J 重排后顺序变化
- ⬜ 总共 12 个节点（10 原始 + 2 分组）

---

### L3-04: 富文本标注修改 + read-rem-in-tree 验证

> ⚠️ **不可并行**：此用例涉及多次 edit_rem + read_rem_in_tree，高频操作。必须单独串行执行。

**task_description**:
```

在测试页面下完成以下任务：

阶段 1：创建带初始标注的节点

1. 确认连接正常
2. 读取测试页面子树
3. 创建以下结构（edit_tree）：

   {prefix} 化学笔记
     化学键 ↔ 原子间的强相互作用 <!--type:concept-->
       共价键 → 共用电子对形成的化学键 <!--type:descriptor-->
       离子键 → 阴阳离子间的静电引力 <!--type:descriptor-->
       金属键 → 金属阳离子与自由电子间的作用 <!--type:descriptor-->
     化学反应 ↔ 物质转变为新物质的过程 <!--type:concept-->
       氧化还原 → 电子转移的反应 <!--type:descriptor-->
       酸碱反应 → 质子转移的反应 <!--type:descriptor-->
       速率因素 ↓ <!--type:descriptor-->
         温度
         浓度
         催化剂
     溶液 ↔ 均匀混合物 <!--type:concept-->
       浓度 → 溶质与溶液的比值 <!--type:descriptor-->
       溶解度 → 一定温度下饱和溶液中溶质的量 <!--type:descriptor-->

4. 使用 read_rem_in_tree 一次性读取全部节点（maxNodes=30）
5. 对以下节点施加初始标注（edit_rem）：
   - "化学键" concept：highlightColor = "Yellow"
   - "共价键" descriptor 的 backText：["共用", {"h": 3, "i": "m", "text": "电子对"}, "形成的化学键"]
   - "化学反应" concept：highlightColor = "Blue"
   - "氧化还原" descriptor 的 backText：[{"b": true, "i": "m", "text": "电子转移"}, "的反应"]

阶段 2：修改已有标注

6. 再次使用 read_rem_in_tree 读取最新状态
7. 修改标注（edit_rem）：
   a. "化学键"：改 highlightColor 从 Yellow 到 Red
   b. "共价键"：给 backText 中"电子对"额外加粗（h + b 组合）→
      ["共用", {"b": true, "h": 3, "i": "m", "text": "电子对"}, "形成的化学键"]
   c. "氧化还原"：把 backText 改为纯文本（移除粗体）→ ["电子转移的反应"]
   d. "溶液" concept：新增 highlightColor = "Green"
   e. "浓度" descriptor 的 backText 改为：
      [{"i": "m", "text": "溶质", "u": true}, "与", {"i": "m", "text": "溶液", "u": true}, "的比值"]

阶段 3：验证修改

8. 使用 read_rem_in_tree 读取验证
9. 从 remObjects 逐项验证：
   - "化学键" highlightColor = "Red"（从 Yellow 改来）
   - "共价键" backText 中"电子对"同时有 h:3 和 b:true
   - "氧化还原" backText 是纯字符串，无格式对象
   - "溶液" highlightColor = "Green"（新增）
   - "浓度" backText 中"溶质"和"溶液"有 u:true
```

**Chrome 验证**：
- ⬜ "化学键" 红色整行高亮（从黄色改来）
- ⬜ "共价键" backText 中"电子对"黄色荧光+粗体
- ⬜ "氧化还原" 纯文本，无格式
- ⬜ "溶液" 绿色整行高亮
- ⬜ "浓度" backText 中"溶质"和"溶液"有下划线

**断言**：
- [ ] read_rem_in_tree 成功返回 outline + remObjects
- [ ] edit_rem 修改 highlightColor 生效（Yellow→Red）
- [ ] edit_rem 修改 RichText（添加 b+h 组合）生效
- [ ] edit_rem 移除格式（还原纯文本）生效
- [ ] edit_rem 新增 highlightColor 生效
- [ ] edit_rem 添加下划线（u:true）生效
- [ ] 最终 read_rem_in_tree 返回的 remObjects 与预期一致

**工具选择检查**：
- [ ] 阶段 1 使用 read_rem_in_tree（而非 read_tree + N×read_rem）
- [ ] 阶段 2 使用 read_rem_in_tree 重新读取（而非逐个 read_rem）
- [ ] edit_rem 前未冗余调用 read_rem（缓存已由 read_rem_in_tree 建立）

---

## L4 大规模真实任务

> 模拟用户让 AI 做的大规模知识整理任务。

### L4-01: 10 张多行闪卡

> ⚠️ **不可并行**：此用例创建 45+ 节点，高频操作。必须单独串行执行。

**task_description**:
```
帮用户把 10 个计算机科学概念做成完整的 CDF 闪卡组。

1. 确认连接正常
2. 读取测试页面子树

3. 创建以下完整知识结构（edit_tree，可分多次）：

   {prefix} 计算机科学核心概念 （H1 标题）

     操作系统 ↔ 管理计算机硬件与软件资源的系统软件 <!--type:concept-->
       核心功能 ↓ <!--type:descriptor-->
         进程管理与调度
         内存分配与回收
         文件系统管理

     编译器 ↔ 将高级语言转换为机器码的程序 <!--type:concept-->
       编译阶段 ↓ <!--type:descriptor-->
         词法分析：源码→Token
         语法分析：Token→AST
         代码生成：AST→目标代码

     数据库 ↔ 有组织地存储和管理数据的系统 <!--type:concept-->
       ACID 特性 ↓ <!--type:descriptor-->
         原子性（Atomicity）
         一致性（Consistency）
         隔离性（Isolation）
         持久性（Durability）

     计算机网络 ↔ 互连的计算设备集合 <!--type:concept-->
       TCP/IP 四层模型 ↓ <!--type:descriptor-->
         应用层
         传输层
         网络层
         链路层

     算法复杂度 ↔ 衡量算法效率的数学工具 <!--type:concept-->
       常见复杂度 ↓ <!--type:descriptor-->
         O(1) 常数时间
         O(log n) 对数时间
         O(n) 线性时间
         O(n²) 平方时间

     密码学 ↔ 研究信息加密与解密的学科 <!--type:concept-->
       基本分类 ↓ <!--type:descriptor-->
         对称加密：AES、DES
         非对称加密：RSA、ECC
         哈希函数：SHA-256、MD5

     人工智能 ↔ 模拟人类智能的计算机系统 <!--type:concept-->
       主要分支 ↓ <!--type:descriptor-->
         机器学习
         自然语言处理
         计算机视觉

     分布式系统 ↔ 多个独立计算机协同工作的系统 <!--type:concept-->
       核心挑战 ↓ <!--type:descriptor-->
         一致性
         可用性
         分区容错性（CAP 定理）

     软件工程 ↔ 系统化开发和维护软件的工程学科 <!--type:concept-->
       开发方法 ↓ <!--type:descriptor-->
         瀑布模型
         敏捷开发
         DevOps

     计算理论 ↔ 研究计算本质和极限的数学理论 <!--type:concept-->
       核心概念 ↓ <!--type:descriptor-->
         图灵机
         可计算性
         NP 完全问题

4. 读取完整子树确认结构

5. 逐个 read_rem 验证至少 5 个 concept 节点：
   - type=concept
   - practiceDirection=both
   - backText 内容正确

6. 逐个 read_rem 验证至少 5 个 descriptor 节点：
   - type=descriptor
   - practiceDirection=forward
   - 子节点（答案行）存在
```

**Chrome 验证**：
- ⬜ H1 标题存在
- ⬜ 10 个概念加粗（concept），有 :: 双向分隔
- ⬜ 10 个描述属性有多行答案（展开后可见）
- ⬜ 每个多行闪卡有 3-4 个答案行
- ⬜ 总共约 45+ 节点

---

### L4-02: 完整课程笔记

> ⚠️ **不可并行**：此用例创建 20+ 节点 + 多次 edit_rem。必须单独串行执行。

**task_description**:
```
创建"线性代数"课程笔记——3 个章节文档，每章含概念和描述，混合格式属性。

1. 确认连接正常
2. 读取测试页面子树

3. 创建课程根节点和 3 个章节（edit_tree）：

   {prefix} 线性代数 （H1 标题）

     第一章 向量空间 <!--doc-->
       向量空间 ↔ 满足封闭性和线性组合的集合 <!--type:concept-->
         维度 → 基向量的个数 <!--type:descriptor-->
         基 → 线性无关且能张成空间的向量组 <!--type:descriptor-->
         线性无关 → 不存在非零系数使线性组合为零 <!--type:descriptor-->
       子空间 ↔ 向量空间中满足封闭性的子集 <!--type:concept-->
         零空间 → Ax=0 的解集 <!--type:descriptor-->

     第二章 线性变换 <!--doc-->
       线性变换 ↔ 保持加法和标量乘法的映射 <!--type:concept-->
         矩阵表示 → 每个线性变换对应一个矩阵 <!--type:descriptor-->
         核 → 映射到零向量的原像集合 <!--type:descriptor-->
         像 → 值域，所有输出的集合 <!--type:descriptor-->
       特征值 ↔ 使 Av=λv 成立的标量 λ <!--type:concept-->
         特征向量 → 对应特征值的非零向量 v <!--type:descriptor-->

     第三章 内积空间 <!--doc-->
       内积 ↔ 满足正定性/对称性/线性性的二元函数 <!--type:concept-->
         范数 → 由内积诱导的长度 ‖v‖=√⟨v,v⟩ <!--type:descriptor-->
         正交 → 内积为零的两个向量 <!--type:descriptor-->
       正交投影 ↔ 向子空间投影的线性变换 <!--type:concept-->
         最小二乘 → 通过正交投影求近似解 <!--type:descriptor-->

4. 设置格式属性（read_rem + edit_rem）：
   - 对"向量空间"（概念）和"特征值"（概念）设 highlightColor=Green（简单）
   - 对"线性变换"（概念）设 highlightColor=Yellow（中等）
   - 对"内积"（概念）设 highlightColor=Red（困难）
   - 选一个 descriptor 设 isTodo=true + todoStatus=Unfinished（待复习标记）

5. 读取完整子树确认：
   - 3 个章节是 Document（isDocument=true）
   - CDF 结构正确
   - 格式属性生效
```

**Chrome 验证**：
- ⬜ H1 标题 "{prefix} 线性代数"
- ⬜ 3 个章节是可独立打开的文档页面
- ⬜ 概念加粗，描述有正向分隔
- ⬜ 高亮颜色正确（Green/Yellow/Red）
- ⬜ 有一个节点带待办复选框
- ⬜ 总共约 20+ 节点

---

### L4-03: 大规模创建 + 批量富文本标注 + 读取验证

> ⚠️ **不可并行**：此用例创建 35+ 节点 + 多次 edit_rem + 2 次 read_rem_in_tree。必须单独串行执行。

**task_description**:
```
在测试页面下完成以下任务：

阶段 1：创建 30+ 节点知识结构

1. 确认连接正常（health 三层就绪）
2. 读取测试页面子树（read_tree）
3. 在测试页面下创建以下结构（edit_tree，可分多次）：

   # {prefix} 生物学笔记
     ## 细胞生物学
       细胞膜 ↔ 选择性透过的磷脂双分子层 <!--type:concept-->
         功能 → 保护细胞、控制物质进出 <!--type:descriptor-->
         组成 → 磷脂、蛋白质、糖类 <!--type:descriptor-->
       细胞核 ↔ 含遗传物质的细胞控制中心 <!--type:concept-->
         功能 → 储存 DNA、控制基因表达 <!--type:descriptor-->
         结构 → 核膜、核仁、染色质 <!--type:descriptor-->
       线粒体 ↔ 细胞的能量工厂 <!--type:concept-->
         功能 → 有氧呼吸产生 ATP <!--type:descriptor-->
         特点 → 含自身 DNA，双层膜结构 <!--type:descriptor-->
     ## 遗传学
       DNA ↔ 脱氧核糖核酸，遗传信息载体 <!--type:concept-->
         结构 → 双螺旋，碱基配对 A-T, G-C <!--type:descriptor-->
         复制 → 半保留复制 <!--type:descriptor-->
       RNA ↔ 核糖核酸，参与蛋白质合成 <!--type:concept-->
         类型 ↓ <!--type:descriptor-->
           mRNA：信使 RNA
           tRNA：转运 RNA
           rRNA：核糖体 RNA
       基因表达 ↔ 从 DNA 到蛋白质的过程 <!--type:concept-->
         转录 → DNA → mRNA <!--type:descriptor-->
         翻译 → mRNA → 蛋白质 <!--type:descriptor-->
     ## 生态学
       生态系统 ↔ 生物群落与无机环境的统一体 <!--type:concept-->
         组成 → 生产者、消费者、分解者、无机环境 <!--type:descriptor-->
         能量流动 → 单向流动，逐级递减 <!--type:descriptor-->
       食物链 ↔ 生物之间的营养关系 <!--type:concept-->
         规律 → 能量沿食物链传递效率 10%-20% <!--type:descriptor-->
       碳循环 ↔ 碳元素在生态系统中的循环 <!--type:concept-->
         路径 ↓ <!--type:descriptor-->
           光合作用固定 CO₂
           呼吸作用释放 CO₂
           分解者分解有机物

4. 读取子树确认结构完整（约 35+ 节点）

阶段 2：批量富文本标注（课本划重点）

5. 使用 read_rem_in_tree 读取整棵子树（maxNodes 设为 50），一次获取所有节点的 RemObject

6. 从 remObjects 中找到以下节点的 remId，然后逐个 edit_rem 设置格式：

   a. 行级高亮（整行背景色）：
      - "细胞膜" 节点：highlightColor = "Yellow"
      - "DNA" 节点：highlightColor = "Red"
      - "生态系统" 节点：highlightColor = "Green"

   b. 行内荧光标注（修改 backText 字段中的 RichText）：
      - "细胞核"的 "功能" descriptor：把 backText 改为
        [{"h": 3, "i": "m", "text": "储存 DNA"}, "、控制基因表达"]
      - "基因表达"的 "转录" descriptor：把 backText 改为
        ["DNA → ", {"b": true, "h": 1, "i": "m", "text": "mRNA"}]

   c. 粗体 + 下划线组合：
      - "线粒体"的 "功能" descriptor：把 backText 改为
        [{"b": true, "i": "m", "text": "有氧呼吸"}, "产生 ", {"i": "m", "text": "ATP", "u": true}]

   d. 文字颜色：
      - "食物链"的 "规律" descriptor：把 backText 改为
        ["能量沿食物链传递效率 ", {"i": "m", "tc": 1, "text": "10%-20%"}]

阶段 3：读取验证

7. 再次使用 read_rem_in_tree 读取整棵子树（maxNodes=50）
8. 从返回的 remObjects 中验证：
   - "细胞膜" 节点的 highlightColor 是否为 "Yellow"
   - "DNA" 节点的 highlightColor 是否为 "Red"
   - "生态系统" 节点的 highlightColor 是否为 "Green"
   - 被修改 backText 的节点，backText 字段是否包含预期的格式化对象（h、b、u、tc 字段）

9. 报告所有验证结果
```

**Chrome 验证**：
- ⬜ 35+ 节点内容正确
- ⬜ H1 根 → 3 个 H2 章节 → concept → descriptor 层级正确
- ⬜ concept 加粗，descriptor 正常字重
- ⬜ 细胞膜黄色、DNA 红色、生态系统绿色整行高亮
- ⬜ "储存 DNA" 黄色荧光底色
- ⬜ "mRNA" 粗体+红色荧光
- ⬜ "有氧呼吸"粗体，"ATP"下划线
- ⬜ "10%-20%" 红色文字

**断言**：
- [ ] edit_tree 成功创建 35+ 节点结构
- [ ] read_rem_in_tree 成功返回全部节点的 remObjects（nodeCount ≥ 35）
- [ ] edit_rem 设置 highlightColor 生效（3 个节点）
- [ ] edit_rem 修改 RichText 行内高亮（h 字段）生效
- [ ] edit_rem 修改 RichText 粗体+下划线组合生效
- [ ] edit_rem 修改 RichText 文字颜色（tc 字段）生效
- [ ] 最终 read_rem_in_tree 返回的 remObjects 中所有标注与预期一致

**工具选择检查**：
- [ ] 阶段 2 使用 read_rem_in_tree（而非 read_tree + N×read_rem）
- [ ] edit_rem 前未冗余调用 read_rem

---

## L5 极端边界 + 错误恢复

> 测试防线触发、大树省略、并发检测等边界场景。

### L5-01: 防线触发 + 恢复

**task_description**:
```
故意触发各种防线错误，理解错误信息，然后正确恢复。

1. 确认连接正常
2. 读取测试页面的子树
3. 创建节点：{prefix} 防线测试

独立测试每个场景：

场景 A — 未 read 就 edit：
  a1. 对一个已知 remId 直接尝试 edit_rem（不先 read_rem）
  a2. 观察错误信息（应提示"has not been read yet"）
  a3. 先 read_rem，然后正确 edit_rem
  a4. 确认修改成功

场景 B — 非法枚举值：
  b1. read_rem 某个节点
  b2. 尝试将 type 设为 "invalid"
  b3. 观察错误信息（应提示非法值）
  b4. 用正确值 "concept" 重试
  b5. 确认修改成功

场景 C — edit_tree 修改行内容（content_modified 防线）：
  c1. read_tree 测试页面
  c2. 尝试通过 edit_tree 修改已有行的文字内容
  c3. 观察错误信息（应提示 content_modified）
  c4. 改用 edit_rem 修改文字
  c5. 确认修改成功

报告每个场景的：错误信息全文、恢复操作、最终结果。
```

**验证**：subagent 能理解错误信息并正确恢复。

**断言**：
- [ ] 场景 A：触发"未 read"错误 → read 后成功编辑
- [ ] 场景 B：触发"非法值"错误 → 正确值重试成功
- [ ] 场景 C：触发 content_modified → 改用 edit_rem 成功

---

### L5-02: 大树省略

**task_description**:
```
测试 read_tree 的 maxSiblings 省略行为。

1. 确认连接正常
2. 读取测试页面子树
3. 创建父节点：{prefix} 大树测试
4. 在父节点下创建 25 个子节点（edit_tree，可能需要分多次）：
   {prefix} 子节点-01 到 {prefix} 子节点-25
   提示：每次 edit_tree 创建一批，在已有最后一个兄弟之后追加新行

5. 用默认参数读取父节点的子树（read_tree）
   确认输出中包含省略占位符（<!--...elided ... siblings-->）
   记录省略了多少个节点

6. 用 maxSiblings=30 读取同一棵子树
   确认所有 25 个子节点都完整可见，无省略

7. 在子节点末尾新增一个节点（edit_tree）：
   {prefix} 子节点-26
   确认操作在省略存在的情况下仍然成功

8. 最终用 maxSiblings=30 读取确认 26 个子节点全部存在
```

**Chrome 验证**：
- ⬜ 父节点下有 26 个子节点（展开确认）

---

### L5-03: 并发检测

> ⚠️ **不可并行**：此用例需要主 agent 在中间修改数据，且测试并发防线。必须单独串行执行。

**task_description**:
```
测试写前变更检测（第二道防线）。

1. 确认连接正常
2. 读取测试页面子树
3. 创建节点：{prefix} 并发测试目标
4. 读取子树（read_tree），缓存状态 A

5. ⚠️ 此步骤需要主 agent 协助：
   主 agent 直接用 MCP 工具修改"{prefix} 并发测试目标"的文本为"{prefix} 已被外部修改"
   （模拟另一个用户/进程修改了数据）

6. subagent 尝试用 edit_tree 在"{prefix} 并发测试目标"同级新增节点
   → 应该成功（因为没有修改被改动的那一行）

7. 但如果 subagent 尝试用 edit_tree 删除或移动"{prefix} 并发测试目标"
   → 可能触发并发检测（因为行内容已变化，oldStr 不匹配）

8. 触发错误后，重新 read_tree 获取最新状态，再次操作

报告：并发检测是否触发、错误信息内容、重新 read 后是否恢复成功
```

**验证**：并发检测机制正常工作。

**注意**：此用例需要主 agent 和 subagent 配合——主 agent 在 Step 5 直接修改数据，subagent 在 Step 6-8 尝试操作。实际执行时可能需要拆成两部分。

---

## 工具覆盖检查

| 工具/命令 | 出现的用例 |
|:----------|:-----------|
| health | L1-01, L1-02（及所有用例第 1 步） |
| connect / disconnect | L1-01 |
| read_globe | L1-02 |
| read_context | L1-02 |
| search | L1-02, L3-01 |
| read_tree | L2-01~04, L3-01~03, L4-01~02, L5-01~03 |
| edit_tree | L2-01~02, L2-04, L3-01~03, L4-01~02, L5-01~03 |
| read_rem | L2-02~03, L3-01, L4-01~02, L5-01 |
| edit_rem | L2-03, L3-04, L4-02, L4-03, L5-01 |
| read_rem_in_tree | L3-04, L4-03 |
| addon | （独立管理命令，按需手动测） |
| setup / clean | （破坏性命令，不适合自动化） |

---

## 维护指南

### 新增回归用例

当新功能稳定后，把它的测试用例加到对应级别里：

1. 确定属于哪个级别（基础 → 复杂）
2. 编写 task_description（参照已有格式）
3. 列出 Chrome 验证点
4. 加到对应级别下，编号递增

### 退役用例

功能被移除时，把对应用例标记为 `[RETIRED]` 并注明原因，而非直接删除。

### {prefix} 替换

执行时把 `{prefix}` 替换为带接口区分的前缀：

| 接口 | 格式 | 示例 |
|:-----|:-----|:-----|
| MCP | `[日期-级别编号]` | `[0317-L2-01]` |
| Skill | `[日期-级别编号s]` | `[0317-L2-01s]` |

Skill 接口加 `s` 后缀，避免两个 subagent 在同一页面下创建的数据混淆。

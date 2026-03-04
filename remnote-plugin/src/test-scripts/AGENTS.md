# test-scripts — RemNote Plugin SDK 探测脚本

## 这是什么

一次性探测脚本，用于在 RemNote Plugin 运行时环境中验证 SDK 行为。
脚本运行后将结果写入 RemNote 知识库（"mcp 测试" 文档下），供人工或 CLI 读取。

## 为什么在 src/ 下

这些脚本**必须**在 RemNote Plugin 沙箱内执行（依赖 `plugin: ReactRNPlugin` 对象调用 SDK API），
所以必须被 webpack 打包。但它们**不是生产代码**——数据收集完毕后，应从 `widgets/index.tsx` 中注释掉 import 和调用，避免打包进生产 bundle。

## 当前状态

所有脚本已完成数据收集，`widgets/index.tsx` 中的 import 和调用**已注释掉**。

## 运行机制

1. 脚本通过 `widgets/index.tsx` 的 `onActivate()` 调用
2. 每个脚本用 `plugin.storage.getSession(key)` 做防重跑检查（同一会话只跑一次）
3. 执行流程：找到 "mcp 测试" 文档 → 创建隔离 wrapper Rem → 逐项测试 → 结果写入子 Rem
4. 刷新 RemNote 页面即触发运行（session storage 随页面刷新重置）

## 如何重跑

1. 在 `widgets/index.tsx` 中取消对应 import 和调用的注释
2. 启动 dev server：`cd remnote-plugin && npm run dev`
3. 刷新 RemNote 页面

## 脚本清单

| 文件 | 探测内容 | 产出 |
|:--|:--|:--|
| `test-actions.ts` | Rem CRUD 操作（create/remove/merge/collapse 等） | 各操作成功/失败记录 |
| `test-rw-fields.ts` | Rem 字段读写（highlightColor、backText 等） | 字段读写兼容性 |
| `test-richtext-builder.ts` | RichText Builder API 输出结构（video/audio） | Builder 产出的 JSON 对照 |
| `test-richtext-remaining.ts` | RichText 剩余未测字段（cId、qId、block、title、i:"g" 等） | 各字段写入+回读结果 |
| `test-richtext-matrix.ts` | 7 种元素类型 × 12 种格式化字段交叉兼容性 | 84 格矩阵（72✅ 12❌ 0⚠️） |

## 编写新脚本的约定

- 导出一个 `async function run...(plugin: ReactRNPlugin): Promise<void>`
- 用 `plugin.storage.getSession/setSession` 做防重跑
- 创建 wrapper Rem 隔离测试数据，避免污染其他测试
- 每个测试项单独 try/catch，不要因一项失败中断全部
- 最终汇总写入一个 JSON Rem，方便 CLI `read-rem` 机器读取

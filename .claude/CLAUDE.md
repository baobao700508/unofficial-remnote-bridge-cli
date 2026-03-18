# CLAUDE.md

本文件为 Claude Code 在此仓库中工作提供指导。

---

## Headless 红线

- **禁止使用 headless 模式连接 RemNote**
- `connect` 时**禁止**传 `headless=true`（MCP）或 `--headless`（CLI）
- 必须使用标准模式：`connect()`（不带参数），让用户在自己的浏览器中加载 Plugin
- headless Chrome 是后台独立实例，Claude in Chrome 看不到它——截图验收、界面确认全部失效
- 此规则适用于所有场景：测试、日常操作、调试，无例外
- 标准模式 connect 后需要刷新 RemNote 页面让 Plugin 重连——**用 Claude in Chrome 自己去刷新**，不要叫用户操作

---

## Flashcard 红线

- **本项目目前不操控 Flashcard / Card**
- Card 是 RemNote 根据 Rem 对象自动生成的，不需要我们干预
- Card 由 RemNote 根据 Rem 对象的属性（text、backText、RichText 内部标记、children 关系等）自动生成，具体规则由 RemNote 内部决定
- SDK 中 Card 相关的 API（`getCards()`、`CardNamespace` 等）不在我们的使用范围内
- RemObject 定义中不包含任何闪卡/Card 字段


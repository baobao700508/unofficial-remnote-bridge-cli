# CLAUDE.md

本文件为 Claude Code 在此仓库中工作提供指导。

---

## Flashcard 红线

- **本项目目前不操控 Flashcard / Card**
- Card 是 RemNote 根据 Rem 对象自动生成的，不需要我们干预
- Card 由 RemNote 根据 Rem 对象的属性（text、backText、RichText 内部标记、children 关系等）自动生成，具体规则由 RemNote 内部决定
- SDK 中 Card 相关的 API（`getCards()`、`CardNamespace` 等）不在我们的使用范围内
- RemObject 定义中不包含任何闪卡/Card 字段


/**
 * Services 层 — 业务操作（与 CLI 命令同态命名）
 *
 * 每个文件对应一个 CLI 命令，封装完整的 RemNote SDK 操作链。
 * 由 bridge 层调用，不直接暴露给 widgets。
 *
 * 依赖方向：services → utils（单向）
 *
 * 待实现：
 * - read-note.ts    → readNote()
 * - create-note.ts  → createNote()
 * - update-note.ts  → updateNote()
 * - search.ts       → search()
 * - search-by-tag.ts → searchByTag()
 * - append-journal.ts → appendJournal()
 */

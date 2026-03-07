/**
 * write-rem-fields service — 按字段写入 SDK
 *
 * 内部 action（daemon 编排用），无对应 CLI 命令。
 * 接收 { remId, changes } payload，按顺序逐字段调用 SDK setter。
 * 首个失败即终止，返回已成功和失败的字段信息。
 *
 * 同态命名例外：write_rem_fields (action) → write-rem-fields.ts (文件) → writeRemFields (函数)
 * 原因：edit-rem CLI 命令的编排逻辑在 daemon 层，Plugin 只负责原子写入。
 */

import type { ReactRNPlugin, PluginRem as Rem, RichTextInterface } from '@remnote/plugin-sdk';

export interface WriteRemFieldsPayload {
  remId: string;
  changes: Record<string, unknown>;
}

export interface WriteRemFieldsResult {
  applied: string[];
  failed?: { field: string; error: string };
}

/**
 * 逐字段写入 SDK。
 *
 * @throws Error — Rem 不存在时抛 "Rem not found"
 */
export async function writeRemFields(
  plugin: ReactRNPlugin,
  payload: WriteRemFieldsPayload,
): Promise<WriteRemFieldsResult> {
  const rem = await plugin.rem.findOne(payload.remId);
  if (!rem) {
    throw new Error(`Rem not found: ${payload.remId}`);
  }

  const applied: string[] = [];
  const changes = payload.changes;

  // parent 和 positionAmongstSiblings 联动处理
  // 如果两者都在 changes 中，合并为一次 setParent 调用
  const hasParent = 'parent' in changes;
  const hasPosition = 'positionAmongstSiblings' in changes;

  for (const field of Object.keys(changes)) {
    // 跳过 positionAmongstSiblings（已与 parent 合并处理）
    if (field === 'positionAmongstSiblings') {
      continue;
    }

    try {
      await applyField(rem, plugin, field, changes[field], {
        // 当 parent 变更时，附带 position
        position: field === 'parent' && hasPosition
          ? changes.positionAmongstSiblings as number | undefined
          : undefined,
      });
      applied.push(field);
      // 如果 parent 变更时附带了 position，也标记 position 已 applied
      if (field === 'parent' && hasPosition) {
        applied.push('positionAmongstSiblings');
      }
    } catch (err) {
      return {
        applied,
        failed: {
          field,
          error: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  // 如果只有 positionAmongstSiblings 没有 parent，单独处理
  if (hasPosition && !hasParent) {
    try {
      const parent = rem.parent;
      if (parent) {
        await rem.setParent(parent, changes.positionAmongstSiblings as number);
      }
      applied.push('positionAmongstSiblings');
    } catch (err) {
      return {
        applied,
        failed: {
          field: 'positionAmongstSiblings',
          error: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  return { applied };
}

// ── 字段 → SDK setter 映射 ──

async function applyField(
  rem: Rem,
  plugin: ReactRNPlugin,
  field: string,
  value: unknown,
  opts: { position?: number | undefined },
): Promise<void> {
  // 值来自 JSON 反序列化，类型为 unknown，需要显式转型到 SDK 期望的字面量/接口类型
  switch (field) {
    // 内容
    case 'text':
      await rem.setText(value as RichTextInterface);
      break;
    case 'backText':
      if (value === null) {
        await rem.setBackText([]);
      } else if (typeof value === 'string') {
        // 从 edit-tree 箭头分隔符解析出的 backText 是纯文本字符串，
        // 需要包装为 RichText 数组才能被 SDK 接受
        await rem.setBackText([value]);
      } else {
        await rem.setBackText(value as RichTextInterface);
      }
      break;

    // 类型系统
    case 'type':
      await rem.setType(remTypeStringToEnum(value as string) as any);
      break;
    case 'isDocument':
      await rem.setIsDocument(value as boolean);
      break;

    // 结构
    case 'parent':
      await rem.setParent(value as string, opts.position);
      break;

    // 格式 / 显示
    case 'fontSize':
      await rem.setFontSize(value === null ? undefined : value as 'H1' | 'H2' | 'H3');
      break;
    case 'highlightColor':
      if (value === null) {
        // setHighlightColor(null) 被 SDK 拒绝，通过 removePowerup('h') 从底层移除高亮 Tag
        await rem.removePowerup('h');
      } else {
        await rem.setHighlightColor(value as 'Red' | 'Orange' | 'Yellow' | 'Green' | 'Blue' | 'Purple');
      }
      break;

    // 状态标记
    case 'isTodo':
      await rem.setIsTodo(value as boolean);
      break;
    case 'todoStatus':
      if (value !== null) {
        await rem.setTodoStatus(value as 'Finished' | 'Unfinished');
      }
      // null → 跳过：todoStatus=null 的语义是"非 todo"，应通过 isTodo=false 实现
      break;
    case 'isCode':
      await rem.setIsCode(value as boolean);
      break;
    case 'isQuote':
      await rem.setIsQuote(value as boolean);
      break;
    case 'isListItem':
      await rem.setIsListItem(value as boolean);
      break;
    case 'isCardItem':
      await rem.setIsCardItem(value as boolean);
      break;
    case 'isSlot':
      await rem.setIsSlot(value as boolean);
      break;
    case 'isProperty':
      await rem.setIsProperty(value as boolean);
      break;

    // 练习设置
    case 'enablePractice':
      await rem.setEnablePractice(value as boolean);
      break;
    case 'practiceDirection':
      await rem.setPracticeDirection(value as 'forward' | 'backward' | 'both' | 'none');
      break;

    // 关联 — tags（diff based）
    case 'tags':
      await applyTagsDiff(rem, value as string[]);
      break;

    // 关联 — sources（diff based）
    case 'sources':
      await applySourcesDiff(rem, value as string[]);
      break;

    // Powerup 操作
    case 'addPowerup':
      await rem.addPowerup(value as string);
      break;

    default:
      throw new Error(`不可写入的字段: ${field}`);
  }
}

// ── 辅助函数 ──

/** tags diff: 对比当前和目标，计算 add/remove */
async function applyTagsDiff(rem: Rem, targetIds: string[]): Promise<void> {
  const currentTags = await rem.getTagRems();
  const currentIds = new Set(currentTags.map((r: Rem) => r._id));
  const targetSet = new Set(targetIds);

  for (const id of targetIds) {
    if (!currentIds.has(id)) {
      await rem.addTag(id as string);
    }
  }
  for (const id of currentIds) {
    if (!targetSet.has(id as string)) {
      await rem.removeTag(id as string);
    }
  }
}

/** sources diff: 对比当前和目标，计算 add/remove */
async function applySourcesDiff(rem: Rem, targetIds: string[]): Promise<void> {
  const currentSources = await rem.getSources();
  const currentIds = new Set(currentSources.map((r: Rem) => r._id));
  const targetSet = new Set(targetIds);

  for (const id of targetIds) {
    if (!currentIds.has(id)) {
      await rem.addSource(id as string);
    }
  }
  for (const id of currentIds) {
    if (!targetSet.has(id as string)) {
      await rem.removeSource(id as string);
    }
  }
}

/** 字符串类型值 → SDK SetRemType 枚举数值。Portal 不可通过 setType() 设置。 */
function remTypeStringToEnum(type: string): 1 | 2 | 'DEFAULT_TYPE' {
  switch (type) {
    case 'concept': return 1;
    case 'descriptor': return 2;
    case 'default': return 'DEFAULT_TYPE';
    case 'portal': throw new Error('Portal 不可通过 setType() 设置，只能通过 createPortal() 创建');
    default: throw new Error(`未知的 Rem 类型: ${type}`);
  }
}

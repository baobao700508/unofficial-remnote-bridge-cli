<!-- source: https://plugins.remnote.com/api/classes/EditorNamespace -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   API Reference
-   Namespaces
-   EditorNamespace

On this page

# Class: EditorNamespace

## Hierarchy[​](#hierarchy "Direct link to heading")

-   `NamespaceBase`
    
    ↳ **`EditorNamespace`**
    

## Methods[​](#methods "Direct link to heading")

### collapseSelection[​](#collapseselection "Direct link to heading")

▸ **collapseSelection**(`to`): `Promise`<`void`\>

#### Parameters[​](#parameters "Direct link to heading")

Name

Type

`to`

`"end"` | `"start"`

#### Returns[​](#returns "Direct link to heading")

`Promise`<`void`\>

* * *

### copy[​](#copy "Direct link to heading")

▸ **copy**(): `Promise`<[`SelectionType`](/api/enums/SelectionType)\>

#### Returns[​](#returns-1 "Direct link to heading")

`Promise`<[`SelectionType`](/api/enums/SelectionType)\>

* * *

### cut[​](#cut "Direct link to heading")

▸ **cut**(): `Promise`<`undefined` | [`SelectionType`](/api/enums/SelectionType)\>

#### Returns[​](#returns-2 "Direct link to heading")

`Promise`<`undefined` | [`SelectionType`](/api/enums/SelectionType)\>

* * *

### delete[​](#delete "Direct link to heading")

▸ **delete**(): `Promise`<`any`\>

#### Returns[​](#returns-3 "Direct link to heading")

`Promise`<`any`\>

* * *

### deleteCharacters[​](#deletecharacters "Direct link to heading")

▸ **deleteCharacters**(`characters`, `direction`): `Promise`<`any`\>

#### Parameters[​](#parameters-1 "Direct link to heading")

Name

Type

`characters`

`number`

`direction`

`1` | `-1`

#### Returns[​](#returns-4 "Direct link to heading")

`Promise`<`any`\>

* * *

### getCaretPosition[​](#getcaretposition "Direct link to heading")

▸ **getCaretPosition**(): `Promise`<`undefined` | `DOMRect`\>

#### Returns[​](#returns-5 "Direct link to heading")

`Promise`<`undefined` | `DOMRect`\>

* * *

### getFocusedEditorText[​](#getfocusededitortext "Direct link to heading")

▸ **getFocusedEditorText**(): `Promise`<`undefined` | [`RichTextInterface`](/api/modules#richtextinterface)\>

#### Returns[​](#returns-6 "Direct link to heading")

`Promise`<`undefined` | [`RichTextInterface`](/api/modules#richtextinterface)\>

* * *

### getSelectedRem[​](#getselectedrem "Direct link to heading")

▸ **getSelectedRem**(): `Promise`<`undefined` | [`RemSelection`](/api/interfaces/RemSelection)\>

#### Returns[​](#returns-7 "Direct link to heading")

`Promise`<`undefined` | [`RemSelection`](/api/interfaces/RemSelection)\>

* * *

### getSelectedText[​](#getselectedtext "Direct link to heading")

▸ **getSelectedText**(): `Promise`<`undefined` | [`TextSelection`](/api/interfaces/TextSelection)\>

#### Returns[​](#returns-8 "Direct link to heading")

`Promise`<`undefined` | [`TextSelection`](/api/interfaces/TextSelection)\>

* * *

### getSelection[​](#getselection "Direct link to heading")

▸ **getSelection**(): `Promise`<`undefined` | [`RemSelection`](/api/interfaces/RemSelection) | [`TextSelection`](/api/interfaces/TextSelection)\>

#### Returns[​](#returns-9 "Direct link to heading")

`Promise`<`undefined` | [`RemSelection`](/api/interfaces/RemSelection) | [`TextSelection`](/api/interfaces/TextSelection)\>

* * *

### insertMarkdown[​](#insertmarkdown "Direct link to heading")

▸ **insertMarkdown**(`markdown`): `Promise`<`void`\>

#### Parameters[​](#parameters-2 "Direct link to heading")

Name

Type

`markdown`

`string`

#### Returns[​](#returns-10 "Direct link to heading")

`Promise`<`void`\>

* * *

### insertPlainText[​](#insertplaintext "Direct link to heading")

▸ **insertPlainText**(`string`): `Promise`<`void`\>

#### Parameters[​](#parameters-3 "Direct link to heading")

Name

Type

`string`

`string`

#### Returns[​](#returns-11 "Direct link to heading")

`Promise`<`void`\>

* * *

### insertRichText[​](#insertrichtext "Direct link to heading")

▸ **insertRichText**(`richText`): `Promise`<`void`\>

#### Parameters[​](#parameters-4 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-12 "Direct link to heading")

`Promise`<`void`\>

* * *

### moveCaret[​](#movecaret "Direct link to heading")

▸ **moveCaret**(`amount`, `unit`): `Promise`<`void`\>

#### Parameters[​](#parameters-5 "Direct link to heading")

Name

Type

`amount`

`number`

`unit`

[`MoveUnit`](/api/enums/MoveUnit)

#### Returns[​](#returns-13 "Direct link to heading")

`Promise`<`void`\>

* * *

### moveCaretVertical[​](#movecaretvertical "Direct link to heading")

▸ **moveCaretVertical**(`direction`): `Promise`<`any`\>

#### Parameters[​](#parameters-6 "Direct link to heading")

Name

Type

`direction`

`1` | `-1`

#### Returns[​](#returns-14 "Direct link to heading")

`Promise`<`any`\>

* * *

### redo[​](#redo "Direct link to heading")

▸ **redo**(): `Promise`<`void`\>

#### Returns[​](#returns-15 "Direct link to heading")

`Promise`<`void`\>

* * *

### selectRem[​](#selectrem "Direct link to heading")

▸ **selectRem**(`range`, `portalId?`): `Promise`<`any`\>

#### Parameters[​](#parameters-7 "Direct link to heading")

Name

Type

`range`

`string`\[\]

`portalId?`

`string`

#### Returns[​](#returns-16 "Direct link to heading")

`Promise`<`any`\>

* * *

### selectText[​](#selecttext "Direct link to heading")

▸ **selectText**(`range`): `Promise`<`any`\>

#### Parameters[​](#parameters-8 "Direct link to heading")

Name

Type

`range`

[`EditorRange`](/api/modules#editorrange)

#### Returns[​](#returns-17 "Direct link to heading")

`Promise`<`any`\>

* * *

### setText[​](#settext "Direct link to heading")

▸ **setText**(`richText`): `Promise`<`void`\>

#### Parameters[​](#parameters-9 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-18 "Direct link to heading")

`Promise`<`void`\>

* * *

### undo[​](#undo "Direct link to heading")

▸ **undo**(): `Promise`<`void`\>

#### Returns[​](#returns-19 "Direct link to heading")

`Promise`<`void`\>
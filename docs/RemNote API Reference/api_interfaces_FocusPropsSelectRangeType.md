<!-- source: https://plugins.remnote.com/api/interfaces/FocusPropsSelectRangeType -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   API Reference
-   All Internals
-   Interfaces
-   FocusPropsSelectRangeType

On this page

# Interface: FocusPropsSelectRangeType

## Properties[​](#properties "Direct link to heading")

### bottomRight[​](#bottomright "Direct link to heading")

• `Optional` **bottomRight**: `Object`

#### Type declaration[​](#type-declaration "Direct link to heading")

Name

Type

`colIdx`

`number`

`rowIdx`

`number`

* * *

### draggingSelectedRange[​](#draggingselectedrange "Direct link to heading")

• `Optional` **draggingSelectedRange**: `boolean`

* * *

### dropPortal[​](#dropportal "Direct link to heading")

• `Optional` **dropPortal**: `boolean`

* * *

### isTableSelection[​](#istableselection "Direct link to heading")

• **isTableSelection**: `boolean`

* * *

### lastFocusedRem[​](#lastfocusedrem "Direct link to heading")

• `Optional` **lastFocusedRem**: `string`

* * *

### prevTextFocusId[​](#prevtextfocusid "Direct link to heading")

• **prevTextFocusId**: [`ComponentFocusId`](/api/modules#componentfocusid)

* * *

### prevTextFocusProps[​](#prevtextfocusprops "Direct link to heading")

• **prevTextFocusProps**: `Partial`<[`FocusPropsTextType`](/api/interfaces/FocusPropsTextType)\>

* * *

### selectedColumnNodeId[​](#selectedcolumnnodeid "Direct link to heading")

• `Optional` **selectedColumnNodeId**: `string`

* * *

### selectedColumnsNodes[​](#selectedcolumnsnodes "Direct link to heading")

• `Optional` **selectedColumnsNodes**: `string`\[\]

* * *

### selectedDeepRemAllIds[​](#selecteddeepremallids "Direct link to heading")

• **selectedDeepRemAllIds**: { `portalId`: `string` ; `remId`: `string` }\[\]

* * *

### selectedDeepRemHighestLevelIds[​](#selecteddeepremhighestlevelids "Direct link to heading")

• **selectedDeepRemHighestLevelIds**: `string`\[\]

* * *

### selectedRange[​](#selectedrange "Direct link to heading")

• **selectedRange**: `string`\[\]

* * *

### selectedRangeEnd[​](#selectedrangeend "Direct link to heading")

• **selectedRangeEnd**: `null` | `string`

* * *

### selectedRangeFullDepth[​](#selectedrangefulldepth "Direct link to heading")

• **selectedRangeFullDepth**: `number`

* * *

### selectedRangePortal[​](#selectedrangeportal "Direct link to heading")

• **selectedRangePortal**: `null` | `string`

* * *

### selectedRangeReversed[​](#selectedrangereversed "Direct link to heading")

• **selectedRangeReversed**: `boolean`

* * *

### selectedRangeStart[​](#selectedrangestart "Direct link to heading")

• **selectedRangeStart**: `null` | `string`

* * *

### selectedRowNodeId[​](#selectedrownodeid "Direct link to heading")

• `Optional` **selectedRowNodeId**: `string`

* * *

### tableNodeId[​](#tablenodeid "Direct link to heading")

• `Optional` **tableNodeId**: `string`

* * *

### tableParent[​](#tableparent "Direct link to heading")

• `Optional` **tableParent**: `string`

* * *

### tablePortal[​](#tableportal "Direct link to heading")

• `Optional` **tablePortal**: `string`

* * *

### topLeft[​](#topleft "Direct link to heading")

• `Optional` **topLeft**: `Object`

#### Type declaration[​](#type-declaration-1 "Direct link to heading")

Name

Type

`colIdx`

`number`

`rowIdx`

`number`

* * *

### type[​](#type "Direct link to heading")

• **type**: [`SelectedRange`](/api/enums/FocusPropsType#selectedrange)
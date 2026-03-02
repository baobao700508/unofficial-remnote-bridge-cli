<!-- source: https://plugins.remnote.com/api/classes/RemNamespace -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   API Reference
-   Namespaces
-   RemNamespace

On this page

# Class: RemNamespace

## Hierarchy[​](#hierarchy "Direct link to heading")

-   `NamespaceBase`
    
    ↳ **`RemNamespace`**
    

## Methods[​](#methods "Direct link to heading")

### createLinkRem[​](#createlinkrem "Direct link to heading")

▸ **createLinkRem**(`url`, `addTitle?`): `Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

#### Parameters[​](#parameters "Direct link to heading")

Name

Type

Default value

`url`

`string`

`undefined`

`addTitle`

`boolean`

`true`

#### Returns[​](#returns "Direct link to heading")

`Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

* * *

### createPortal[​](#createportal "Direct link to heading")

▸ **createPortal**(): `Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

#### Returns[​](#returns-1 "Direct link to heading")

`Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

* * *

### createRem[​](#createrem "Direct link to heading")

▸ **createRem**(): `Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

#### Returns[​](#returns-2 "Direct link to heading")

`Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

* * *

### createSingleRemWithMarkdown[​](#createsingleremwithmarkdown "Direct link to heading")

▸ **createSingleRemWithMarkdown**(`markdown`, `parentId?`): `Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

#### Parameters[​](#parameters-1 "Direct link to heading")

Name

Type

`markdown`

`string`

`parentId?`

`string`

#### Returns[​](#returns-3 "Direct link to heading")

`Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

* * *

### createTable[​](#createtable "Direct link to heading")

▸ **createTable**(`existingTag?`): `Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

#### Parameters[​](#parameters-2 "Direct link to heading")

Name

Type

`existingTag?`

`string` | [`Rem`](/api/classes/Rem)

#### Returns[​](#returns-4 "Direct link to heading")

`Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

* * *

### createTreeWithMarkdown[​](#createtreewithmarkdown "Direct link to heading")

▸ **createTreeWithMarkdown**(`markdown`, `parentId?`): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Parameters[​](#parameters-3 "Direct link to heading")

Name

Type

`markdown`

`string`

`parentId?`

`string`

#### Returns[​](#returns-5 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### findByName[​](#findbyname "Direct link to heading")

▸ **findByName**(`name`, `parentId`): `Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

#### Parameters[​](#parameters-4 "Direct link to heading")

Name

Type

`name`

[`RichTextInterface`](/api/modules#richtextinterface)

`parentId`

`null` | `string`

#### Returns[​](#returns-6 "Direct link to heading")

`Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

* * *

### findMany[​](#findmany "Direct link to heading")

▸ **findMany**(`rs`): `Promise`<`undefined` | [`Rem`](/api/classes/Rem)\[\]\>

#### Parameters[​](#parameters-5 "Direct link to heading")

Name

Type

`rs`

`string`\[\] | [`Rem`](/api/classes/Rem)\[\]

#### Returns[​](#returns-7 "Direct link to heading")

`Promise`<`undefined` | [`Rem`](/api/classes/Rem)\[\]\>

* * *

### findOne[​](#findone "Direct link to heading")

▸ **findOne**(`remId`): `Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

#### Parameters[​](#parameters-6 "Direct link to heading")

Name

Type

`remId`

`undefined` | `string`

#### Returns[​](#returns-8 "Direct link to heading")

`Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

* * *

### getAll[​](#getall "Direct link to heading")

▸ **getAll**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-9 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### moveRems[​](#moverems "Direct link to heading")

▸ **moveRems**(`rems`, `newParent`, `positionAmongstSiblings`, `portal?`): `Promise`<`void`\>

#### Parameters[​](#parameters-7 "Direct link to heading")

Name

Type

`rems`

`string`\[\] | [`Rem`](/api/classes/Rem)\[\]

`newParent`

`string` | [`Rem`](/api/classes/Rem)

`positionAmongstSiblings`

`number`

`portal?`

`string` | [`Rem`](/api/classes/Rem)

#### Returns[​](#returns-10 "Direct link to heading")

`Promise`<`void`\>
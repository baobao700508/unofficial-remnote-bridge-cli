<!-- source: https://plugins.remnote.com/api/classes/QueueNamespace -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   API Reference
-   All Internals
-   Classes
-   QueueNamespace

On this page

# Class: QueueNamespace

## Hierarchy[​](#hierarchy "Direct link to heading")

-   `NamespaceBase`
    
    ↳ **`QueueNamespace`**
    

## Methods[​](#methods "Direct link to heading")

### getCurrentCard[​](#getcurrentcard "Direct link to heading")

▸ **getCurrentCard**(): `Promise`<`undefined` | [`Card`](/api/classes/Card)\>

#### Returns[​](#returns "Direct link to heading")

`Promise`<`undefined` | [`Card`](/api/classes/Card)\>

* * *

### getCurrentStreak[​](#getcurrentstreak "Direct link to heading")

▸ **getCurrentStreak**(): `Promise`<`undefined` | `number`\>

#### Returns[​](#returns-1 "Direct link to heading")

`Promise`<`undefined` | `number`\>

* * *

### getNumRemainingCards[​](#getnumremainingcards "Direct link to heading")

▸ **getNumRemainingCards**(): `Promise`<`undefined` | `number`\>

#### Returns[​](#returns-2 "Direct link to heading")

`Promise`<`undefined` | `number`\>

* * *

### inLookbackMode[​](#inlookbackmode "Direct link to heading")

▸ **inLookbackMode**(): `Promise`<`undefined` | `boolean`\>

#### Returns[​](#returns-3 "Direct link to heading")

`Promise`<`undefined` | `boolean`\>

* * *

### removeCurrentCardFromQueue[​](#removecurrentcardfromqueue "Direct link to heading")

▸ **removeCurrentCardFromQueue**(`addToBackStack?`): `Promise`<`void`\>

#### Parameters[​](#parameters "Direct link to heading")

Name

Type

Default value

Description

`addToBackStack`

`boolean`

`true`

#### Returns[​](#returns-4 "Direct link to heading")

`Promise`<`void`\>
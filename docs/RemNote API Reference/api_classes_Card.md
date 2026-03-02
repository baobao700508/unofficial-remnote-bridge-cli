<!-- source: https://plugins.remnote.com/api/classes/Card -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   API Reference
-   Objects
-   Card

On this page

# Class: Card

## Hierarchy[​](#hierarchy "Direct link to heading")

-   `NamespaceBase`
    
    ↳ **`Card`**
    

## Properties[​](#properties "Direct link to heading")

### \_id[​](#_id "Direct link to heading")

• `Readonly` **\_id**: `string`

* * *

### createdAt[​](#createdat "Direct link to heading")

• `Readonly` **createdAt**: `number`

* * *

### lastRepetitionTime[​](#lastrepetitiontime "Direct link to heading")

• `Optional` `Readonly` **lastRepetitionTime**: `number`

* * *

### nextRepetitionTime[​](#nextrepetitiontime "Direct link to heading")

• `Optional` `Readonly` **nextRepetitionTime**: `number`

* * *

### remId[​](#remid "Direct link to heading")

• `Readonly` **remId**: `string`

* * *

### repetitionHistory[​](#repetitionhistory "Direct link to heading")

• `Optional` `Readonly` **repetitionHistory**: [`RepetitionStatus`](/api/interfaces/RepetitionStatus)\[\]

* * *

### timesWrongInRow[​](#timeswronginrow "Direct link to heading")

• `Optional` `Readonly` **timesWrongInRow**: `number`

* * *

### type[​](#type "Direct link to heading")

• `Readonly` **type**: [`CardType`](/api/modules#cardtype)

## Methods[​](#methods "Direct link to heading")

### getRem[​](#getrem "Direct link to heading")

▸ **getRem**(): `Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

#### Returns[​](#returns "Direct link to heading")

`Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

* * *

### getType[​](#gettype "Direct link to heading")

▸ **getType**(): `Promise`<[`CardType`](/api/modules#cardtype)\>

#### Returns[​](#returns-1 "Direct link to heading")

`Promise`<[`CardType`](/api/modules#cardtype)\>

* * *

### remove[​](#remove "Direct link to heading")

▸ **remove**(): `Promise`<`void`\>

#### Returns[​](#returns-2 "Direct link to heading")

`Promise`<`void`\>

* * *

### updateCardRepetitionStatus[​](#updatecardrepetitionstatus "Direct link to heading")

▸ **updateCardRepetitionStatus**(`score`): `Promise`<`void`\>

#### Parameters[​](#parameters "Direct link to heading")

Name

Type

`score`

[`QueueInteractionScore`](/api/enums/QueueInteractionScore)

#### Returns[​](#returns-3 "Direct link to heading")

`Promise`<`void`\>
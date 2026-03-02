<!-- source: https://plugins.remnote.com/api/interfaces/SpecialPluginCallbackInfo -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   API Reference
-   All Internals
-   Interfaces
-   SpecialPluginCallbackInfo

On this page

# Interface: SpecialPluginCallbackInfo

## Methods[​](#methods "Direct link to heading")

### GetNextCard[​](#getnextcard "Direct link to heading")

▸ **GetNextCard**(`args`): `Promise`<`null` | [`PluginQueueCardData`](/api/interfaces/PluginQueueCardData)\>

#### Parameters[​](#parameters "Direct link to heading")

Name

Type

`args`

`Object`

`args.cardsPracticed`

`number`

`args.mode`

`"normal"` | `"practice-all"` | `"in-order"`

`args.numCardsRemaining`

`number`

`args.subQueueId`

`undefined` | `string`

#### Returns[​](#returns "Direct link to heading")

`Promise`<`null` | [`PluginQueueCardData`](/api/interfaces/PluginQueueCardData)\>

* * *

### SRSScheduleCard[​](#srsschedulecard "Direct link to heading")

▸ **SRSScheduleCard**(`args`): `Promise`<{ `nextDate`: `number` ; `pluginData?`: `Record`<`string`, `any`\> }\>

#### Parameters[​](#parameters-1 "Direct link to heading")

Name

Type

`args`

`Object`

`args.cardId`

`undefined` | `string`

`args.history`

[`RepetitionStatus`](/api/interfaces/RepetitionStatus)\[\]

`args.remId`

`undefined` | `string`

`args.schedulerParameters`

`Record`<`string`, `unknown`\>

#### Returns[​](#returns-1 "Direct link to heading")

`Promise`<{ `nextDate`: `number` ; `pluginData?`: `Record`<`string`, `any`\> }\>
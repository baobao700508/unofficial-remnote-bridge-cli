<!-- source: https://plugins.remnote.com/api/interfaces/PluginMenuItem -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   API Reference
-   All Internals
-   Interfaces
-   PluginMenuItem

On this page

# Interface: PluginMenuItem

## Hierarchy[​](#hierarchy "Direct link to heading")

-   `Omit`<[`SimpleCommand`](/api/interfaces/SimpleCommand), `"action"`\>
    
    ↳ **`PluginMenuItem`**
    

## Properties[​](#properties "Direct link to heading")

### iconUrl[​](#iconurl "Direct link to heading")

• `Optional` **iconUrl**: `string`

* * *

### id[​](#id "Direct link to heading")

• **id**: `string`

#### Inherited from[​](#inherited-from "Direct link to heading")

Omit.id

* * *

### location[​](#location "Direct link to heading")

• **location**: [`PluginCommandMenuLocation`](/api/enums/PluginCommandMenuLocation)

* * *

### name[​](#name "Direct link to heading")

• **name**: `string`

## Methods[​](#methods "Direct link to heading")

### action[​](#action "Direct link to heading")

▸ **action**(`args`): `Promise`<`void`\>

#### Parameters[​](#parameters "Direct link to heading")

Name

Type

`args`

`any`

#### Returns[​](#returns "Direct link to heading")

`Promise`<`void`\>
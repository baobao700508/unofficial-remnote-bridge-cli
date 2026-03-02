<!-- source: https://plugins.remnote.com/api/classes/EventNamespace -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   API Reference
-   Namespaces
-   EventNamespace

On this page

# Class: EventNamespace

## Hierarchy[​](#hierarchy "Direct link to heading")

-   `NamespaceBase`
    
    ↳ **`EventNamespace`**
    

## Methods[​](#methods "Direct link to heading")

### addListener[​](#addlistener "Direct link to heading")

▸ **addListener**(`eventId`, `listenerKey`, `callback`): `void`

#### Parameters[​](#parameters "Direct link to heading")

Name

Type

`eventId`

`string`

`listenerKey`

[`AppEventListerKey`](/api/modules#appeventlisterkey)

`callback`

[`EventCallbackFn`](/api/modules#eventcallbackfn)

#### Returns[​](#returns "Direct link to heading")

`void`

* * *

### removeListener[​](#removelistener "Direct link to heading")

▸ **removeListener**(`eventId`, `listenerKey`, `callback?`): `void`

#### Parameters[​](#parameters-1 "Direct link to heading")

Name

Type

`eventId`

`string`

`listenerKey`

[`AppEventListerKey`](/api/modules#appeventlisterkey)

`callback?`

[`EventCallbackFn`](/api/modules#eventcallbackfn)

#### Returns[​](#returns-1 "Direct link to heading")

`void`
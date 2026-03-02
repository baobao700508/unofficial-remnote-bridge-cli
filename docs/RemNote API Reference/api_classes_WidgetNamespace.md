<!-- source: https://plugins.remnote.com/api/classes/WidgetNamespace -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   API Reference
-   Namespaces
-   WidgetNamespace

On this page

# Class: WidgetNamespace

## Hierarchy[​](#hierarchy "Direct link to heading")

-   `NamespaceBase`
    
    ↳ **`WidgetNamespace`**
    

## Methods[​](#methods "Direct link to heading")

### closePopup[​](#closepopup "Direct link to heading")

▸ **closePopup**(`restoreFocus?`): `Promise`<`void`\>

#### Parameters[​](#parameters "Direct link to heading")

Name

Type

Default value

`restoreFocus`

`boolean`

`true`

#### Returns[​](#returns "Direct link to heading")

`Promise`<`void`\>

* * *

### getDimensions[​](#getdimensions "Direct link to heading")

▸ **getDimensions**(`widgetInstanceId`): `Promise`<`DOMRect`\>

#### Parameters[​](#parameters-1 "Direct link to heading")

Name

Type

`widgetInstanceId`

`number`

#### Returns[​](#returns-1 "Direct link to heading")

`Promise`<`DOMRect`\>

* * *

### getWidgetContext[​](#getwidgetcontext "Direct link to heading")

▸ **getWidgetContext**<`T`\>(): `Promise`<[`WidgetLocationContextDataMap`](/api/interfaces/WidgetLocationContextDataMap)\[`T`\] extends `undefined` ? { `widgetInstanceId`: `string` } : [`WidgetLocationContextDataMap`](/api/interfaces/WidgetLocationContextDataMap)\[`T`\] & { `widgetInstanceId`: `string` }\>

#### Type parameters[​](#type-parameters "Direct link to heading")

Name

Type

`T`

extends [`WidgetLocation`](/api/enums/WidgetLocation)

#### Returns[​](#returns-2 "Direct link to heading")

`Promise`<[`WidgetLocationContextDataMap`](/api/interfaces/WidgetLocationContextDataMap)\[`T`\] extends `undefined` ? { `widgetInstanceId`: `string` } : [`WidgetLocationContextDataMap`](/api/interfaces/WidgetLocationContextDataMap)\[`T`\] & { `widgetInstanceId`: `string` }\>

* * *

### getWidgetsAtLocation[​](#getwidgetsatlocation "Direct link to heading")

▸ **getWidgetsAtLocation**(`location`, `remId?`): `Promise`<{ `fileName`: `string` ; `pluginId`: `string` }\[\]\>

#### Parameters[​](#parameters-2 "Direct link to heading")

Name

Type

`location`

[`WidgetLocation`](/api/enums/WidgetLocation)

`remId?`

`string`

#### Returns[​](#returns-3 "Direct link to heading")

`Promise`<{ `fileName`: `string` ; `pluginId`: `string` }\[\]\>

* * *

### openPopup[​](#openpopup "Direct link to heading")

▸ **openPopup**(`widgetFileName`, `contextData?`, `clickOutsideToClose?`): `Promise`<`void`\>

#### Parameters[​](#parameters-3 "Direct link to heading")

Name

Type

`widgetFileName`

`string`

`contextData?`

`any`

`clickOutsideToClose?`

`boolean`

#### Returns[​](#returns-4 "Direct link to heading")

`Promise`<`void`\>
<!-- source: https://plugins.remnote.com/api/classes/WindowNamespace -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   API Reference
-   Namespaces
-   WindowNamespace

On this page

# Class: WindowNamespace

## Hierarchy[​](#hierarchy "Direct link to heading")

-   `NamespaceBase`
    
    ↳ **`WindowNamespace`**
    

## Methods[​](#methods "Direct link to heading")

### closeAllFloatingWidgets[​](#closeallfloatingwidgets "Direct link to heading")

▸ **closeAllFloatingWidgets**(): `Promise`<`void`\>

#### Returns[​](#returns "Direct link to heading")

`Promise`<`void`\>

* * *

### closeFloatingWidget[​](#closefloatingwidget "Direct link to heading")

▸ **closeFloatingWidget**(`floatingWidgetId`): `Promise`<`void`\>

#### Parameters[​](#parameters "Direct link to heading")

Name

Type

`floatingWidgetId`

`string`

#### Returns[​](#returns-1 "Direct link to heading")

`Promise`<`void`\>

* * *

### getCurrentWindowTree[​](#getcurrentwindowtree "Direct link to heading")

▸ **getCurrentWindowTree**(): `Promise`<[`PaneRemWindowTree`](/api/modules#paneremwindowtree)\>

#### Returns[​](#returns-2 "Direct link to heading")

`Promise`<[`PaneRemWindowTree`](/api/modules#paneremwindowtree)\>

* * *

### getFocusedPaneId[​](#getfocusedpaneid "Direct link to heading")

▸ **getFocusedPaneId**(): `Promise`<`string`\>

#### Returns[​](#returns-3 "Direct link to heading")

`Promise`<`string`\>

* * *

### getLastFocusedPane[​](#getlastfocusedpane "Direct link to heading")

▸ **getLastFocusedPane**(): `Promise`<`undefined` | `string`\>

#### Returns[​](#returns-4 "Direct link to heading")

`Promise`<`undefined` | `string`\>

* * *

### getOpenPaneIds[​](#getopenpaneids "Direct link to heading")

▸ **getOpenPaneIds**(): `Promise`<`string`\[\]\>

#### Returns[​](#returns-5 "Direct link to heading")

`Promise`<`string`\[\]\>

* * *

### getOpenPaneRemId[​](#getopenpaneremid "Direct link to heading")

▸ **getOpenPaneRemId**(`paneId`): `Promise`<`undefined` | `string`\>

#### Parameters[​](#parameters-1 "Direct link to heading")

Name

Type

`paneId`

`undefined` | `string`

#### Returns[​](#returns-6 "Direct link to heading")

`Promise`<`undefined` | `string`\>

* * *

### getOpenPaneRemIds[​](#getopenpaneremids "Direct link to heading")

▸ **getOpenPaneRemIds**(): `Promise`<`string`\[\]\>

#### Returns[​](#returns-7 "Direct link to heading")

`Promise`<`string`\[\]\>

* * *

### getURL[​](#geturl "Direct link to heading")

▸ **getURL**(): `Promise`<`string`\>

#### Returns[​](#returns-8 "Direct link to heading")

`Promise`<`string`\>

* * *

### isFloatingWidgetOpen[​](#isfloatingwidgetopen "Direct link to heading")

▸ **isFloatingWidgetOpen**(`floatingWidgetId`): `Promise`<`boolean`\>

#### Parameters[​](#parameters-2 "Direct link to heading")

Name

Type

`floatingWidgetId`

`string`

#### Returns[​](#returns-9 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### isOnPage[​](#isonpage "Direct link to heading")

▸ **isOnPage**(`page`): `Promise`<`boolean`\>

#### Parameters[​](#parameters-3 "Direct link to heading")

Name

Type

`page`

[`Queue`](/api/enums/PageType#queue)

#### Returns[​](#returns-10 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### openFloatingWidget[​](#openfloatingwidget "Direct link to heading")

▸ **openFloatingWidget**(`fileName`, `position`, `classContainer?`, `closeWhenClickOutside?`): `Promise`<`string`\>

#### Parameters[​](#parameters-4 "Direct link to heading")

Name

Type

`fileName`

`string`

`position`

`Object`

`position.bottom?`

`number`

`position.left?`

`number`

`position.right?`

`number`

`position.top?`

`number`

`classContainer?`

`string`

`closeWhenClickOutside?`

`boolean`

#### Returns[​](#returns-11 "Direct link to heading")

`Promise`<`string`\>

* * *

### openRem[​](#openrem "Direct link to heading")

▸ **openRem**(`rem`): `Promise`<`void`\>

#### Parameters[​](#parameters-5 "Direct link to heading")

Name

Type

`rem`

[`Rem`](/api/classes/Rem)

#### Returns[​](#returns-12 "Direct link to heading")

`Promise`<`void`\>

* * *

### openWidgetInPane[​](#openwidgetinpane "Direct link to heading")

▸ **openWidgetInPane**(`fileName`, `contextData?`): `Promise`<`string`\[\]\>

#### Parameters[​](#parameters-6 "Direct link to heading")

Name

Type

`fileName`

`string`

`contextData?`

`Record`<`string`, `any`\>

#### Returns[​](#returns-13 "Direct link to heading")

`Promise`<`string`\[\]\>

* * *

### openWidgetInRightSidebar[​](#openwidgetinrightsidebar "Direct link to heading")

▸ **openWidgetInRightSidebar**(`fileName`, `contextData?`): `Promise`<`string`\[\]\>

#### Parameters[​](#parameters-7 "Direct link to heading")

Name

Type

`fileName`

`string`

`contextData?`

`Record`<`string`, `any`\>

#### Returns[​](#returns-14 "Direct link to heading")

`Promise`<`string`\[\]\>

* * *

### releaseKeys[​](#releasekeys "Direct link to heading")

▸ **releaseKeys**(`floatingWidgetId`, `keys`): `Promise`<`void`\>

#### Parameters[​](#parameters-8 "Direct link to heading")

Name

Type

`floatingWidgetId`

`string`

`keys`

`string`\[\]

#### Returns[​](#returns-15 "Direct link to heading")

`Promise`<`void`\>

* * *

### setCurrentWindowTreeFromString[​](#setcurrentwindowtreefromstring "Direct link to heading")

▸ **setCurrentWindowTreeFromString**(`treeString`): `Promise`<`void`\>

#### Parameters[​](#parameters-9 "Direct link to heading")

Name

Type

`treeString`

`string`

#### Returns[​](#returns-16 "Direct link to heading")

`Promise`<`void`\>

* * *

### setFloatingWidgetPosition[​](#setfloatingwidgetposition "Direct link to heading")

▸ **setFloatingWidgetPosition**(`floatingWidgetId`, `position`): `Promise`<`void`\>

#### Parameters[​](#parameters-10 "Direct link to heading")

Name

Type

`floatingWidgetId`

`string`

`position`

`Object`

`position.bottom?`

`number`

`position.left?`

`number`

`position.right?`

`number`

`position.top?`

`number`

#### Returns[​](#returns-17 "Direct link to heading")

`Promise`<`void`\>

* * *

### setFocusedPaneId[​](#setfocusedpaneid "Direct link to heading")

▸ **setFocusedPaneId**(`paneId`): `Promise`<`void`\>

#### Parameters[​](#parameters-11 "Direct link to heading")

Name

Type

`paneId`

`string`

#### Returns[​](#returns-18 "Direct link to heading")

`Promise`<`void`\>

* * *

### setRemWindowTree[​](#setremwindowtree "Direct link to heading")

▸ **setRemWindowTree**(`tree`): `Promise`<`void`\>

#### Parameters[​](#parameters-12 "Direct link to heading")

Name

Type

`tree`

[`RemIdWindowTree`](/api/modules#remidwindowtree)

#### Returns[​](#returns-19 "Direct link to heading")

`Promise`<`void`\>

* * *

### setURL[​](#seturl "Direct link to heading")

▸ **setURL**(`url`): `Promise`<`void`\>

#### Parameters[​](#parameters-13 "Direct link to heading")

Name

Type

`url`

`string`

#### Returns[​](#returns-20 "Direct link to heading")

`Promise`<`void`\>

* * *

### stealKeys[​](#stealkeys "Direct link to heading")

▸ **stealKeys**(`floatingWidgetId`, `keys`): `Promise`<`void`\>

#### Parameters[​](#parameters-14 "Direct link to heading")

Name

Type

`floatingWidgetId`

`string`

`keys`

`string`\[\]

#### Returns[​](#returns-21 "Direct link to heading")

`Promise`<`void`\>
<!-- source: https://plugins.remnote.com/api/classes/AppNamespace -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   API Reference
-   Namespaces
-   AppNamespace

On this page

# Class: AppNamespace

## Hierarchy[​](#hierarchy "Direct link to heading")

-   `NamespaceBase`
    
    ↳ **`AppNamespace`**
    

## Methods[​](#methods "Direct link to heading")

### getOperatingSystem[​](#getoperatingsystem "Direct link to heading")

▸ **getOperatingSystem**(): `Promise`<[`OperatingSystem`](/api/modules#operatingsystem)\>

#### Returns[​](#returns "Direct link to heading")

`Promise`<[`OperatingSystem`](/api/modules#operatingsystem)\>

* * *

### getPlatform[​](#getplatform "Direct link to heading")

▸ **getPlatform**(): `Promise`<[`Platform`](/api/modules#platform)\>

#### Returns[​](#returns-1 "Direct link to heading")

`Promise`<[`Platform`](/api/modules#platform)\>

* * *

### registerCSS[​](#registercss "Direct link to heading")

▸ **registerCSS**(`id`, `css`): `Promise`<`void`\>

#### Parameters[​](#parameters "Direct link to heading")

Name

Type

`id`

`string`

`css`

`string`

#### Returns[​](#returns-2 "Direct link to heading")

`Promise`<`void`\>

* * *

### registerCallback[​](#registercallback "Direct link to heading")

▸ **registerCallback**<`T`\>(`callbackId`, `callback`): `void`

#### Type parameters[​](#type-parameters "Direct link to heading")

Name

Type

`T`

extends `undefined` | [`SpecialPluginCallback`](/api/enums/SpecialPluginCallback) = `undefined`

#### Parameters[​](#parameters-1 "Direct link to heading")

Name

Type

`callbackId`

`string`

`callback`

`T` extends `undefined` ? [`CallbackFn`](/api/modules#callbackfn) : `T` extends [`SpecialPluginCallback`](/api/enums/SpecialPluginCallback) ? [`SpecialPluginCallbackInfo`](/api/interfaces/SpecialPluginCallbackInfo)\[`T`\] : `never`

#### Returns[​](#returns-3 "Direct link to heading")

`void`

* * *

### registerCommand[​](#registercommand "Direct link to heading")

▸ **registerCommand**(`command`): `Promise`<`void`\>

#### Parameters[​](#parameters-2 "Direct link to heading")

Name

Type

`command`

[`Command`](/api/interfaces/Command)

#### Returns[​](#returns-4 "Direct link to heading")

`Promise`<`void`\>

* * *

### registerMenuItem[​](#registermenuitem "Direct link to heading")

▸ **registerMenuItem**(`menuItem`): `Promise`<`void`\>

#### Parameters[​](#parameters-3 "Direct link to heading")

Name

Type

`menuItem`

[`PluginMenuItem`](/api/interfaces/PluginMenuItem)

#### Returns[​](#returns-5 "Direct link to heading")

`Promise`<`void`\>

* * *

### registerPowerup[​](#registerpowerup "Direct link to heading")

▸ **registerPowerup**(`args`): `Promise`<`void`\>

#### Parameters[​](#parameters-4 "Direct link to heading")

Name

Type

`args`

`Object`

`args.code`

`string`

`args.description`

`string`

`args.name`

`string`

`args.options`

{ `slots`: { code: string; name: string; onlyProgrammaticModifying?: boolean | undefined; hidden?: boolean | undefined; enumValues?: Record<string, string\> | undefined; defaultEnumValue?: string | undefined; propertyType?: PropertyType | undefined; propertyLocation?: PropertyLocation | undefined; selectSourceType?: SelectSourc...\[\] } | { `properties`: { code: string; name: string; onlyProgrammaticModifying?: boolean | undefined; hidden?: boolean | undefined; enumValues?: Record<string, string\> | undefined; defaultEnumValue?: string | undefined; propertyType?: PropertyType | undefined; propertyLocation?: PropertyLocation | undefined; selectSourceType?: SelectSourc...\[\] }

#### Returns[​](#returns-6 "Direct link to heading")

`Promise`<`void`\>

* * *

### registerRemMenuItem[​](#registerremmenuitem "Direct link to heading")

▸ **registerRemMenuItem**(`command`): `Promise`<`void`\>

#### Parameters[​](#parameters-5 "Direct link to heading")

Name

Type

`command`

[`Command`](/api/interfaces/Command)

#### Returns[​](#returns-7 "Direct link to heading")

`Promise`<`void`\>

* * *

### registerWidget[​](#registerwidget "Direct link to heading")

▸ **registerWidget**(`fileName`, `location`, `options`): `Promise`<`void`\>

#### Parameters[​](#parameters-6 "Direct link to heading")

Name

Type

`fileName`

`string`

`location`

[`WidgetLocation`](/api/enums/WidgetLocation)

`options`

[`WidgetOptions`](/api/interfaces/WidgetOptions)

#### Returns[​](#returns-8 "Direct link to heading")

`Promise`<`void`\>

* * *

### releaseKeys[​](#releasekeys "Direct link to heading")

▸ **releaseKeys**(`keys`): `Promise`<`void`\>

#### Parameters[​](#parameters-7 "Direct link to heading")

Name

Type

`keys`

`string`\[\]

#### Returns[​](#returns-9 "Direct link to heading")

`Promise`<`void`\>

* * *

### stealKeys[​](#stealkeys "Direct link to heading")

▸ **stealKeys**(`keys`): `Promise`<`void`\>

#### Parameters[​](#parameters-8 "Direct link to heading")

Name

Type

`keys`

`string`\[\]

#### Returns[​](#returns-10 "Direct link to heading")

`Promise`<`void`\>

* * *

### toast[​](#toast "Direct link to heading")

▸ **toast**(`message`): `Promise`<`void`\>

#### Parameters[​](#parameters-9 "Direct link to heading")

Name

Type

`message`

`string`

#### Returns[​](#returns-11 "Direct link to heading")

`Promise`<`void`\>

* * *

### transaction[​](#transaction "Direct link to heading")

▸ **transaction**<`F`\>(`fn`): `Promise`<`Awaited`<`ReturnType`<`F`\>\>\>

#### Type parameters[​](#type-parameters-1 "Direct link to heading")

Name

Type

`F`

extends () => `any`

#### Parameters[​](#parameters-10 "Direct link to heading")

Name

Type

`fn`

`F`

#### Returns[​](#returns-12 "Direct link to heading")

`Promise`<`Awaited`<`ReturnType`<`F`\>\>\>

* * *

### unregisterMenuItem[​](#unregistermenuitem "Direct link to heading")

▸ **unregisterMenuItem**(`id`): `Promise`<`void`\>

#### Parameters[​](#parameters-11 "Direct link to heading")

Name

Type

`id`

`string`

#### Returns[​](#returns-13 "Direct link to heading")

`Promise`<`void`\>

* * *

### unregisterWidget[​](#unregisterwidget "Direct link to heading")

▸ **unregisterWidget**(`fileName`, `location`): `Promise`<`void`\>

#### Parameters[​](#parameters-12 "Direct link to heading")

Name

Type

`fileName`

`string`

`location`

[`WidgetLocation`](/api/enums/WidgetLocation)

#### Returns[​](#returns-14 "Direct link to heading")

`Promise`<`void`\>

* * *

### waitForInitialSync[​](#waitforinitialsync "Direct link to heading")

▸ **waitForInitialSync**(): `Promise`<`void`\>

#### Returns[​](#returns-15 "Direct link to heading")

`Promise`<`void`\>
<!-- source: https://plugins.remnote.com/api/classes/SettingsNamespace -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   API Reference
-   Namespaces
-   SettingsNamespace

On this page

# Class: SettingsNamespace

## Hierarchy[​](#hierarchy "Direct link to heading")

-   `NamespaceBase`
    
    ↳ **`SettingsNamespace`**
    

## Methods[​](#methods "Direct link to heading")

### getSetting[​](#getsetting "Direct link to heading")

▸ **getSetting**<`T`\>(`settingId`): `Promise`<`T`\>

#### Type parameters[​](#type-parameters "Direct link to heading")

Name

`T`

#### Parameters[​](#parameters "Direct link to heading")

Name

Type

`settingId`

`string`

#### Returns[​](#returns "Direct link to heading")

`Promise`<`T`\>

* * *

### registerBooleanSetting[​](#registerbooleansetting "Direct link to heading")

▸ **registerBooleanSetting**(`setting`): `Promise`<`void`\>

#### Parameters[​](#parameters-1 "Direct link to heading")

Name

Type

`setting`

[`PluginSettingBase`](/api/interfaces/PluginSettingBase)<`boolean`\>

#### Returns[​](#returns-1 "Direct link to heading")

`Promise`<`void`\>

* * *

### registerDropdownSetting[​](#registerdropdownsetting "Direct link to heading")

▸ **registerDropdownSetting**(`setting`): `Promise`<`void`\>

#### Parameters[​](#parameters-2 "Direct link to heading")

Name

Type

`setting`

[`PluginDropdownSetting`](/api/interfaces/PluginDropdownSetting)

#### Returns[​](#returns-2 "Direct link to heading")

`Promise`<`void`\>

* * *

### registerNumberSetting[​](#registernumbersetting "Direct link to heading")

▸ **registerNumberSetting**(`setting`): `Promise`<`void`\>

#### Parameters[​](#parameters-3 "Direct link to heading")

Name

Type

`setting`

[`PluginSettingBase`](/api/interfaces/PluginSettingBase)<`number`\>

#### Returns[​](#returns-3 "Direct link to heading")

`Promise`<`void`\>

* * *

### registerStringSetting[​](#registerstringsetting "Direct link to heading")

▸ **registerStringSetting**(`setting`): `Promise`<`void`\>

#### Parameters[​](#parameters-4 "Direct link to heading")

Name

Type

`setting`

[`PluginStringSetting`](/api/interfaces/PluginStringSetting)

#### Returns[​](#returns-4 "Direct link to heading")

`Promise`<`void`\>
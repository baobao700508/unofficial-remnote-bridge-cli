<!-- source: https://plugins.remnote.com/api/classes/RNPlugin -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   API Reference
-   Namespaces
-   RNPlugin

On this page

# Class: RNPlugin

## Properties[​](#properties "Direct link to heading")

### app[​](#app "Direct link to heading")

• **app**: [`AppNamespace`](/api/classes/AppNamespace)

* * *

### card[​](#card "Direct link to heading")

• **card**: [`CardNamespace`](/api/classes/CardNamespace)

* * *

### date[​](#date "Direct link to heading")

• **date**: [`DateNamespace`](/api/classes/DateNamespace)

* * *

### editor[​](#editor "Direct link to heading")

• **editor**: [`EditorNamespace`](/api/classes/EditorNamespace)

* * *

### event[​](#event "Direct link to heading")

• **event**: [`EventNamespace`](/api/classes/EventNamespace)

* * *

### focus[​](#focus "Direct link to heading")

• **focus**: [`FocusNamespace`](/api/classes/FocusNamespace)

* * *

### id[​](#id "Direct link to heading")

• **id**: `undefined` | `string`

* * *

### kb[​](#kb "Direct link to heading")

• **kb**: [`KnowledgeBaseNamespace`](/api/classes/KnowledgeBaseNamespace)

* * *

### manifest[​](#manifest "Direct link to heading")

• **manifest**: `undefined` | { `author`: `string` ; `changelogUrl`: `undefined` | `string` ; `description`: `undefined` | `string` ; `enableOnMobile`: `boolean` ; `id`: `string` ; `manifestVersion`: `1` ; `minimumRemNoteVersion`: `undefined` | { major: number; minor: number; patch: number; } ; `name`: `string` ; `projectUrl`: `undefined` | `string` ; `repoUrl`: `string` ; `requestNative`: `boolean` ; `requiredScopes`: ({ `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `type`: `All` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `remName`: `string` ; `type`: `DescendantsOfName` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `remId`: `string` ; `type`: `DescendantsOfId` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `powerupCode`: `string` ; `type`: `Powerup` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `type`: `FocusedSubtree` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `type`: `KnowledgeBaseInfo` })\[\] ; `supportUrl`: `undefined` | `string` ; `theme`: `undefined` | (`"dark"` | `"light"`)\[\] ; `unlisted`: `undefined` | `boolean` ; `version`: { major: number; minor: number; patch: number; } = VersionSig }

* * *

### messaging[​](#messaging "Direct link to heading")

• **messaging**: [`MessagingNamespace`](/api/classes/MessagingNamespace)

* * *

### powerup[​](#powerup "Direct link to heading")

• **powerup**: [`PowerupNamespace`](/api/classes/PowerupNamespace)

* * *

### queue[​](#queue "Direct link to heading")

• **queue**: [`QueueNamespace`](/api/classes/QueueNamespace)

* * *

### reader[​](#reader "Direct link to heading")

• **reader**: [`ReaderNamespace`](/api/classes/ReaderNamespace)

* * *

### rem[​](#rem "Direct link to heading")

• **rem**: [`RemNamespace`](/api/classes/RemNamespace)

* * *

### richText[​](#richtext "Direct link to heading")

• **richText**: [`RichTextNamespace`](/api/classes/RichTextNamespace)

* * *

### rootURL[​](#rooturl "Direct link to heading")

• **rootURL**: `undefined` | `string`

* * *

### scheduler[​](#scheduler "Direct link to heading")

• **scheduler**: [`SchedulerNamespace`](/api/classes/SchedulerNamespace)

* * *

### search[​](#search "Direct link to heading")

• **search**: [`SearchNamespace`](/api/classes/SearchNamespace)

* * *

### settings[​](#settings "Direct link to heading")

• **settings**: [`SettingsNamespace`](/api/classes/SettingsNamespace)

* * *

### storage[​](#storage "Direct link to heading")

• **storage**: [`StorageNamespace`](/api/classes/StorageNamespace)

* * *

### widget[​](#widget "Direct link to heading")

• **widget**: [`WidgetNamespace`](/api/classes/WidgetNamespace)

* * *

### window[​](#window "Direct link to heading")

• **window**: [`WindowNamespace`](/api/classes/WindowNamespace)

## Methods[​](#methods "Direct link to heading")

### track[​](#track "Direct link to heading")

▸ **track**(`userFunc`): () => `void`

#### Parameters[​](#parameters "Direct link to heading")

Name

Type

`userFunc`

(`plugin`: [`RNPlugin`](/api/classes/RNPlugin)) => `Promise`<`any`\>

#### Returns[​](#returns "Direct link to heading")

`fn`

▸ (): `void`

##### Returns[​](#returns-1 "Direct link to heading")

`void`
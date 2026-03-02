<!-- source: https://plugins.remnote.com/api/classes/RichTextNamespace -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   API Reference
-   Namespaces
-   RichTextNamespace

On this page

# Class: RichTextNamespace

## Hierarchy[​](#hierarchy "Direct link to heading")

-   `NamespaceBase`
    
    ↳ **`RichTextNamespace`**
    

## Accessors[​](#accessors "Direct link to heading")

### audio[​](#audio "Direct link to heading")

• `get` **audio**(): (`url`: `string`) => `RichTextBuilder`

#### Returns[​](#returns "Direct link to heading")

`fn`

▸ (`url`): `RichTextBuilder`

##### Parameters[​](#parameters "Direct link to heading")

Name

Type

`url`

`string`

##### Returns[​](#returns-1 "Direct link to heading")

`RichTextBuilder`

* * *

### code[​](#code "Direct link to heading")

• `get` **code**(): (`text`: `string`, `language`: `string`) => `RichTextBuilder`

#### Returns[​](#returns-2 "Direct link to heading")

`fn`

▸ (`text`, `language`): `RichTextBuilder`

##### Parameters[​](#parameters-1 "Direct link to heading")

Name

Type

`text`

`string`

`language`

`string`

##### Returns[​](#returns-3 "Direct link to heading")

`RichTextBuilder`

* * *

### image[​](#image "Direct link to heading")

• `get` **image**(): (`url`: `string`, `width?`: `number`, `height?`: `number`) => `RichTextBuilder`

#### Returns[​](#returns-4 "Direct link to heading")

`fn`

▸ (`url`, `width?`, `height?`): `RichTextBuilder`

##### Parameters[​](#parameters-2 "Direct link to heading")

Name

Type

`url`

`string`

`width?`

`number`

`height?`

`number`

##### Returns[​](#returns-5 "Direct link to heading")

`RichTextBuilder`

* * *

### latex[​](#latex "Direct link to heading")

• `get` **latex**(): (`text`: `string`, `block`: `boolean`) => `RichTextBuilder`

#### Returns[​](#returns-6 "Direct link to heading")

`fn`

▸ (`text`, `block?`): `RichTextBuilder`

##### Parameters[​](#parameters-3 "Direct link to heading")

Name

Type

Default value

`text`

`string`

`undefined`

`block`

`boolean`

`false`

##### Returns[​](#returns-7 "Direct link to heading")

`RichTextBuilder`

* * *

### newline[​](#newline "Direct link to heading")

• `get` **newline**(): () => `RichTextBuilder`

#### Returns[​](#returns-8 "Direct link to heading")

`fn`

▸ (): `RichTextBuilder`

##### Returns[​](#returns-9 "Direct link to heading")

`RichTextBuilder`

* * *

### rem[​](#rem "Direct link to heading")

• `get` **rem**(): (`rem`: `string` | [`Rem`](/api/classes/Rem)) => `RichTextBuilder`

#### Returns[​](#returns-10 "Direct link to heading")

`fn`

▸ (`rem`): `RichTextBuilder`

##### Parameters[​](#parameters-4 "Direct link to heading")

Name

Type

`rem`

`string` | [`Rem`](/api/classes/Rem)

##### Returns[​](#returns-11 "Direct link to heading")

`RichTextBuilder`

* * *

### text[​](#text "Direct link to heading")

• `get` **text**(): (`text`: `string`, `formats`: (`"bold"` | `"italic"` | `"underline"` | `"Red"` | `"Orange"` | `"Yellow"` | `"Green"` | `"Blue"` | `"Purple"` | `"quote"` | `"Gray"` | `"Brown"` | `"Pink"`)\[\]) => `RichTextBuilder`

#### Returns[​](#returns-12 "Direct link to heading")

`fn`

▸ (`text`, `formats?`): `RichTextBuilder`

##### Parameters[​](#parameters-5 "Direct link to heading")

Name

Type

Default value

`text`

`string`

`undefined`

`formats`

(`"bold"` | `"italic"` | `"underline"` | `"Red"` | `"Orange"` | `"Yellow"` | `"Green"` | `"Blue"` | `"Purple"` | `"quote"` | `"Gray"` | `"Brown"` | `"Pink"`)\[\]

`[]`

##### Returns[​](#returns-13 "Direct link to heading")

`RichTextBuilder`

* * *

### video[​](#video "Direct link to heading")

• `get` **video**(): (`url`: `string`) => `RichTextBuilder`

#### Returns[​](#returns-14 "Direct link to heading")

`fn`

▸ (`url`): `RichTextBuilder`

##### Parameters[​](#parameters-6 "Direct link to heading")

Name

Type

`url`

`string`

##### Returns[​](#returns-15 "Direct link to heading")

`RichTextBuilder`

## Methods[​](#methods "Direct link to heading")

### applyTextFormatToRange[​](#applytextformattorange "Direct link to heading")

▸ **applyTextFormatToRange**(`text`, `start`, `end`, `format`): `Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

#### Parameters[​](#parameters-7 "Direct link to heading")

Name

Type

`text`

[`RichTextInterface`](/api/modules#richtextinterface)

`start`

`number`

`end`

`number`

`format`

[`RichTextFormatName`](/api/modules#richtextformatname)

#### Returns[​](#returns-16 "Direct link to heading")

`Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

* * *

### charAt[​](#charat "Direct link to heading")

▸ **charAt**(`richText`, `index`): `Promise`<`null` | `string`\>

#### Parameters[​](#parameters-8 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

`index`

`number`

#### Returns[​](#returns-17 "Direct link to heading")

`Promise`<`null` | `string`\>

* * *

### deepGetRemAndAliasIdsFromRichText[​](#deepgetremandaliasidsfromrichtext "Direct link to heading")

▸ **deepGetRemAndAliasIdsFromRichText**(`richText`): `Promise`<`string`\[\]\>

#### Parameters[​](#parameters-9 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-18 "Direct link to heading")

`Promise`<`string`\[\]\>

* * *

### deepGetRemIdsFromRichText[​](#deepgetremidsfromrichtext "Direct link to heading")

▸ **deepGetRemIdsFromRichText**(`richText`): `Promise`<`string`\[\]\>

#### Parameters[​](#parameters-10 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-19 "Direct link to heading")

`Promise`<`string`\[\]\>

* * *

### empty[​](#empty "Direct link to heading")

▸ **empty**(`richText`, `allowSpaces?`): `Promise`<`boolean`\>

#### Parameters[​](#parameters-11 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

`allowSpaces?`

`boolean`

#### Returns[​](#returns-20 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### equals[​](#equals "Direct link to heading")

▸ **equals**(`richText1`, `richText2`): `Promise`<`boolean`\>

#### Parameters[​](#parameters-12 "Direct link to heading")

Name

Type

`richText1`

[`RichTextInterface`](/api/modules#richtextinterface)

`richText2`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-21 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### findAllExternalURLs[​](#findallexternalurls "Direct link to heading")

▸ **findAllExternalURLs**(`richText`): `Promise`<`string`\[\]\>

#### Parameters[​](#parameters-13 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-22 "Direct link to heading")

`Promise`<`string`\[\]\>

* * *

### getRemAndAliasIdsFromRichText[​](#getremandaliasidsfromrichtext "Direct link to heading")

▸ **getRemAndAliasIdsFromRichText**(`richText`): `Promise`<`string`\[\]\>

#### Parameters[​](#parameters-14 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-23 "Direct link to heading")

`Promise`<`string`\[\]\>

* * *

### getRemIdsFromRichText[​](#getremidsfromrichtext "Direct link to heading")

▸ **getRemIdsFromRichText**(`richText`): `Promise`<`string`\[\]\>

#### Parameters[​](#parameters-15 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-24 "Direct link to heading")

`Promise`<`string`\[\]\>

* * *

### indexOf[​](#indexof "Direct link to heading")

▸ **indexOf**(`richText`, `character`, `startChar?`): `Promise`<`number`\>

#### Parameters[​](#parameters-16 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

`character`

`string`

`startChar?`

`number`

#### Returns[​](#returns-25 "Direct link to heading")

`Promise`<`number`\>

* * *

### indexOfElementAt[​](#indexofelementat "Direct link to heading")

▸ **indexOfElementAt**(`richText`, `position`): `Promise`<`number`\>

#### Parameters[​](#parameters-17 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

`position`

`number`

#### Returns[​](#returns-26 "Direct link to heading")

`Promise`<`number`\>

* * *

### length[​](#length "Direct link to heading")

▸ **length**(`richText`): `Promise`<`number`\>

#### Parameters[​](#parameters-18 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-27 "Direct link to heading")

`Promise`<`number`\>

* * *

### normalize[​](#normalize "Direct link to heading")

▸ **normalize**(`richText`): `Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

#### Parameters[​](#parameters-19 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-28 "Direct link to heading")

`Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

* * *

### parseAndInsertHtml[​](#parseandinserthtml "Direct link to heading")

▸ **parseAndInsertHtml**(`html`, `rem`): `Promise`<`void`\>

#### Parameters[​](#parameters-20 "Direct link to heading")

Name

Type

Description

`html`

`string`

`rem`

`string` | [`Rem`](/api/classes/Rem)

#### Returns[​](#returns-29 "Direct link to heading")

`Promise`<`void`\>

* * *

### parseFromMarkdown[​](#parsefrommarkdown "Direct link to heading")

▸ **parseFromMarkdown**(`markdown`): `Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

#### Parameters[​](#parameters-21 "Direct link to heading")

Name

Type

`markdown`

`string`

#### Returns[​](#returns-30 "Direct link to heading")

`Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

* * *

### removeTextFormatFromRange[​](#removetextformatfromrange "Direct link to heading")

▸ **removeTextFormatFromRange**(`text`, `start`, `end`, `format`): `Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

#### Parameters[​](#parameters-22 "Direct link to heading")

Name

Type

`text`

[`RichTextInterface`](/api/modules#richtextinterface)

`start`

`number`

`end`

`number`

`format`

[`RichTextFormatName`](/api/modules#richtextformatname)

#### Returns[​](#returns-31 "Direct link to heading")

`Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

* * *

### replaceAllRichText[​](#replaceallrichtext "Direct link to heading")

▸ **replaceAllRichText**(`richText`, `findText`, `replacementText`): `Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

#### Parameters[​](#parameters-23 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

`findText`

[`RichTextInterface`](/api/modules#richtextinterface)

`replacementText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-32 "Direct link to heading")

`Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

* * *

### split[​](#split "Direct link to heading")

▸ **split**(`richText`, `separationCharacter`): `Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

#### Parameters[​](#parameters-24 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

`separationCharacter`

`string`

#### Returns[​](#returns-33 "Direct link to heading")

`Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

* * *

### splitRichText[​](#splitrichtext "Direct link to heading")

▸ **splitRichText**(`richText`, `splitText`): `Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

#### Parameters[​](#parameters-25 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

`splitText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-34 "Direct link to heading")

`Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

* * *

### substring[​](#substring "Direct link to heading")

▸ **substring**(`richText`, `start`, `end?`): `Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

#### Parameters[​](#parameters-26 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

`start`

`number`

`end?`

`number`

#### Returns[​](#returns-35 "Direct link to heading")

`Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

* * *

### toHTML[​](#tohtml "Direct link to heading")

▸ **toHTML**(`richText`): `Promise`<`string`\>

#### Parameters[​](#parameters-27 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-36 "Direct link to heading")

`Promise`<`string`\>

* * *

### toMarkdown[​](#tomarkdown "Direct link to heading")

▸ **toMarkdown**(`richText`): `Promise`<`string`\>

#### Parameters[​](#parameters-28 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-37 "Direct link to heading")

`Promise`<`string`\>

* * *

### toString[​](#tostring "Direct link to heading")

▸ **toString**(`richText`): `Promise`<`string`\>

#### Parameters[​](#parameters-29 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-38 "Direct link to heading")

`Promise`<`string`\>

* * *

### toggleTextFormatOnRange[​](#toggletextformatonrange "Direct link to heading")

▸ **toggleTextFormatOnRange**(`text`, `start`, `end`, `format`): `Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

#### Parameters[​](#parameters-30 "Direct link to heading")

Name

Type

`text`

[`RichTextInterface`](/api/modules#richtextinterface)

`start`

`number`

`end`

`number`

`format`

[`RichTextFormatName`](/api/modules#richtextformatname)

#### Returns[​](#returns-39 "Direct link to heading")

`Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

* * *

### trim[​](#trim "Direct link to heading")

▸ **trim**(`richText`): `Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

#### Parameters[​](#parameters-31 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-40 "Direct link to heading")

`Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

* * *

### trimEnd[​](#trimend "Direct link to heading")

▸ **trimEnd**(`richText`): `Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

#### Parameters[​](#parameters-32 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-41 "Direct link to heading")

`Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

* * *

### trimStart[​](#trimstart "Direct link to heading")

▸ **trimStart**(`richText`): `Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

#### Parameters[​](#parameters-33 "Direct link to heading")

Name

Type

`richText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-42 "Direct link to heading")

`Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>
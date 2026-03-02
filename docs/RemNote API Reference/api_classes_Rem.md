<!-- source: https://plugins.remnote.com/api/classes/Rem -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   API Reference
-   Objects
-   Rem

On this page

# Class: Rem

## Properties[​](#properties "Direct link to heading")

### \_id[​](#_id "Direct link to heading")

• `Readonly` **\_id**: `string`

* * *

### backText[​](#backtext "Direct link to heading")

• `Optional` `Readonly` **backText**: [`RichTextInterface`](/api/modules#richtextinterface)

* * *

### children[​](#children "Direct link to heading")

• `Readonly` **children**: `undefined` | `string`\[\]

* * *

### createdAt[​](#createdat "Direct link to heading")

• `Readonly` **createdAt**: `number`

* * *

### getPowerupProperty[​](#getpowerupproperty "Direct link to heading")

• **getPowerupProperty**: `GetPowerupPropertyOverload`

* * *

### getPowerupPropertyAsRichText[​](#getpoweruppropertyasrichtext "Direct link to heading")

• **getPowerupPropertyAsRichText**: `GetPowerupPropertyAsRichTextOverload`

* * *

### localUpdatedAt[​](#localupdatedat "Direct link to heading")

• `Readonly` **localUpdatedAt**: `number`

* * *

### parent[​](#parent "Direct link to heading")

• `Readonly` **parent**: `null` | `string`

* * *

### setPowerupProperty[​](#setpowerupproperty "Direct link to heading")

• **setPowerupProperty**: `SetPowerupPropertyOverload`

* * *

### text[​](#text "Direct link to heading")

• `Readonly` **text**: `undefined` | [`RichTextInterface`](/api/modules#richtextinterface)

* * *

### type[​](#type "Direct link to heading")

• `Readonly` **type**: [`RemType`](/api/enums/RemType)

* * *

### updatedAt[​](#updatedat "Direct link to heading")

• `Readonly` **updatedAt**: `number`

## Methods[​](#methods "Direct link to heading")

### addPowerup[​](#addpowerup "Direct link to heading")

▸ **addPowerup**(`powerupCode`): `Promise`<`void`\>

#### Parameters[​](#parameters "Direct link to heading")

Name

Type

`powerupCode`

`string`

#### Returns[​](#returns "Direct link to heading")

`Promise`<`void`\>

* * *

### addSource[​](#addsource "Direct link to heading")

▸ **addSource**(`source`): `Promise`<`void`\>

#### Parameters[​](#parameters-1 "Direct link to heading")

Name

Type

`source`

`string` | [`Rem`](/api/classes/Rem)

#### Returns[​](#returns-1 "Direct link to heading")

`Promise`<`void`\>

* * *

### addTag[​](#addtag "Direct link to heading")

▸ **addTag**(`tag`): `Promise`<`void`\>

#### Parameters[​](#parameters-2 "Direct link to heading")

Name

Type

`tag`

`string` | [`Rem`](/api/classes/Rem)

#### Returns[​](#returns-2 "Direct link to heading")

`Promise`<`void`\>

* * *

### addToPortal[​](#addtoportal "Direct link to heading")

▸ **addToPortal**(`portal`): `Promise`<`void`\>

#### Parameters[​](#parameters-3 "Direct link to heading")

Name

Type

`portal`

`string` | [`Rem`](/api/classes/Rem)

#### Returns[​](#returns-3 "Direct link to heading")

`Promise`<`void`\>

* * *

### allRemInDocumentOrPortal[​](#allremindocumentorportal "Direct link to heading")

▸ **allRemInDocumentOrPortal**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-4 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### allRemInFolderQueue[​](#allreminfolderqueue "Direct link to heading")

▸ **allRemInFolderQueue**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-5 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### ancestorTagRem[​](#ancestortagrem "Direct link to heading")

▸ **ancestorTagRem**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-6 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### collapse[​](#collapse "Direct link to heading")

▸ **collapse**(`portal`): `Promise`<`void`\>

#### Parameters[​](#parameters-4 "Direct link to heading")

Name

Type

`portal`

`undefined` | `string` | [`Rem`](/api/classes/Rem)

#### Returns[​](#returns-7 "Direct link to heading")

`Promise`<`void`\>

* * *

### copyPortalReferenceToClipboard[​](#copyportalreferencetoclipboard "Direct link to heading")

▸ **copyPortalReferenceToClipboard**(): `Promise`<`void`\>

#### Returns[​](#returns-8 "Direct link to heading")

`Promise`<`void`\>

* * *

### copyReferenceToClipboard[​](#copyreferencetoclipboard "Direct link to heading")

▸ **copyReferenceToClipboard**(): `Promise`<`void`\>

#### Returns[​](#returns-9 "Direct link to heading")

`Promise`<`void`\>

* * *

### copyTagReferenceToClipboard[​](#copytagreferencetoclipboard "Direct link to heading")

▸ **copyTagReferenceToClipboard**(): `Promise`<`void`\>

#### Returns[​](#returns-10 "Direct link to heading")

`Promise`<`void`\>

* * *

### deepRemsBeingReferenced[​](#deepremsbeingreferenced "Direct link to heading")

▸ **deepRemsBeingReferenced**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-11 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### descendantTagRem[​](#descendanttagrem "Direct link to heading")

▸ **descendantTagRem**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-12 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### embeddedQueueViewMode[​](#embeddedqueueviewmode "Direct link to heading")

▸ **embeddedQueueViewMode**(): `Promise`<`boolean`\>

#### Returns[​](#returns-13 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### expand[​](#expand "Direct link to heading")

▸ **expand**(`portal`, `recurse`): `Promise`<`void`\>

#### Parameters[​](#parameters-5 "Direct link to heading")

Name

Type

Description

`portal`

`undefined` | `string` | [`Rem`](/api/classes/Rem)

\-

`recurse`

`boolean`

#### Returns[​](#returns-14 "Direct link to heading")

`Promise`<`void`\>

* * *

### getAliases[​](#getaliases "Direct link to heading")

▸ **getAliases**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-15 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### getCards[​](#getcards "Direct link to heading")

▸ **getCards**(): `Promise`<[`Card`](/api/classes/Card)\[\]\>

#### Returns[​](#returns-16 "Direct link to heading")

`Promise`<[`Card`](/api/classes/Card)\[\]\>

* * *

### getChildrenRem[​](#getchildrenrem "Direct link to heading")

▸ **getChildrenRem**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-17 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### getDescendants[​](#getdescendants "Direct link to heading")

▸ **getDescendants**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-18 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### getEnablePractice[​](#getenablepractice "Direct link to heading")

▸ **getEnablePractice**(): `Promise`<`boolean`\>

#### Returns[​](#returns-19 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### getFontSize[​](#getfontsize "Direct link to heading")

▸ **getFontSize**(): `Promise`<`undefined` | `"H1"` | `"H2"` | `"H3"`\>

#### Returns[​](#returns-20 "Direct link to heading")

`Promise`<`undefined` | `"H1"` | `"H2"` | `"H3"`\>

* * *

### getHighlightColor[​](#gethighlightcolor "Direct link to heading")

▸ **getHighlightColor**(): `Promise`<`undefined` | `string`\>

#### Returns[​](#returns-21 "Direct link to heading")

`Promise`<`undefined` | `string`\>

* * *

### getLastPracticed[​](#getlastpracticed "Direct link to heading")

▸ **getLastPracticed**(): `Promise`<`number`\>

#### Returns[​](#returns-22 "Direct link to heading")

`Promise`<`number`\>

* * *

### getLastTimeMovedTo[​](#getlasttimemovedto "Direct link to heading")

▸ **getLastTimeMovedTo**(): `Promise`<`number`\>

#### Returns[​](#returns-23 "Direct link to heading")

`Promise`<`number`\>

* * *

### getOrCreateAliasWithText[​](#getorcreatealiaswithtext "Direct link to heading")

▸ **getOrCreateAliasWithText**(`aliasText`): `Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

#### Parameters[​](#parameters-6 "Direct link to heading")

Name

Type

`aliasText`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-24 "Direct link to heading")

`Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

* * *

### getParentRem[​](#getparentrem "Direct link to heading")

▸ **getParentRem**(): `Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

#### Returns[​](#returns-25 "Direct link to heading")

`Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

* * *

### getPortalDirectlyIncludedRem[​](#getportaldirectlyincludedrem "Direct link to heading")

▸ **getPortalDirectlyIncludedRem**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-26 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### getPortalType[​](#getportaltype "Direct link to heading")

▸ **getPortalType**(): `Promise`<[`PORTAL_TYPE`](/api/enums/PORTAL_TYPE)\>

#### Returns[​](#returns-27 "Direct link to heading")

`Promise`<[`PORTAL_TYPE`](/api/enums/PORTAL_TYPE)\>

* * *

### getPowerupPropertyAsRem[​](#getpoweruppropertyasrem "Direct link to heading")

▸ **getPowerupPropertyAsRem**<`PowerupCode`\>(`powerupCode`, `powerupSlot`): `Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

#### Type parameters[​](#type-parameters "Direct link to heading")

Name

Type

`PowerupCode`

extends [`BuiltInPowerupCodes`](/api/enums/BuiltInPowerupCodes)

#### Parameters[​](#parameters-7 "Direct link to heading")

Name

Type

`powerupCode`

`string` | `PowerupCode`

`powerupSlot`

`string` | keyof { `a`: { `SortDirection`: `string` = 'd' } ; `at`: { `Templates`: `string` = 't' } ; `b`: { `FileURL`: `string` = 'f'; `LastReadDate`: `string` = 'd'; `ReadPercent`: `string` = 'r'; `Title`: `string` = 't'; `URL`: `string` = 'u' } ; `c`: {} = {}; `cd`: { `DontBoundHeight`: `string` = 'b'; `DontWrap`: `string` = 'w'; `Language`: `string` = 'l' } ; `ct`: { `Template`: `string` = 't' } ; `d`: { `Date`: `string` = 'd'; `Timestamp`: `string` = 's' } ; `de`: { `ExamSchedulerCollection`: `string` = 'emcd'; `ExamSchedulerDate`: `string` = 'e'; `ExamSchedulerDesiredStability`: `string` = 'eds'; `ExamSchedulerMaxNewCardsPerDay`: `string` = 'emnc'; `ExamSchedulerMaxTotalCardsPerDay`: `string` = 'emtc'; `MaxNewCardsPerDay`: `string` = 'm'; `MaxTotalCardsPerDay`: `string` = 'c'; `Status`: `string` = 's'; `Topics`: `string` = 't' } ; `dv`: {} = {}; `e`: { `Message`: `string` = 'm' } ; `f`: { `Authors`: `string` = 'a'; `HasNoTextLayer`: `string` = 'tl'; `Keywords`: `string` = 'k'; `LastReadDate`: `string` = 'd'; `Name`: `string` = 'n'; `ReadPercent`: `string` = 'r'; `Theme`: `string` = 'h'; `Title`: `string` = 'i'; `Type`: `string` = 't'; `URL`: `string` = 'u'; `ViewerData`: `string` = 'v' } ; `g`: { `AutoActivate`: `string` = 'a'; `CollapseConfigure`: `string` = 'c'; `Pinned`: `string` = 'p'; `PrimaryColumnName`: `string` = 'n' } ; `h`: { `Color`: `string` = 'c' } ; `ha`: {} = {}; `hh`: { `Data`: `string` = 'd'; `HTMLId`: `string` = 'h' } ; `i`: {} = {}; `id`: {} = {}; `j`: {} = {}; `k`: {} = {}; `l`: { `Aliases`: `string` = 'a' } ; `m`: {} = {}; `n`: { `Data`: `string` = 'd'; `PdfId`: `string` = 'p' } ; `o`: { `DeprecatedSource`: `string` = 'o'; `Status`: `string` = 's' } ; `os`: { `Sources`: `string` = 'os' } ; `p`: { `Data`: `string` = 'd'; `Url`: `string` = 'w' } ; `pn`: {} = {}; `q`: {} = {}; `qt`: {} = {}; `r`: { `Size`: `string` = 's' } ; `rt`: { `Date`: `string` = 'd' } ; `s`: {} = {}; `sd`: {} = {}; `sp`: { `AutomaticBacklinkSearchPortalFor`: `string` = 'b'; `DontIncludeNestedDescendants`: `string` = 's'; `Filter`: `string` = 'f'; `Query`: `string` = 'q' } ; `t`: { `Status`: `string` = 's' } ; `ty`: {} = {}; `u`: {} = {}; `w`: {} = {}; `x`: {} = {}; `y`: { `ExtraSlotsOnBackOfCard`: `string` = 'b'; `ExtraSlotsOnFrontOfCard`: `string` = 'f'; `SelectTag`: `string` = 't' } ; `z`: { `Hostname`: `string` = 'u' } }\[`PowerupCode`\]

#### Returns[​](#returns-28 "Direct link to heading")

`Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

* * *

### getPracticeDirection[​](#getpracticedirection "Direct link to heading")

▸ **getPracticeDirection**(): `Promise`<`"both"` | `"none"` | `"forward"` | `"backward"`\>

#### Returns[​](#returns-29 "Direct link to heading")

`Promise`<`"both"` | `"none"` | `"forward"` | `"backward"`\>

* * *

### getPropertyType[​](#getpropertytype "Direct link to heading")

▸ **getPropertyType**(): `Promise`<`undefined` | [`PropertyType`](/api/enums/PropertyType)\>

#### Returns[​](#returns-30 "Direct link to heading")

`Promise`<`undefined` | [`PropertyType`](/api/enums/PropertyType)\>

* * *

### getSchemaVersion[​](#getschemaversion "Direct link to heading")

▸ **getSchemaVersion**(): `Promise`<`number`\>

#### Returns[​](#returns-31 "Direct link to heading")

`Promise`<`number`\>

* * *

### getSources[​](#getsources "Direct link to heading")

▸ **getSources**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-32 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### getTagPropertyAsRem[​](#gettagpropertyasrem "Direct link to heading")

▸ **getTagPropertyAsRem**(`propertyId`): `Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

#### Parameters[​](#parameters-8 "Direct link to heading")

Name

Type

`propertyId`

`string`

#### Returns[​](#returns-33 "Direct link to heading")

`Promise`<`undefined` | [`Rem`](/api/classes/Rem)\>

* * *

### getTagPropertyValue[​](#gettagpropertyvalue "Direct link to heading")

▸ **getTagPropertyValue**(`propertyId`): `Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

#### Parameters[​](#parameters-9 "Direct link to heading")

Name

Type

`propertyId`

`string`

#### Returns[​](#returns-34 "Direct link to heading")

`Promise`<[`RichTextInterface`](/api/modules#richtextinterface)\>

* * *

### getTagRems[​](#gettagrems "Direct link to heading")

▸ **getTagRems**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-35 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### getTodoStatus[​](#gettodostatus "Direct link to heading")

▸ **getTodoStatus**(): `Promise`<`undefined` | `"Finished"` | `"Unfinished"`\>

#### Returns[​](#returns-36 "Direct link to heading")

`Promise`<`undefined` | `"Finished"` | `"Unfinished"`\>

* * *

### getType[​](#gettype "Direct link to heading")

▸ **getType**(): `Promise`<[`RemType`](/api/enums/RemType)\>

#### Returns[​](#returns-37 "Direct link to heading")

`Promise`<[`RemType`](/api/enums/RemType)\>

* * *

### hasPowerup[​](#haspowerup "Direct link to heading")

▸ **hasPowerup**(`powerupCode`): `Promise`<`boolean`\>

#### Parameters[​](#parameters-10 "Direct link to heading")

Name

Type

`powerupCode`

`string`

#### Returns[​](#returns-38 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### indent[​](#indent "Direct link to heading")

▸ **indent**(`portal?`): `Promise`<`void`\>

#### Parameters[​](#parameters-11 "Direct link to heading")

Name

Type

`portal?`

`string` | [`Rem`](/api/classes/Rem)

#### Returns[​](#returns-39 "Direct link to heading")

`Promise`<`void`\>

* * *

### isCardItem[​](#iscarditem "Direct link to heading")

▸ **isCardItem**(): `Promise`<`boolean`\>

#### Returns[​](#returns-40 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### isCode[​](#iscode "Direct link to heading")

▸ **isCode**(): `Promise`<`boolean`\>

#### Returns[​](#returns-41 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### isCollapsed[​](#iscollapsed "Direct link to heading")

▸ **isCollapsed**(`portalId`): `Promise`<`boolean`\>

#### Parameters[​](#parameters-12 "Direct link to heading")

Name

Type

`portalId`

`string`

#### Returns[​](#returns-42 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### isDocument[​](#isdocument "Direct link to heading")

▸ **isDocument**(): `Promise`<`boolean`\>

#### Returns[​](#returns-43 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### isListItem[​](#islistitem "Direct link to heading")

▸ **isListItem**(): `Promise`<`boolean`\>

#### Returns[​](#returns-44 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### isPowerup[​](#ispowerup "Direct link to heading")

▸ **isPowerup**(): `Promise`<`boolean`\>

#### Returns[​](#returns-45 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### isPowerupEnum[​](#ispowerupenum "Direct link to heading")

▸ **isPowerupEnum**(): `Promise`<`boolean`\>

#### Returns[​](#returns-46 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### isPowerupProperty[​](#ispowerupproperty "Direct link to heading")

▸ **isPowerupProperty**(): `Promise`<`boolean`\>

#### Returns[​](#returns-47 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### isPowerupPropertyListItem[​](#ispoweruppropertylistitem "Direct link to heading")

▸ **isPowerupPropertyListItem**(): `Promise`<`boolean`\>

#### Returns[​](#returns-48 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### isPowerupSlot[​](#ispowerupslot "Direct link to heading")

▸ **isPowerupSlot**(): `Promise`<`boolean`\>

#### Returns[​](#returns-49 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### isProperty[​](#isproperty "Direct link to heading")

▸ **isProperty**(): `Promise`<`boolean`\>

#### Returns[​](#returns-50 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### isQuote[​](#isquote "Direct link to heading")

▸ **isQuote**(): `Promise`<`boolean`\>

#### Returns[​](#returns-51 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### isSlot[​](#isslot "Direct link to heading")

▸ **isSlot**(): `Promise`<`boolean`\>

#### Returns[​](#returns-52 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### isTable[​](#istable "Direct link to heading")

▸ **isTable**(): `Promise`<`any`\>

#### Returns[​](#returns-53 "Direct link to heading")

`Promise`<`any`\>

* * *

### isTodo[​](#istodo "Direct link to heading")

▸ **isTodo**(): `Promise`<`boolean`\>

#### Returns[​](#returns-54 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### merge[​](#merge "Direct link to heading")

▸ **merge**(`remIdToMergeIntoThisOne`): `Promise`<`void`\>

#### Parameters[​](#parameters-13 "Direct link to heading")

Name

Type

`remIdToMergeIntoThisOne`

`string`

#### Returns[​](#returns-55 "Direct link to heading")

`Promise`<`void`\>

* * *

### mergeAndSetAlias[​](#mergeandsetalias "Direct link to heading")

▸ **mergeAndSetAlias**(`remToMergeIntoThisOne`): `Promise`<`void`\>

#### Parameters[​](#parameters-14 "Direct link to heading")

Name

Type

`remToMergeIntoThisOne`

`string` | [`Rem`](/api/classes/Rem)

#### Returns[​](#returns-56 "Direct link to heading")

`Promise`<`void`\>

* * *

### openRemAsPage[​](#openremaspage "Direct link to heading")

▸ **openRemAsPage**(): `Promise`<`void`\>

#### Returns[​](#returns-57 "Direct link to heading")

`Promise`<`void`\>

* * *

### openRemInContext[​](#openremincontext "Direct link to heading")

▸ **openRemInContext**(): `Promise`<`void`\>

#### Returns[​](#returns-58 "Direct link to heading")

`Promise`<`void`\>

* * *

### outdent[​](#outdent "Direct link to heading")

▸ **outdent**(`portal?`): `Promise`<`void`\>

#### Parameters[​](#parameters-15 "Direct link to heading")

Name

Type

`portal?`

`string` | [`Rem`](/api/classes/Rem)

#### Returns[​](#returns-59 "Direct link to heading")

`Promise`<`void`\>

* * *

### portalsAndDocumentsIn[​](#portalsanddocumentsin "Direct link to heading")

▸ **portalsAndDocumentsIn**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-60 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### positionAmongstSiblings[​](#positionamongstsiblings "Direct link to heading")

▸ **positionAmongstSiblings**(`portalId?`): `Promise`<`undefined` | `number`\>

#### Parameters[​](#parameters-16 "Direct link to heading")

Name

Type

`portalId?`

`string`

#### Returns[​](#returns-61 "Direct link to heading")

`Promise`<`undefined` | `number`\>

* * *

### positionAmongstVisibleSiblings[​](#positionamongstvisiblesiblings "Direct link to heading")

▸ **positionAmongstVisibleSiblings**(`portalId?`): `Promise`<`undefined` | `number`\>

#### Parameters[​](#parameters-17 "Direct link to heading")

Name

Type

`portalId?`

`string`

#### Returns[​](#returns-62 "Direct link to heading")

`Promise`<`undefined` | `number`\>

* * *

### remove[​](#remove "Direct link to heading")

▸ **remove**(): `Promise`<`void`\>

#### Returns[​](#returns-63 "Direct link to heading")

`Promise`<`void`\>

* * *

### removeFromPortal[​](#removefromportal "Direct link to heading")

▸ **removeFromPortal**(`portal`): `Promise`<`void`\>

#### Parameters[​](#parameters-18 "Direct link to heading")

Name

Type

`portal`

`string` | [`Rem`](/api/classes/Rem)

#### Returns[​](#returns-64 "Direct link to heading")

`Promise`<`void`\>

* * *

### removePowerup[​](#removepowerup "Direct link to heading")

▸ **removePowerup**(`powerupCode`): `Promise`<`void`\>

#### Parameters[​](#parameters-19 "Direct link to heading")

Name

Type

`powerupCode`

`string`

#### Returns[​](#returns-65 "Direct link to heading")

`Promise`<`void`\>

* * *

### removeSource[​](#removesource "Direct link to heading")

▸ **removeSource**(`source`): `Promise`<`void`\>

#### Parameters[​](#parameters-20 "Direct link to heading")

Name

Type

`source`

`string` | [`Rem`](/api/classes/Rem)

#### Returns[​](#returns-66 "Direct link to heading")

`Promise`<`void`\>

* * *

### removeTag[​](#removetag "Direct link to heading")

▸ **removeTag**(`tagId`, `removeProperties?`): `Promise`<`void`\>

#### Parameters[​](#parameters-21 "Direct link to heading")

Name

Type

Default value

`tagId`

`string`

`undefined`

`removeProperties`

`boolean`

`false`

#### Returns[​](#returns-67 "Direct link to heading")

`Promise`<`void`\>

* * *

### remsBeingReferenced[​](#remsbeingreferenced "Direct link to heading")

▸ **remsBeingReferenced**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-68 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### remsReferencingThis[​](#remsreferencingthis "Direct link to heading")

▸ **remsReferencingThis**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-69 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### scrollToReaderHighlight[​](#scrolltoreaderhighlight "Direct link to heading")

▸ **scrollToReaderHighlight**(): `Promise`<`void`\>

#### Returns[​](#returns-70 "Direct link to heading")

`Promise`<`void`\>

* * *

### setBackText[​](#setbacktext "Direct link to heading")

▸ **setBackText**(`backText`): `Promise`<`void`\>

#### Parameters[​](#parameters-22 "Direct link to heading")

Name

Type

`backText`

`undefined` | [`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-71 "Direct link to heading")

`Promise`<`void`\>

* * *

### setEnablePractice[​](#setenablepractice "Direct link to heading")

▸ **setEnablePractice**(`enablePractice`): `Promise`<`void`\>

#### Parameters[​](#parameters-23 "Direct link to heading")

Name

Type

`enablePractice`

`boolean`

#### Returns[​](#returns-72 "Direct link to heading")

`Promise`<`void`\>

* * *

### setFontSize[​](#setfontsize "Direct link to heading")

▸ **setFontSize**(`fontSize`): `Promise`<`void`\>

#### Parameters[​](#parameters-24 "Direct link to heading")

Name

Type

`fontSize`

`undefined` | `"H1"` | `"H2"` | `"H3"`

#### Returns[​](#returns-73 "Direct link to heading")

`Promise`<`void`\>

* * *

### setHighlightColor[​](#sethighlightcolor "Direct link to heading")

▸ **setHighlightColor**(`highlightColor`): `Promise`<`void`\>

#### Parameters[​](#parameters-25 "Direct link to heading")

Name

Type

`highlightColor`

`"Red"` | `"Orange"` | `"Yellow"` | `"Green"` | `"Blue"` | `"Purple"`

#### Returns[​](#returns-74 "Direct link to heading")

`Promise`<`void`\>

* * *

### setIsCardItem[​](#setiscarditem "Direct link to heading")

▸ **setIsCardItem**(`isCardItem`): `Promise`<`void`\>

#### Parameters[​](#parameters-26 "Direct link to heading")

Name

Type

`isCardItem`

`boolean`

#### Returns[​](#returns-75 "Direct link to heading")

`Promise`<`void`\>

* * *

### setIsCode[​](#setiscode "Direct link to heading")

▸ **setIsCode**(`isCode`): `Promise`<`void`\>

#### Parameters[​](#parameters-27 "Direct link to heading")

Name

Type

`isCode`

`boolean`

#### Returns[​](#returns-76 "Direct link to heading")

`Promise`<`void`\>

* * *

### setIsCollapsed[​](#setiscollapsed "Direct link to heading")

▸ **setIsCollapsed**(`isCollapsed`, `portalId`): `Promise`<`boolean`\>

#### Parameters[​](#parameters-28 "Direct link to heading")

Name

Type

`isCollapsed`

`boolean`

`portalId`

`string`

#### Returns[​](#returns-77 "Direct link to heading")

`Promise`<`boolean`\>

* * *

### setIsDocument[​](#setisdocument "Direct link to heading")

▸ **setIsDocument**(`isDocument`): `Promise`<`void`\>

#### Parameters[​](#parameters-29 "Direct link to heading")

Name

Type

`isDocument`

`boolean`

#### Returns[​](#returns-78 "Direct link to heading")

`Promise`<`void`\>

* * *

### setIsListItem[​](#setislistitem "Direct link to heading")

▸ **setIsListItem**(`isListItem`): `Promise`<`void`\>

#### Parameters[​](#parameters-30 "Direct link to heading")

Name

Type

`isListItem`

`boolean`

#### Returns[​](#returns-79 "Direct link to heading")

`Promise`<`void`\>

* * *

### setIsProperty[​](#setisproperty "Direct link to heading")

▸ **setIsProperty**(`isProperty`): `Promise`<`void`\>

#### Parameters[​](#parameters-31 "Direct link to heading")

Name

Type

`isProperty`

`boolean`

#### Returns[​](#returns-80 "Direct link to heading")

`Promise`<`void`\>

* * *

### setIsQuote[​](#setisquote "Direct link to heading")

▸ **setIsQuote**(`isQuote`): `Promise`<`void`\>

#### Parameters[​](#parameters-32 "Direct link to heading")

Name

Type

`isQuote`

`boolean`

#### Returns[​](#returns-81 "Direct link to heading")

`Promise`<`void`\>

* * *

### setIsSlot[​](#setisslot "Direct link to heading")

▸ **setIsSlot**(`isSlot`): `Promise`<`void`\>

#### Parameters[​](#parameters-33 "Direct link to heading")

Name

Type

`isSlot`

`boolean`

#### Returns[​](#returns-82 "Direct link to heading")

`Promise`<`void`\>

* * *

### setIsTodo[​](#setistodo "Direct link to heading")

▸ **setIsTodo**(`isTodo`): `Promise`<`void`\>

#### Parameters[​](#parameters-34 "Direct link to heading")

Name

Type

`isTodo`

`boolean`

#### Returns[​](#returns-83 "Direct link to heading")

`Promise`<`void`\>

* * *

### setParent[​](#setparent "Direct link to heading")

▸ **setParent**(`parent`, `positionAmongstSiblings?`): `Promise`<`void`\>

#### Parameters[​](#parameters-35 "Direct link to heading")

Name

Type

`parent`

`null` | `string` | [`Rem`](/api/classes/Rem)

`positionAmongstSiblings?`

`number`

#### Returns[​](#returns-84 "Direct link to heading")

`Promise`<`void`\>

* * *

### setPracticeDirection[​](#setpracticedirection "Direct link to heading")

▸ **setPracticeDirection**(`direction`): `Promise`<`void`\>

#### Parameters[​](#parameters-36 "Direct link to heading")

Name

Type

`direction`

`"both"` | `"none"` | `"forward"` | `"backward"`

#### Returns[​](#returns-85 "Direct link to heading")

`Promise`<`void`\>

* * *

### setTableFilter[​](#settablefilter "Direct link to heading")

▸ **setTableFilter**(`filter`): `Promise`<`void`\>

#### Parameters[​](#parameters-37 "Direct link to heading")

Name

Type

`filter`

[`SearchPortalQuery`](/api/modules#searchportalquery-1)

#### Returns[​](#returns-86 "Direct link to heading")

`Promise`<`void`\>

* * *

### setTagPropertyValue[​](#settagpropertyvalue "Direct link to heading")

▸ **setTagPropertyValue**(`propertyId`, `value`): `Promise`<`void`\>

#### Parameters[​](#parameters-38 "Direct link to heading")

Name

Type

`propertyId`

`string`

`value`

`undefined` | [`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-87 "Direct link to heading")

`Promise`<`void`\>

* * *

### setText[​](#settext "Direct link to heading")

▸ **setText**(`text`): `Promise`<`void`\>

#### Parameters[​](#parameters-39 "Direct link to heading")

Name

Type

`text`

[`RichTextInterface`](/api/modules#richtextinterface)

#### Returns[​](#returns-88 "Direct link to heading")

`Promise`<`void`\>

* * *

### setTodoStatus[​](#settodostatus "Direct link to heading")

▸ **setTodoStatus**(`todoStatus`): `Promise`<`void`\>

#### Parameters[​](#parameters-40 "Direct link to heading")

Name

Type

`todoStatus`

`"Finished"` | `"Unfinished"`

#### Returns[​](#returns-89 "Direct link to heading")

`Promise`<`void`\>

* * *

### setType[​](#settype "Direct link to heading")

▸ **setType**(`type`): `Promise`<`void`\>

#### Parameters[​](#parameters-41 "Direct link to heading")

Name

Type

`type`

[`SetRemType`](/api/enums/SetRemType)

#### Returns[​](#returns-90 "Direct link to heading")

`Promise`<`void`\>

* * *

### siblingRem[​](#siblingrem "Direct link to heading")

▸ **siblingRem**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-91 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### taggedRem[​](#taggedrem "Direct link to heading")

▸ **taggedRem**(): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Returns[​](#returns-92 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>

* * *

### timesSelectedInSearch[​](#timesselectedinsearch "Direct link to heading")

▸ **timesSelectedInSearch**(): `Promise`<`number`\>

#### Returns[​](#returns-93 "Direct link to heading")

`Promise`<`number`\>

* * *

### visibleSiblingRem[​](#visiblesiblingrem "Direct link to heading")

▸ **visibleSiblingRem**(`portalId?`): `Promise`<[`Rem`](/api/classes/Rem)\[\]\>

#### Parameters[​](#parameters-42 "Direct link to heading")

Name

Type

`portalId?`

`string`

#### Returns[​](#returns-94 "Direct link to heading")

`Promise`<[`Rem`](/api/classes/Rem)\[\]\>
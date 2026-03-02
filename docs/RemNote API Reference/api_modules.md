<!-- source: https://plugins.remnote.com/api/modules -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   API Reference
-   All Internals
-   Exports

On this page

# @remnote/plugin-sdk

## Enumerations[​](#enumerations "Direct link to heading")

-   [BuiltInPowerupCodes](/api/enums/BuiltInPowerupCodes)
-   [CheckboxMatcher](/api/enums/CheckboxMatcher)
-   [ComponentFocusableItemType](/api/enums/ComponentFocusableItemType)
-   [DateMatcher](/api/enums/DateMatcher)
-   [EmbedComponentType](/api/enums/EmbedComponentType)
-   [FocusPropsType](/api/enums/FocusPropsType)
-   [MoveUnit](/api/enums/MoveUnit)
-   [MultiSelectMatcher](/api/enums/MultiSelectMatcher)
-   [NumberMatcher](/api/enums/NumberMatcher)
-   [PORTAL\_TYPE](/api/enums/PORTAL_TYPE)
-   [PageType](/api/enums/PageType)
-   [PluginCommandMenuLocation](/api/enums/PluginCommandMenuLocation)
-   [PropertyLocation](/api/enums/PropertyLocation)
-   [PropertyType](/api/enums/PropertyType)
-   [QueryExpressionType](/api/enums/QueryExpressionType)
-   [QueryNodeType](/api/enums/QueryNodeType)
-   [QueueInteractionScore](/api/enums/QueueInteractionScore)
-   [QueueItemType](/api/enums/QueueItemType)
-   [REM\_TYPE](/api/enums/REM_TYPE)
-   [RelativeDateMatcher](/api/enums/RelativeDateMatcher)
-   [RelativeDateModifier](/api/enums/RelativeDateModifier)
-   [RelativeDatePeriod](/api/enums/RelativeDatePeriod)
-   [RemColor](/api/enums/RemColor)
-   [RemType](/api/enums/RemType)
-   [RemTypeTinyGraph](/api/enums/RemTypeTinyGraph)
-   [SelectSourceType](/api/enums/SelectSourceType)
-   [SelectionType](/api/enums/SelectionType)
-   [SetRemType](/api/enums/SetRemType)
-   [SingleSelectMatcher](/api/enums/SingleSelectMatcher)
-   [SpecialPluginCallback](/api/enums/SpecialPluginCallback)
-   [TextMatcher](/api/enums/TextMatcher)
-   [WidgetLocation](/api/enums/WidgetLocation)

## Component Classes[​](#component-classes "Direct link to heading")

-   [LoadingSpinner](/api/classes/LoadingSpinner)
-   [PreviewRemCards](/api/classes/PreviewRemCards)
-   [Queue](/api/classes/Queue)
-   [RemHierarchyEditorTree](/api/classes/RemHierarchyEditorTree)
-   [RemRichTextEditor](/api/classes/RemRichTextEditor)
-   [RemViewer](/api/classes/RemViewer)
-   [RichText](/api/classes/RichText)
-   [RichTextEditor](/api/classes/RichTextEditor)

## Other Classes[​](#other-classes "Direct link to heading")

-   [AppNamespace](/api/classes/AppNamespace)
-   [Card](/api/classes/Card)
-   [CardNamespace](/api/classes/CardNamespace)
-   [DateNamespace](/api/classes/DateNamespace)
-   [DocumentViewer](/api/classes/DocumentViewer)
-   [EditorNamespace](/api/classes/EditorNamespace)
-   [EventNamespace](/api/classes/EventNamespace)
-   [FocusNamespace](/api/classes/FocusNamespace)
-   [KnowledgeBaseNamespace](/api/classes/KnowledgeBaseNamespace)
-   [MessagingNamespace](/api/classes/MessagingNamespace)
-   [PDFWebReader](/api/classes/PDFWebReader)
-   [PowerupNamespace](/api/classes/PowerupNamespace)
-   [Query](/api/classes/Query)
-   [QueueNamespace](/api/classes/QueueNamespace)
-   [RNPlugin](/api/classes/RNPlugin)
-   [ReaderNamespace](/api/classes/ReaderNamespace)
-   [Rem](/api/classes/Rem)
-   [RemNamespace](/api/classes/RemNamespace)
-   [RichTextNamespace](/api/classes/RichTextNamespace)
-   [SchedulerNamespace](/api/classes/SchedulerNamespace)
-   [SearchNamespace](/api/classes/SearchNamespace)
-   [SettingsNamespace](/api/classes/SettingsNamespace)
-   [StorageNamespace](/api/classes/StorageNamespace)
-   [WidgetNamespace](/api/classes/WidgetNamespace)
-   [WindowNamespace](/api/classes/WindowNamespace)

## Component Interfaces[​](#component-interfaces "Direct link to heading")

-   [QueueProps](/api/interfaces/QueueProps)

## Other Interfaces[​](#other-interfaces "Direct link to heading")

-   [CardData](/api/interfaces/CardData)
-   [Command](/api/interfaces/Command)
-   [CommandArgs](/api/interfaces/CommandArgs)
-   [ComponentDimensionsProps](/api/interfaces/ComponentDimensionsProps)
-   [ComponentFocusableItem](/api/interfaces/ComponentFocusableItem)
-   [CreateFakeEmbedComponentArgs](/api/interfaces/CreateFakeEmbedComponentArgs)
-   [FocusContext](/api/interfaces/FocusContext)
-   [FocusPropsSelectRangeType](/api/interfaces/FocusPropsSelectRangeType)
-   [FocusPropsTextType](/api/interfaces/FocusPropsTextType)
-   [LegacySearchPortalSingleSelectQueryExpression](/api/interfaces/LegacySearchPortalSingleSelectQueryExpression)
-   [LoadingSpinnerProps](/api/interfaces/LoadingSpinnerProps)
-   [MosaicParent](/api/interfaces/MosaicParent)
-   [PDFWebReaderProps](/api/interfaces/PDFWebReaderProps)
-   [PluginDocumentViewProps](/api/interfaces/PluginDocumentViewProps)
-   [PluginDropdownSetting](/api/interfaces/PluginDropdownSetting)
-   [PluginMenuItem](/api/interfaces/PluginMenuItem)
-   [PluginNumberSetting](/api/interfaces/PluginNumberSetting)
-   [PluginQueueCardData](/api/interfaces/PluginQueueCardData)
-   [PluginSettingBase](/api/interfaces/PluginSettingBase)
-   [PluginStringSetting](/api/interfaces/PluginStringSetting)
-   [PreviewRemCardsProps](/api/interfaces/PreviewRemCardsProps)
-   [ReaderSelection](/api/interfaces/ReaderSelection)
-   [RemData](/api/interfaces/RemData)
-   [RemHierarchyEditorTreeProps](/api/interfaces/RemHierarchyEditorTreeProps)
-   [RemRichTextEditorProps](/api/interfaces/RemRichTextEditorProps)
-   [RemSelection](/api/interfaces/RemSelection)
-   [RemViewerProps](/api/interfaces/RemViewerProps)
-   [RepetitionStatus](/api/interfaces/RepetitionStatus)
-   [RichTextEditorProps](/api/interfaces/RichTextEditorProps)
-   [RichTextProps](/api/interfaces/RichTextProps)
-   [SearchPortalCheckboxQueryExpression](/api/interfaces/SearchPortalCheckboxQueryExpression)
-   [SearchPortalDateQueryExpression](/api/interfaces/SearchPortalDateQueryExpression)
-   [SearchPortalGroupQueryNode](/api/interfaces/SearchPortalGroupQueryNode)
-   [SearchPortalMultiSelectQueryExpression](/api/interfaces/SearchPortalMultiSelectQueryExpression)
-   [SearchPortalNumberQueryExpression](/api/interfaces/SearchPortalNumberQueryExpression)
-   [SearchPortalRefQueryExpression](/api/interfaces/SearchPortalRefQueryExpression)
-   [SearchPortalRemTypeQueryExpression](/api/interfaces/SearchPortalRemTypeQueryExpression)
-   [SearchPortalSingleSelectQueryExpression](/api/interfaces/SearchPortalSingleSelectQueryExpression)
-   [SearchPortalSlotQueryNode](/api/interfaces/SearchPortalSlotQueryNode)
-   [SearchPortalTextQueryExpression](/api/interfaces/SearchPortalTextQueryExpression)
-   [SearchPortalUnaryQueryNode](/api/interfaces/SearchPortalUnaryQueryNode)
-   [SimpleCommand](/api/interfaces/SimpleCommand)
-   [SlashCommand](/api/interfaces/SlashCommand)
-   [SpecialPluginCallbackInfo](/api/interfaces/SpecialPluginCallbackInfo)
-   [SubscriptionInfo](/api/interfaces/SubscriptionInfo)
-   [TextSelection](/api/interfaces/TextSelection)
-   [WidgetLocationContextDataMap](/api/interfaces/WidgetLocationContextDataMap)
-   [WidgetOptions](/api/interfaces/WidgetOptions)

## Type Aliases[​](#type-aliases "Direct link to heading")

### AppEventListerKey[​](#appeventlisterkey "Direct link to heading")

Ƭ **AppEventListerKey**: `string` | `undefined`

* * *

### CallbackFn[​](#callbackfn "Direct link to heading")

Ƭ **CallbackFn**: (`context`: `Record`<`string`, `any`\>) => `unknown` | `Promise`<`unknown`\>

#### Type declaration[​](#type-declaration "Direct link to heading")

▸ (`context`): `unknown` | `Promise`<`unknown`\>

##### Parameters[​](#parameters "Direct link to heading")

Name

Type

`context`

`Record`<`string`, `any`\>

##### Returns[​](#returns "Direct link to heading")

`unknown` | `Promise`<`unknown`\>

* * *

### CardType[​](#cardtype "Direct link to heading")

Ƭ **CardType**: `"forward"` | `"backward"` | { `clozeId`: `string` }

* * *

### ComponentFocusId[​](#componentfocusid "Direct link to heading")

Ƭ **ComponentFocusId**: [`ComponentFocusableItem`](/api/interfaces/ComponentFocusableItem)\[\]

* * *

### EditorRange[​](#editorrange "Direct link to heading")

Ƭ **EditorRange**: `Object`

#### Type declaration[​](#type-declaration-1 "Direct link to heading")

Name

Type

`end`

`number`

`start`

`number`

* * *

### EventCallbackFn[​](#eventcallbackfn "Direct link to heading")

Ƭ **EventCallbackFn**: (`event`: `any`) => `void`

#### Type declaration[​](#type-declaration-2 "Direct link to heading")

▸ (`event`): `void`

##### Parameters[​](#parameters-1 "Direct link to heading")

Name

Type

`event`

`any`

##### Returns[​](#returns-1 "Direct link to heading")

`void`

* * *

### FocusElementProps[​](#focuselementprops "Direct link to heading")

Ƭ **FocusElementProps**: `Partial`<[`FocusPropsTextType`](/api/interfaces/FocusPropsTextType)\> | `Partial`<[`FocusPropsSelectRangeType`](/api/interfaces/FocusPropsSelectRangeType)\> | `undefined`

* * *

### KnowledgeBaseId[​](#knowledgebaseid "Direct link to heading")

Ƭ **KnowledgeBaseId**: `string` | `null`

* * *

### MosaicDirection[​](#mosaicdirection "Direct link to heading")

Ƭ **MosaicDirection**: `"row"` | `"column"`

* * *

### MosaicNode[​](#mosaicnode "Direct link to heading")

Ƭ **MosaicNode**<`T`\>: [`MosaicParent`](/api/interfaces/MosaicParent)<`T`\> | `T`

#### Type parameters[​](#type-parameters "Direct link to heading")

Name

`T`

* * *

### NumberValidatorArray[​](#numbervalidatorarray "Direct link to heading")

Ƭ **NumberValidatorArray**: `z.TypeOf`<typeof [`numberValidatorSig`](/api/modules#numbervalidatorsig)\>\[\]

* * *

### OperatingSystem[​](#operatingsystem "Direct link to heading")

Ƭ **OperatingSystem**: `"mac"` | `"windows"` | `"linux"` | `"ios"` | `"android"`

* * *

### PaneIdWindowTree[​](#paneidwindowtree "Direct link to heading")

Ƭ **PaneIdWindowTree**: [`MosaicNode`](/api/modules#mosaicnode)<`string`\>

* * *

### PaneRem[​](#panerem "Direct link to heading")

Ƭ **PaneRem**: `Object`

#### Type declaration[​](#type-declaration-3 "Direct link to heading")

Name

Type

`paneId`

`string`

`remId`

`string`

* * *

### PaneRemWindowTree[​](#paneremwindowtree "Direct link to heading")

Ƭ **PaneRemWindowTree**: [`PaneRem`](/api/modules#panerem) | [`MosaicParent`](/api/interfaces/MosaicParent)<[`PaneRem`](/api/modules#panerem)\>

* * *

### PaneTree[​](#panetree "Direct link to heading")

Ƭ **PaneTree**: [`MosaicParent`](/api/interfaces/MosaicParent)<`string`\>

* * *

### Platform[​](#platform "Direct link to heading")

Ƭ **Platform**: `"app"` | `"web"`

* * *

### PluginAccessKnowledgeBaseInfoScope[​](#pluginaccessknowledgebaseinfoscope "Direct link to heading")

Ƭ **PluginAccessKnowledgeBaseInfoScope**: `z.TypeOf`<typeof `PluginAccessKnowledgeBaseInfoScopeSig`\>

* * *

### PluginId[​](#pluginid "Direct link to heading")

Ƭ **PluginId**: `string`

* * *

### PluginManifest[​](#pluginmanifest "Direct link to heading")

Ƭ **PluginManifest**: `z.TypeOf`<typeof `PluginManifestV1Sig`\>

* * *

### PluginSchedulerParameter[​](#pluginschedulerparameter "Direct link to heading")

Ƭ **PluginSchedulerParameter**: [`PluginNumberSetting`](/api/interfaces/PluginNumberSetting) & { `type`: `"number"` } | [`PluginStringSetting`](/api/interfaces/PluginStringSetting) & { `type`: `"string"` } | [`PluginDropdownSetting`](/api/interfaces/PluginDropdownSetting) & { `type`: `"dropdown"` } | [`PluginSettingBase`](/api/interfaces/PluginSettingBase)<`boolean`\> & { `type`: `"boolean"` }

* * *

### PluginSchedulerParameterWithValue[​](#pluginschedulerparameterwithvalue "Direct link to heading")

Ƭ **PluginSchedulerParameterWithValue**: [`PluginNumberSetting`](/api/interfaces/PluginNumberSetting) & { `type`: `"number"` ; `value`: `number` | `undefined` } | [`PluginStringSetting`](/api/interfaces/PluginStringSetting) & { `type`: `"string"` ; `value`: `string` | `undefined` } | [`PluginDropdownSetting`](/api/interfaces/PluginDropdownSetting) & { `type`: `"dropdown"` ; `value`: `string` | `undefined` } | [`PluginSettingBase`](/api/interfaces/PluginSettingBase)<`boolean`\> & { `type`: `"boolean"` ; `value`: `boolean` | `undefined` }

* * *

### PowerupCode[​](#powerupcode "Direct link to heading")

Ƭ **PowerupCode**: `string`

* * *

### PowerupSlotCode[​](#powerupslotcode "Direct link to heading")

Ƭ **PowerupSlotCode**: `string`

* * *

### PowerupSlotCodeMap[​](#powerupslotcodemap "Direct link to heading")

Ƭ **PowerupSlotCodeMap**: typeof [`PowerupSlotCodeMap`](/api/modules#powerupslotcodemap-1)

* * *

### QueryRemType[​](#queryremtype "Direct link to heading")

Ƭ **QueryRemType**: `"concept"` | `"descriptor"` | `"none"`

* * *

### RICH\_TEXT\_FORMATTING\_KEYS[​](#rich_text_formatting_keys "Direct link to heading")

Ƭ **RICH\_TEXT\_FORMATTING\_KEYS**: keyof typeof [`RICH_TEXT_FORMATTING`](/api/modules#rich_text_formatting)

* * *

### RICH\_TEXT\_FORMATTING\_VALUES[​](#rich_text_formatting_values "Direct link to heading")

Ƭ **RICH\_TEXT\_FORMATTING\_VALUES**: typeof [`RICH_TEXT_FORMATTING`](/api/modules#rich_text_formatting)\[[`RICH_TEXT_FORMATTING_KEYS`](/api/modules#rich_text_formatting_keys)\]

* * *

### RegisterPowerupOptions[​](#registerpowerupoptions "Direct link to heading")

Ƭ **RegisterPowerupOptions**: `z.infer`<typeof [`RegisterPowerupOptions`](/api/modules#registerpowerupoptions-1)\>

* * *

### RemId[​](#remid "Direct link to heading")

Ƭ **RemId**: `string`

* * *

### RemIdWindowTree[​](#remidwindowtree "Direct link to heading")

Ƭ **RemIdWindowTree**: [`MosaicNode`](/api/modules#mosaicnode)<`string`\>

* * *

### RichTextAddIconInterface[​](#richtextaddiconinterface "Direct link to heading")

Ƭ **RichTextAddIconInterface**: `Object`

#### Type declaration[​](#type-declaration-4 "Direct link to heading")

Name

Type

`i`

`"ai"`

`size?`

`string`

* * *

### RichTextAnnotationInterface[​](#richtextannotationinterface "Direct link to heading")

Ƭ **RichTextAnnotationInterface**: `Object`

#### Type declaration[​](#type-declaration-5 "Direct link to heading")

Name

Type

`highlighterSerialization`

{ `text`: `string` }

`highlighterSerialization.text`

`string`

`i`

`"n"`

`text`

`string`

`url`

`string`

* * *

### RichTextAudioInterface[​](#richtextaudiointerface "Direct link to heading")

Ƭ **RichTextAudioInterface**: `Object`

#### Type declaration[​](#type-declaration-6 "Direct link to heading")

Name

Type

`height?`

`number`

`i`

`"a"`

`onlyAudio?`

`boolean`

`percent?`

`25` | `50` | `100`

`url`

`string`

`width?`

`number`

* * *

### RichTextCardDelimiterInterface[​](#richtextcarddelimiterinterface "Direct link to heading")

Ƭ **RichTextCardDelimiterInterface**: `Object`

#### Type declaration[​](#type-declaration-7 "Direct link to heading")

Name

Type

`delimiterCharacterForSerialization?`

`string`

`i`

`"s"`

* * *

### RichTextElementInterface[​](#richtextelementinterface "Direct link to heading")

Ƭ **RichTextElementInterface**: [`RichTextElementItemInterface`](/api/modules#richtextelementiteminterface) | `string` & { `i?`: `undefined` }

* * *

### RichTextElementItemInterface[​](#richtextelementiteminterface "Direct link to heading")

Ƭ **RichTextElementItemInterface**: [`RichTextElementTextInterface`](/api/modules#richtextelementtextinterface) | [`RichTextElementRemInterface`](/api/modules#richtextelementreminterface) | [`RichTextImageInterface`](/api/modules#richtextimageinterface) | [`RichTextAudioInterface`](/api/modules#richtextaudiointerface) | [`RichTextPluginInterface`](/api/modules#richtextplugininterface) | [`RichTextGlobalNameInterface`](/api/modules#richtextglobalnameinterface) | [`RichTextLatexInterface`](/api/modules#richtextlatexinterface) | [`RichTextCardDelimiterInterface`](/api/modules#richtextcarddelimiterinterface) | [`RichTextAnnotationInterface`](/api/modules#richtextannotationinterface) | [`RichTextFlashcardIconInterface`](/api/modules#richtextflashcardiconinterface) | [`RichTextAddIconInterface`](/api/modules#richtextaddiconinterface)

* * *

### RichTextElementRemInterface[​](#richtextelementreminterface "Direct link to heading")

Ƭ **RichTextElementRemInterface**: `Object`

#### Type declaration[​](#type-declaration-8 "Direct link to heading")

Name

Type

`_id`

[`RemId`](/api/modules#remid)

`aliasId?`

[`RemId`](/api/modules#remid)

`content?`

`boolean`

`i`

`"q"`

`pin?`

`boolean`

`showFullName?`

`boolean`

`textOfDeletedRem?`

[`RichTextInterface`](/api/modules#richtextinterface)

* * *

### RichTextElementTextInterface[​](#richtextelementtextinterface "Direct link to heading")

Ƭ **RichTextElementTextInterface**: `Object`

#### Type declaration[​](#type-declaration-9 "Direct link to heading")

Name

Type

`b?`

`boolean`

`block?`

`boolean`

`cId?`

`string`

`code?`

`boolean`

`h?`

`number` | `string`

`hiddenCloze?`

`boolean`

`i`

`"m"`

`l?`

`boolean`

`language?`

`string`

`q?`

`boolean`

`qId?`

`string`

`revealedCloze?`

`boolean`

`tc?`

`number` | `string`

`text`

`string`

`title?`

`string`

`u?`

`boolean`

`url?`

`string`

`workInProgressPortal?`

`boolean`

`workInProgressRem?`

`boolean`

`workInProgressTag?`

`boolean`

* * *

### RichTextFlashcardIconInterface[​](#richtextflashcardiconinterface "Direct link to heading")

Ƭ **RichTextFlashcardIconInterface**: `Object`

#### Type declaration[​](#type-declaration-10 "Direct link to heading")

Name

Type

`i`

`"fi"`

`size?`

`string`

* * *

### RichTextFormatName[​](#richtextformatname "Direct link to heading")

Ƭ **RichTextFormatName**: keyof typeof [`richTextFormatNameCodeMap`](/api/modules#richtextformatnamecodemap) | keyof `Omit`<typeof [`RemColor`](/api/enums/RemColor), `"undefined"`\> | `"cloze"`

* * *

### RichTextFormattingTypeInterface[​](#richtextformattingtypeinterface "Direct link to heading")

Ƭ **RichTextFormattingTypeInterface**: `"cId"` | `"u"` | `"b"` | `"l"` | `"qId"` | `"q"` | `"hiddenCloze"` | `"revealedCloze"` | `"h"` | `"url"` | `"code"` | `"c"` | `"language"`

* * *

### RichTextGlobalNameInterface[​](#richtextglobalnameinterface "Direct link to heading")

Ƭ **RichTextGlobalNameInterface**: `Object`

#### Type declaration[​](#type-declaration-11 "Direct link to heading")

Name

Type

`_id`

`string` | `null`

`i`

`"g"`

* * *

### RichTextImageClozeBlockInterface[​](#richtextimageclozeblockinterface "Direct link to heading")

Ƭ **RichTextImageClozeBlockInterface**: `Object`

#### Type declaration[​](#type-declaration-12 "Direct link to heading")

Name

Type

`cId`

`string`

`detectedText?`

`string`

`frontLabel?`

[`RichTextInterface`](/api/modules#richtextinterface) | `string`

`height`

`number`

`label?`

[`RichTextInterface`](/api/modules#richtextinterface) | `string`

`linkedRemId?`

[`RemId`](/api/modules#remid) | `string`

`primary?`

`boolean`

`rotation`

`number`

`width`

`number`

`x`

`number`

`y`

`number`

* * *

### RichTextImageInterface[​](#richtextimageinterface "Direct link to heading")

Ƭ **RichTextImageInterface**: `Object`

#### Type declaration[​](#type-declaration-13 "Direct link to heading")

Name

Type

`blocks?`

[`RichTextImageClozeBlockInterface`](/api/modules#richtextimageclozeblockinterface)\[\]

`clozeOrder?`

`ClozeIdentifier`\[\]

`frontLabel?`

[`RichTextInterface`](/api/modules#richtextinterface)

`height?`

`number`

`i`

`"i"`

`imgId?`

`string`

`label?`

[`RichTextInterface`](/api/modules#richtextinterface)

`loading?`

`boolean`

`openOcclusionPopup?`

`boolean`

`percent?`

`25` | `50` | `100`

`practiceInOrder?`

`boolean`

`title?`

`string`

`transparent?`

`boolean`

`url`

`string`

`width?`

`number`

* * *

### RichTextInterface[​](#richtextinterface "Direct link to heading")

Ƭ **RichTextInterface**: [`RichTextElementInterface`](/api/modules#richtextelementinterface)\[\]

* * *

### RichTextLatexInterface[​](#richtextlatexinterface "Direct link to heading")

Ƭ **RichTextLatexInterface**: `Object`

#### Type declaration[​](#type-declaration-14 "Direct link to heading")

Name

Type

`block?`

`boolean`

`cId?`

`string`

`i`

`"x"`

`latexClozes?`

`string`\[\]

`text`

`string`

* * *

### RichTextPluginInterface[​](#richtextplugininterface "Direct link to heading")

Ƭ **RichTextPluginInterface**: `Object`

#### Type declaration[​](#type-declaration-15 "Direct link to heading")

Name

Type

`i`

`"p"`

`pluginName?`

`string`

`url`

`string`

* * *

### RichTextStoreHighlightColor[​](#richtextstorehighlightcolor "Direct link to heading")

Ƭ **RichTextStoreHighlightColor**: `string`

* * *

### SRSScheduleCardParams[​](#srsschedulecardparams "Direct link to heading")

Ƭ **SRSScheduleCardParams**: `Parameters`<[`SpecialPluginCallbackInfo`](/api/interfaces/SpecialPluginCallbackInfo)\[[`SRSScheduleCard`](/api/enums/SpecialPluginCallback#srsschedulecard)\]\>\[`0`\]

* * *

### SRSScheduleCardResult[​](#srsschedulecardresult "Direct link to heading")

Ƭ **SRSScheduleCardResult**: `Awaited`<`ReturnType`<[`SpecialPluginCallbackInfo`](/api/interfaces/SpecialPluginCallbackInfo)\[[`SRSScheduleCard`](/api/enums/SpecialPluginCallback#srsschedulecard)\]\>\>

* * *

### SearchPortalQuery[​](#searchportalquery "Direct link to heading")

Ƭ **SearchPortalQuery**: [`SearchPortalUnaryQueryNode`](/api/modules#searchportalunaryquerynode) | [`SearchPortalGroupQueryNode`](/api/modules#searchportalgroupquerynode) | [`SearchPortalSlotQueryNode`](/api/modules#searchportalslotquerynode) | [`SearchPortalQueryExpression`](/api/modules#searchportalqueryexpression-1)

* * *

### SearchPortalQueryExpression[​](#searchportalqueryexpression "Direct link to heading")

Ƭ **SearchPortalQueryExpression**: [`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression) | [`SearchPortalTextQueryExpression`](/api/modules#searchportaltextqueryexpression) | [`SearchPortalNumberQueryExpression`](/api/modules#searchportalnumberqueryexpression) | [`SearchPortalRemTypeQueryExpression`](/api/modules#searchportalremtypequeryexpression) | [`SearchPortalDateQueryExpression`](/api/modules#searchportaldatequeryexpression) | [`SearchPortalMultiSelectQueryExpression`](/api/modules#searchportalmultiselectqueryexpression) | [`SearchPortalSingleSelectQueryExpression`](/api/modules#searchportalsingleselectqueryexpression) | [`LegacySearchPortalSingleSelectQueryExpression`](/api/modules#legacysearchportalsingleselectqueryexpression) | [`SearchPortalCheckboxQueryExpression`](/api/modules#searchportalcheckboxqueryexpression) | [`SearchPortalDateQueryExpression`](/api/modules#searchportaldatequeryexpression)

* * *

### SlotCodesForPowerup[​](#slotcodesforpowerup "Direct link to heading")

Ƭ **SlotCodesForPowerup**<`PowerupCode`\>: keyof [`PowerupSlotCodeMap`](/api/modules#powerupslotcodemap-1)\[`PowerupCode`\]

#### Type parameters[​](#type-parameters-1 "Direct link to heading")

Name

Type

`PowerupCode`

extends [`BuiltInPowerupCodes`](/api/enums/BuiltInPowerupCodes)

* * *

### StringValidatorArray[​](#stringvalidatorarray "Direct link to heading")

Ƭ **StringValidatorArray**: `z.TypeOf`<typeof [`stringValidatorSig`](/api/modules#stringvalidatorsig)\>\[\]

* * *

### Version[​](#version "Direct link to heading")

Ƭ **Version**: `z.TypeOf`<typeof `VersionSig`\>

## Variables[​](#variables "Direct link to heading")

### AppEvents[​](#appevents "Direct link to heading")

• `Const` **AppEvents**: `Object`

#### Type declaration[​](#type-declaration-16 "Direct link to heading")

Name

Type

`ClickRemReference`

`string`

`ClickSidebarItem`

`string`

`CurrentWindowTreeChange`

`string`

`EditorSelectionChanged`

`string`

`EditorTextEdited`

`string`

`FakeEmbedComponentDimensionChange`

`string`

`FakeEmbedDOMEvent`

`string`

`FocusedPaneChange`

`string`

`FocusedPortalChange`

`string`

`FocusedRemChange`

`string`

`GlobalOpenRem`

`"global.open-rem"`

`GlobalRemChanged`

`string`

`MessageBroadcast`

`string`

`MouseOutLink`

`string`

`MouseOverLink`

`string`

`PowerupSlotChanged`

`string`

`QueueCompleteCard`

`"queue.complete-card"`

`QueueEnter`

`"queue.enter"`

`QueueExit`

`"queue.exit"`

`QueueLoadCard`

`"queue.load-card"`

`RemChanged`

`string`

`RevealAnswer`

`"queue.reveal-answer"`

`SettingChanged`

`string`

`StealKeyEvent`

`string`

`StorageLocalChange`

`string`

`StorageSessionChange`

`string`

`StorageSyncedChange`

`string`

`URLChange`

`"global.url-change"`

`onActivate`

`"onActivate"`

`onDeactivate`

`"onDeactivate"`

`setCustomCSS`

`"setCustomCSS"`

`setDarkMode`

`"setDarkMode"`

* * *

### DEPRECATED\_RICH\_TEXT\_ELEMENT\_TYPES[​](#deprecated_rich_text_element_types "Direct link to heading")

• `Const` **DEPRECATED\_RICH\_TEXT\_ELEMENT\_TYPES**: `Object`

#### Type declaration[​](#type-declaration-17 "Direct link to heading")

Name

Type

`BOLD`

`string`

`CLOZE`

`string`

`DATE`

`string`

`HIDDEN_CLOZE`

`string`

`HIGHLIGHT`

`string`

`INLINE_CODE`

`string`

`ITALIC`

`string`

`LINK`

`string`

`UNDERLINE`

`string`

* * *

### DEPRECATED\_RICH\_TEXT\_ELEMENT\_TYPES\_TO\_NEW\_FORMATTING[​](#deprecated_rich_text_element_types_to_new_formatting "Direct link to heading")

• `Const` **DEPRECATED\_RICH\_TEXT\_ELEMENT\_TYPES\_TO\_NEW\_FORMATTING**: `Object`

* * *

### DEPRECATED\_RICH\_TEXT\_FORMATTING\_TYPES[​](#deprecated_rich_text_formatting_types "Direct link to heading")

• `Const` **DEPRECATED\_RICH\_TEXT\_FORMATTING\_TYPES**: `Object`

#### Type declaration[​](#type-declaration-18 "Direct link to heading")

Name

Type

`LATEX`

`string`

* * *

### DateMatcherTypesToDisplayValue[​](#datematchertypestodisplayvalue "Direct link to heading")

• `Const` **DateMatcherTypesToDisplayValue**: `Record`<[`DateMatcher`](/api/enums/DateMatcher), `string`\>

* * *

### EditorEvents[​](#editorevents "Direct link to heading")

• `Const` **EditorEvents**: `Object`

#### Type declaration[​](#type-declaration-19 "Direct link to heading")

Name

Type

`EditorSelectionChanged`

`string`

`EditorTextEdited`

`string`

* * *

### FocusEvents[​](#focusevents "Direct link to heading")

• `Const` **FocusEvents**: `Object`

#### Type declaration[​](#type-declaration-20 "Direct link to heading")

Name

Type

`FocusedPortalChange`

`string`

`FocusedRemChange`

`string`

* * *

### GlobalEvent[​](#globalevent "Direct link to heading")

• `Const` **GlobalEvent**: `Object`

#### Type declaration[​](#type-declaration-21 "Direct link to heading")

Name

Type

`GlobalOpenRem`

`"global.open-rem"`

`URLChange`

`"global.url-change"`

* * *

### LegacySearchPortalSingleSelectQueryExpression[​](#legacysearchportalsingleselectqueryexpression "Direct link to heading")

• **LegacySearchPortalSingleSelectQueryExpression**: `ZodType`<[`LegacySearchPortalSingleSelectQueryExpression`](/api/modules#legacysearchportalsingleselectqueryexpression), `ZodTypeDef`, [`LegacySearchPortalSingleSelectQueryExpression`](/api/modules#legacysearchportalsingleselectqueryexpression)\>

* * *

### MessagingEvents[​](#messagingevents "Direct link to heading")

• `Const` **MessagingEvents**: `Object`

#### Type declaration[​](#type-declaration-22 "Direct link to heading")

Name

Type

`MessageBroadcast`

`string`

* * *

### MultiSelectMatcherTypesToDisplayValue[​](#multiselectmatchertypestodisplayvalue "Direct link to heading")

• `Const` **MultiSelectMatcherTypesToDisplayValue**: `Record`<[`MultiSelectMatcher`](/api/enums/MultiSelectMatcher), `string`\>

* * *

### NonRelativeMatcherTypes[​](#nonrelativematchertypes "Direct link to heading")

• `Const` **NonRelativeMatcherTypes**: `DateMatcher`\[\]

* * *

### NumberMatcherTypesToDisplayValue[​](#numbermatchertypestodisplayvalue "Direct link to heading")

• `Const` **NumberMatcherTypesToDisplayValue**: `Record`<[`NumberMatcher`](/api/enums/NumberMatcher), `string`\>

* * *

### PowerupEvent[​](#powerupevent "Direct link to heading")

• `Const` **PowerupEvent**: `Object`

#### Type declaration[​](#type-declaration-23 "Direct link to heading")

Name

Type

`ClickRemReference`

`string`

`MouseOutLink`

`string`

`MouseOverLink`

`string`

`PowerupSlotChanged`

`string`

* * *

### PowerupSlotCodeMap[​](#powerupslotcodemap-1 "Direct link to heading")

• `Const` **PowerupSlotCodeMap**: `Object`

#### Type declaration[​](#type-declaration-24 "Direct link to heading")

Name

Type

`a`

{ `SortDirection`: `string` = 'd' }

`a.SortDirection`

`string`

`at`

{ `Templates`: `string` = 't' }

`at.Templates`

`string`

`b`

{ `FileURL`: `string` = 'f'; `LastReadDate`: `string` = 'd'; `ReadPercent`: `string` = 'r'; `Title`: `string` = 't'; `URL`: `string` = 'u' }

`b.FileURL`

`string`

`b.LastReadDate`

`string`

`b.ReadPercent`

`string`

`b.Title`

`string`

`b.URL`

`string`

`c`

{}

`cd`

{ `DontBoundHeight`: `string` = 'b'; `DontWrap`: `string` = 'w'; `Language`: `string` = 'l' }

`cd.DontBoundHeight`

`string`

`cd.DontWrap`

`string`

`cd.Language`

`string`

`ct`

{ `Template`: `string` = 't' }

`ct.Template`

`string`

`d`

{ `Date`: `string` = 'd'; `Timestamp`: `string` = 's' }

`d.Date`

`string`

`d.Timestamp`

`string`

`de`

{ `ExamSchedulerCollection`: `string` = 'emcd'; `ExamSchedulerDate`: `string` = 'e'; `ExamSchedulerDesiredStability`: `string` = 'eds'; `ExamSchedulerMaxNewCardsPerDay`: `string` = 'emnc'; `ExamSchedulerMaxTotalCardsPerDay`: `string` = 'emtc'; `MaxNewCardsPerDay`: `string` = 'm'; `MaxTotalCardsPerDay`: `string` = 'c'; `Status`: `string` = 's'; `Topics`: `string` = 't' }

`de.ExamSchedulerCollection`

`string`

`de.ExamSchedulerDate`

`string`

`de.ExamSchedulerDesiredStability`

`string`

`de.ExamSchedulerMaxNewCardsPerDay`

`string`

`de.ExamSchedulerMaxTotalCardsPerDay`

`string`

`de.MaxNewCardsPerDay`

`string`

`de.MaxTotalCardsPerDay`

`string`

`de.Status`

`string`

`de.Topics`

`string`

`dv`

{}

`e`

{ `Message`: `string` = 'm' }

`e.Message`

`string`

`f`

{ `Authors`: `string` = 'a'; `HasNoTextLayer`: `string` = 'tl'; `Keywords`: `string` = 'k'; `LastReadDate`: `string` = 'd'; `Name`: `string` = 'n'; `ReadPercent`: `string` = 'r'; `Theme`: `string` = 'h'; `Title`: `string` = 'i'; `Type`: `string` = 't'; `URL`: `string` = 'u'; `ViewerData`: `string` = 'v' }

`f.Authors`

`string`

`f.HasNoTextLayer`

`string`

`f.Keywords`

`string`

`f.LastReadDate`

`string`

`f.Name`

`string`

`f.ReadPercent`

`string`

`f.Theme`

`string`

`f.Title`

`string`

`f.Type`

`string`

`f.URL`

`string`

`f.ViewerData`

`string`

`g`

{ `AutoActivate`: `string` = 'a'; `CollapseConfigure`: `string` = 'c'; `Pinned`: `string` = 'p'; `PrimaryColumnName`: `string` = 'n' }

`g.AutoActivate`

`string`

`g.CollapseConfigure`

`string`

`g.Pinned`

`string`

`g.PrimaryColumnName`

`string`

`h`

{ `Color`: `string` = 'c' }

`h.Color`

`string`

`ha`

{}

`hh`

{ `Data`: `string` = 'd'; `HTMLId`: `string` = 'h' }

`hh.Data`

`string`

`hh.HTMLId`

`string`

`i`

{}

`id`

{}

`j`

{}

`k`

{}

`l`

{ `Aliases`: `string` = 'a' }

`l.Aliases`

`string`

`m`

{}

`n`

{ `Data`: `string` = 'd'; `PdfId`: `string` = 'p' }

`n.Data`

`string`

`n.PdfId`

`string`

`o`

{ `DeprecatedSource`: `string` = 'o'; `Status`: `string` = 's' }

`o.DeprecatedSource`

`string`

`o.Status`

`string`

`os`

{ `Sources`: `string` = 'os' }

`os.Sources`

`string`

`p`

{ `Data`: `string` = 'd'; `Url`: `string` = 'w' }

`p.Data`

`string`

`p.Url`

`string`

`pn`

{}

`q`

{}

`qt`

{}

`r`

{ `Size`: `string` = 's' }

`r.Size`

`string`

`rt`

{ `Date`: `string` = 'd' }

`rt.Date`

`string`

`s`

{}

`sd`

{}

`sp`

{ `AutomaticBacklinkSearchPortalFor`: `string` = 'b'; `DontIncludeNestedDescendants`: `string` = 's'; `Filter`: `string` = 'f'; `Query`: `string` = 'q' }

`sp.AutomaticBacklinkSearchPortalFor`

`string`

`sp.DontIncludeNestedDescendants`

`string`

`sp.Filter`

`string`

`sp.Query`

`string`

`t`

{ `Status`: `string` = 's' }

`t.Status`

`string`

`ty`

{}

`u`

{}

`w`

{}

`x`

{}

`y`

{ `ExtraSlotsOnBackOfCard`: `string` = 'b'; `ExtraSlotsOnFrontOfCard`: `string` = 'f'; `SelectTag`: `string` = 't' }

`y.ExtraSlotsOnBackOfCard`

`string`

`y.ExtraSlotsOnFrontOfCard`

`string`

`y.SelectTag`

`string`

`z`

{ `Hostname`: `string` = 'u' }

`z.Hostname`

`string`

* * *

### QueryRemType[​](#queryremtype-1 "Direct link to heading")

• **QueryRemType**: `ZodType`<[`QueryRemType`](/api/modules#queryremtype-1), `ZodTypeDef`, [`QueryRemType`](/api/modules#queryremtype-1)\>

* * *

### QueueEvent[​](#queueevent "Direct link to heading")

• `Const` **QueueEvent**: `Object`

#### Type declaration[​](#type-declaration-25 "Direct link to heading")

Name

Type

`QueueCompleteCard`

`"queue.complete-card"`

`QueueEnter`

`"queue.enter"`

`QueueExit`

`"queue.exit"`

`QueueLoadCard`

`"queue.load-card"`

`RevealAnswer`

`"queue.reveal-answer"`

* * *

### QueueItemTypeHumanReadable[​](#queueitemtypehumanreadable "Direct link to heading")

• `Const` **QueueItemTypeHumanReadable**: `Object`

#### Type declaration[​](#type-declaration-26 "Direct link to heading")

Name

Type

`1`

`string`

`10`

`string`

`11`

`string`

`12`

`string`

`13`

`string`

`14`

`string`

`15`

`string`

`16`

`string`

`17`

`string`

`18`

`string`

`19`

`string`

`2`

`string`

`20`

`string`

`21`

`string`

`3`

`string`

`4`

`string`

`5`

`string`

`6`

`string`

`7`

`string`

`8`

`string`

* * *

### RICH\_TEXT\_ELEMENT\_TYPE[​](#rich_text_element_type "Direct link to heading")

• `Const` **RICH\_TEXT\_ELEMENT\_TYPE**: `Object`

#### Type declaration[​](#type-declaration-27 "Direct link to heading")

Name

Type

`ADD_ICON`

`"ai"`

`ANNOTATION`

`"n"`

`AUDIO`

`"a"`

`CARD_DELIMITER`

`"s"`

`DEPRECATED_CODE`

`"o"`

`DRAWING`

`"r"`

`FLASHCARD_ICON`

`"fi"`

`GLOBAL_NAME`

`"g"`

`IMAGE`

`"i"`

`LATEX`

`"x"`

`PLUGIN`

`"p"`

`REM`

`"q"`

`TEXT`

`"m"`

* * *

### RICH\_TEXT\_FORMATTING[​](#rich_text_formatting "Direct link to heading")

• `Const` **RICH\_TEXT\_FORMATTING**: `Object`

#### Type declaration[​](#type-declaration-28 "Direct link to heading")

Name

Type

`BOLD`

`"b"`

`CLOZE`

`"cId"`

`CODE`

`"code"`

`CODE_LANGUAGE`

`"language"`

`COMMENT_ID`

`"c"`

`DEPRECATED_LINK`

`"url"`

`HIDDEN_CLOZE`

`"hiddenCloze"`

`HIGHLIGHT`

`"h"`

`INLINE_CODE`

`"q"`

`INLINE_LINK`

`"qId"`

`ITALIC`

`"l"`

`QUOTE`

`"qt"`

`REVEALED_CLOZE`

`"revealedCloze"`

`TEXT_COLOR`

`"tc"`

`UNDERLINE`

`"u"`

* * *

### RegisterPowerupOptions[​](#registerpowerupoptions-1 "Direct link to heading")

• `Const` **RegisterPowerupOptions**: `ZodUnion`<\[`ZodObject`<{ `slots`: `ZodArray`<`ZodObject`<{ `code`: `ZodString` ; `defaultEnumValue`: `ZodOptional`<`ZodString`\> ; `dontPublishToSharedArticle`: `ZodOptional`<`ZodBoolean`\> ; `enumValues`: `ZodOptional`<`ZodRecord`<`ZodString`, `ZodString`\>\> ; `hidden`: `ZodOptional`<`ZodBoolean`\> ; `name`: `ZodString` ; `onlyProgrammaticModifying`: `ZodOptional`<`ZodBoolean`\> ; `propertyLocation`: `ZodOptional`<`ZodNativeEnum`<typeof [`PropertyLocation`](/api/enums/PropertyLocation)\>\> ; `propertyType`: `ZodOptional`<`ZodNativeEnum`<typeof [`PropertyType`](/api/enums/PropertyType)\>\> ; `selectSourceType`: `ZodOptional`<`ZodNativeEnum`<typeof [`SelectSourceType`](/api/enums/SelectSourceType)\>\> }, `"strip"`, `ZodTypeAny`, { `code`: `string` ; `defaultEnumValue`: `undefined` | `string` ; `dontPublishToSharedArticle`: `undefined` | `boolean` ; `enumValues`: `undefined` | `Record`<`string`, `string`\> ; `hidden`: `undefined` | `boolean` ; `name`: `string` ; `onlyProgrammaticModifying`: `undefined` | `boolean` ; `propertyLocation`: `undefined` | [`RIGHT`](/api/enums/PropertyLocation#right) | [`BELOW`](/api/enums/PropertyLocation#below) | [`ONLY_DOCUMENT`](/api/enums/PropertyLocation#only_document) | [`ONLY_IN_TABLE`](/api/enums/PropertyLocation#only_in_table) | [`INLINE`](/api/enums/PropertyLocation#inline) ; `propertyType`: `undefined` | [`IMPLICIT_TEXT`](/api/enums/PropertyType#implicit_text) | [`TITLE`](/api/enums/PropertyType#title) | [`NUMBER`](/api/enums/PropertyType#number) | [`TEXT`](/api/enums/PropertyType#text) | [`CHECKBOX`](/api/enums/PropertyType#checkbox) | [`DATE`](/api/enums/PropertyType#date) | [`MULTI_SELECT`](/api/enums/PropertyType#multi_select) | [`SINGLE_SELECT`](/api/enums/PropertyType#single_select) | [`CREATED_AT`](/api/enums/PropertyType#created_at) | [`LAST_UPDATED`](/api/enums/PropertyType#last_updated) | [`IMAGE`](/api/enums/PropertyType#image) | [`URL`](/api/enums/PropertyType#url) | [`DEFINITION`](/api/enums/PropertyType#definition) ; `selectSourceType`: `undefined` | [`Enum`](/api/enums/SelectSourceType#enum) | [`AnyRem`](/api/enums/SelectSourceType#anyrem) | [`Relation`](/api/enums/SelectSourceType#relation) }, { `code`: `string` ; `defaultEnumValue`: `undefined` | `string` ; `dontPublishToSharedArticle`: `undefined` | `boolean` ; `enumValues`: `undefined` | `Record`<`string`, `string`\> ; `hidden`: `undefined` | `boolean` ; `name`: `string` ; `onlyProgrammaticModifying`: `undefined` | `boolean` ; `propertyLocation`: `undefined` | [`RIGHT`](/api/enums/PropertyLocation#right) | [`BELOW`](/api/enums/PropertyLocation#below) | [`ONLY_DOCUMENT`](/api/enums/PropertyLocation#only_document) | [`ONLY_IN_TABLE`](/api/enums/PropertyLocation#only_in_table) | [`INLINE`](/api/enums/PropertyLocation#inline) ; `propertyType`: `undefined` | [`IMPLICIT_TEXT`](/api/enums/PropertyType#implicit_text) | [`TITLE`](/api/enums/PropertyType#title) | [`NUMBER`](/api/enums/PropertyType#number) | [`TEXT`](/api/enums/PropertyType#text) | [`CHECKBOX`](/api/enums/PropertyType#checkbox) | [`DATE`](/api/enums/PropertyType#date) | [`MULTI_SELECT`](/api/enums/PropertyType#multi_select) | [`SINGLE_SELECT`](/api/enums/PropertyType#single_select) | [`CREATED_AT`](/api/enums/PropertyType#created_at) | [`LAST_UPDATED`](/api/enums/PropertyType#last_updated) | [`IMAGE`](/api/enums/PropertyType#image) | [`URL`](/api/enums/PropertyType#url) | [`DEFINITION`](/api/enums/PropertyType#definition) ; `selectSourceType`: `undefined` | [`Enum`](/api/enums/SelectSourceType#enum) | [`AnyRem`](/api/enums/SelectSourceType#anyrem) | [`Relation`](/api/enums/SelectSourceType#relation) }\>, `"many"`\> }, `"strip"`, `ZodTypeAny`, { `slots`: { code: string; name: string; onlyProgrammaticModifying?: boolean | undefined; hidden?: boolean | undefined; enumValues?: Record<string, string\> | undefined; defaultEnumValue?: string | undefined; propertyType?: PropertyType | undefined; propertyLocation?: PropertyLocation | undefined; selectSourceType?: SelectSourc...\[\] }, { `slots`: { code: string; name: string; onlyProgrammaticModifying?: boolean | undefined; hidden?: boolean | undefined; enumValues?: Record<string, string\> | undefined; defaultEnumValue?: string | undefined; propertyType?: PropertyType | undefined; propertyLocation?: PropertyLocation | undefined; selectSourceType?: SelectSourc...\[\] }\>, `ZodObject`<{ `properties`: `ZodArray`<`ZodObject`<{ `code`: `ZodString` ; `defaultEnumValue`: `ZodOptional`<`ZodString`\> ; `dontPublishToSharedArticle`: `ZodOptional`<`ZodBoolean`\> ; `enumValues`: `ZodOptional`<`ZodRecord`<`ZodString`, `ZodString`\>\> ; `hidden`: `ZodOptional`<`ZodBoolean`\> ; `name`: `ZodString` ; `onlyProgrammaticModifying`: `ZodOptional`<`ZodBoolean`\> ; `propertyLocation`: `ZodOptional`<`ZodNativeEnum`<typeof [`PropertyLocation`](/api/enums/PropertyLocation)\>\> ; `propertyType`: `ZodOptional`<`ZodNativeEnum`<typeof [`PropertyType`](/api/enums/PropertyType)\>\> ; `selectSourceType`: `ZodOptional`<`ZodNativeEnum`<typeof [`SelectSourceType`](/api/enums/SelectSourceType)\>\> }, `"strip"`, `ZodTypeAny`, { `code`: `string` ; `defaultEnumValue`: `undefined` | `string` ; `dontPublishToSharedArticle`: `undefined` | `boolean` ; `enumValues`: `undefined` | `Record`<`string`, `string`\> ; `hidden`: `undefined` | `boolean` ; `name`: `string` ; `onlyProgrammaticModifying`: `undefined` | `boolean` ; `propertyLocation`: `undefined` | [`RIGHT`](/api/enums/PropertyLocation#right) | [`BELOW`](/api/enums/PropertyLocation#below) | [`ONLY_DOCUMENT`](/api/enums/PropertyLocation#only_document) | [`ONLY_IN_TABLE`](/api/enums/PropertyLocation#only_in_table) | [`INLINE`](/api/enums/PropertyLocation#inline) ; `propertyType`: `undefined` | [`IMPLICIT_TEXT`](/api/enums/PropertyType#implicit_text) | [`TITLE`](/api/enums/PropertyType#title) | [`NUMBER`](/api/enums/PropertyType#number) | [`TEXT`](/api/enums/PropertyType#text) | [`CHECKBOX`](/api/enums/PropertyType#checkbox) | [`DATE`](/api/enums/PropertyType#date) | [`MULTI_SELECT`](/api/enums/PropertyType#multi_select) | [`SINGLE_SELECT`](/api/enums/PropertyType#single_select) | [`CREATED_AT`](/api/enums/PropertyType#created_at) | [`LAST_UPDATED`](/api/enums/PropertyType#last_updated) | [`IMAGE`](/api/enums/PropertyType#image) | [`URL`](/api/enums/PropertyType#url) | [`DEFINITION`](/api/enums/PropertyType#definition) ; `selectSourceType`: `undefined` | [`Enum`](/api/enums/SelectSourceType#enum) | [`AnyRem`](/api/enums/SelectSourceType#anyrem) | [`Relation`](/api/enums/SelectSourceType#relation) }, { `code`: `string` ; `defaultEnumValue`: `undefined` | `string` ; `dontPublishToSharedArticle`: `undefined` | `boolean` ; `enumValues`: `undefined` | `Record`<`string`, `string`\> ; `hidden`: `undefined` | `boolean` ; `name`: `string` ; `onlyProgrammaticModifying`: `undefined` | `boolean` ; `propertyLocation`: `undefined` | [`RIGHT`](/api/enums/PropertyLocation#right) | [`BELOW`](/api/enums/PropertyLocation#below) | [`ONLY_DOCUMENT`](/api/enums/PropertyLocation#only_document) | [`ONLY_IN_TABLE`](/api/enums/PropertyLocation#only_in_table) | [`INLINE`](/api/enums/PropertyLocation#inline) ; `propertyType`: `undefined` | [`IMPLICIT_TEXT`](/api/enums/PropertyType#implicit_text) | [`TITLE`](/api/enums/PropertyType#title) | [`NUMBER`](/api/enums/PropertyType#number) | [`TEXT`](/api/enums/PropertyType#text) | [`CHECKBOX`](/api/enums/PropertyType#checkbox) | [`DATE`](/api/enums/PropertyType#date) | [`MULTI_SELECT`](/api/enums/PropertyType#multi_select) | [`SINGLE_SELECT`](/api/enums/PropertyType#single_select) | [`CREATED_AT`](/api/enums/PropertyType#created_at) | [`LAST_UPDATED`](/api/enums/PropertyType#last_updated) | [`IMAGE`](/api/enums/PropertyType#image) | [`URL`](/api/enums/PropertyType#url) | [`DEFINITION`](/api/enums/PropertyType#definition) ; `selectSourceType`: `undefined` | [`Enum`](/api/enums/SelectSourceType#enum) | [`AnyRem`](/api/enums/SelectSourceType#anyrem) | [`Relation`](/api/enums/SelectSourceType#relation) }\>, `"many"`\> }, `"strip"`, `ZodTypeAny`, { `properties`: { code: string; name: string; onlyProgrammaticModifying?: boolean | undefined; hidden?: boolean | undefined; enumValues?: Record<string, string\> | undefined; defaultEnumValue?: string | undefined; propertyType?: PropertyType | undefined; propertyLocation?: PropertyLocation | undefined; selectSourceType?: SelectSourc...\[\] }, { `properties`: { code: string; name: string; onlyProgrammaticModifying?: boolean | undefined; hidden?: boolean | undefined; enumValues?: Record<string, string\> | undefined; defaultEnumValue?: string | undefined; propertyType?: PropertyType | undefined; propertyLocation?: PropertyLocation | undefined; selectSourceType?: SelectSourc...\[\] }\>\]\>

* * *

### RegisterPropertyOptions[​](#registerpropertyoptions "Direct link to heading")

• `Const` **RegisterPropertyOptions**: `ZodObject`<{ `code`: `ZodString` ; `defaultEnumValue`: `ZodOptional`<`ZodString`\> ; `dontPublishToSharedArticle`: `ZodOptional`<`ZodBoolean`\> ; `enumValues`: `ZodOptional`<`ZodRecord`<`ZodString`, `ZodString`\>\> ; `hidden`: `ZodOptional`<`ZodBoolean`\> ; `name`: `ZodString` ; `onlyProgrammaticModifying`: `ZodOptional`<`ZodBoolean`\> ; `propertyLocation`: `ZodOptional`<`ZodNativeEnum`<typeof [`PropertyLocation`](/api/enums/PropertyLocation)\>\> ; `propertyType`: `ZodOptional`<`ZodNativeEnum`<typeof [`PropertyType`](/api/enums/PropertyType)\>\> ; `selectSourceType`: `ZodOptional`<`ZodNativeEnum`<typeof [`SelectSourceType`](/api/enums/SelectSourceType)\>\> }, `"strip"`, `ZodTypeAny`, { `code`: `string` ; `defaultEnumValue`: `undefined` | `string` ; `dontPublishToSharedArticle`: `undefined` | `boolean` ; `enumValues`: `undefined` | `Record`<`string`, `string`\> ; `hidden`: `undefined` | `boolean` ; `name`: `string` ; `onlyProgrammaticModifying`: `undefined` | `boolean` ; `propertyLocation`: `undefined` | [`RIGHT`](/api/enums/PropertyLocation#right) | [`BELOW`](/api/enums/PropertyLocation#below) | [`ONLY_DOCUMENT`](/api/enums/PropertyLocation#only_document) | [`ONLY_IN_TABLE`](/api/enums/PropertyLocation#only_in_table) | [`INLINE`](/api/enums/PropertyLocation#inline) ; `propertyType`: `undefined` | [`IMPLICIT_TEXT`](/api/enums/PropertyType#implicit_text) | [`TITLE`](/api/enums/PropertyType#title) | [`NUMBER`](/api/enums/PropertyType#number) | [`TEXT`](/api/enums/PropertyType#text) | [`CHECKBOX`](/api/enums/PropertyType#checkbox) | [`DATE`](/api/enums/PropertyType#date) | [`MULTI_SELECT`](/api/enums/PropertyType#multi_select) | [`SINGLE_SELECT`](/api/enums/PropertyType#single_select) | [`CREATED_AT`](/api/enums/PropertyType#created_at) | [`LAST_UPDATED`](/api/enums/PropertyType#last_updated) | [`IMAGE`](/api/enums/PropertyType#image) | [`URL`](/api/enums/PropertyType#url) | [`DEFINITION`](/api/enums/PropertyType#definition) ; `selectSourceType`: `undefined` | [`Enum`](/api/enums/SelectSourceType#enum) | [`AnyRem`](/api/enums/SelectSourceType#anyrem) | [`Relation`](/api/enums/SelectSourceType#relation) }, { `code`: `string` ; `defaultEnumValue`: `undefined` | `string` ; `dontPublishToSharedArticle`: `undefined` | `boolean` ; `enumValues`: `undefined` | `Record`<`string`, `string`\> ; `hidden`: `undefined` | `boolean` ; `name`: `string` ; `onlyProgrammaticModifying`: `undefined` | `boolean` ; `propertyLocation`: `undefined` | [`RIGHT`](/api/enums/PropertyLocation#right) | [`BELOW`](/api/enums/PropertyLocation#below) | [`ONLY_DOCUMENT`](/api/enums/PropertyLocation#only_document) | [`ONLY_IN_TABLE`](/api/enums/PropertyLocation#only_in_table) | [`INLINE`](/api/enums/PropertyLocation#inline) ; `propertyType`: `undefined` | [`IMPLICIT_TEXT`](/api/enums/PropertyType#implicit_text) | [`TITLE`](/api/enums/PropertyType#title) | [`NUMBER`](/api/enums/PropertyType#number) | [`TEXT`](/api/enums/PropertyType#text) | [`CHECKBOX`](/api/enums/PropertyType#checkbox) | [`DATE`](/api/enums/PropertyType#date) | [`MULTI_SELECT`](/api/enums/PropertyType#multi_select) | [`SINGLE_SELECT`](/api/enums/PropertyType#single_select) | [`CREATED_AT`](/api/enums/PropertyType#created_at) | [`LAST_UPDATED`](/api/enums/PropertyType#last_updated) | [`IMAGE`](/api/enums/PropertyType#image) | [`URL`](/api/enums/PropertyType#url) | [`DEFINITION`](/api/enums/PropertyType#definition) ; `selectSourceType`: `undefined` | [`Enum`](/api/enums/SelectSourceType#enum) | [`AnyRem`](/api/enums/SelectSourceType#anyrem) | [`Relation`](/api/enums/SelectSourceType#relation) }\>

* * *

### RelativeDateMatcherToLabel[​](#relativedatematchertolabel "Direct link to heading")

• `Const` **RelativeDateMatcherToLabel**: `Record`<[`RelativeDateMatcher`](/api/enums/RelativeDateMatcher), `string`\>

* * *

### RemEvent[​](#remevent "Direct link to heading")

• `Const` **RemEvent**: `Object`

#### Type declaration[​](#type-declaration-29 "Direct link to heading")

Name

Type

`GlobalRemChanged`

`string`

`RemChanged`

`string`

* * *

### SearchPortalCheckboxQueryExpression[​](#searchportalcheckboxqueryexpression "Direct link to heading")

• **SearchPortalCheckboxQueryExpression**: `ZodType`<[`SearchPortalCheckboxQueryExpression`](/api/modules#searchportalcheckboxqueryexpression), `ZodTypeDef`, [`SearchPortalCheckboxQueryExpression`](/api/modules#searchportalcheckboxqueryexpression)\>

* * *

### SearchPortalDateQueryExpression[​](#searchportaldatequeryexpression "Direct link to heading")

• **SearchPortalDateQueryExpression**: `ZodType`<[`SearchPortalDateQueryExpression`](/api/modules#searchportaldatequeryexpression), `ZodTypeDef`, [`SearchPortalDateQueryExpression`](/api/modules#searchportaldatequeryexpression)\>

* * *

### SearchPortalGroupQueryNode[​](#searchportalgroupquerynode "Direct link to heading")

• **SearchPortalGroupQueryNode**: `ZodType`<[`SearchPortalGroupQueryNode`](/api/modules#searchportalgroupquerynode), `ZodTypeDef`, [`SearchPortalGroupQueryNode`](/api/modules#searchportalgroupquerynode)\>

* * *

### SearchPortalMultiSelectQueryExpression[​](#searchportalmultiselectqueryexpression "Direct link to heading")

• **SearchPortalMultiSelectQueryExpression**: `ZodType`<[`SearchPortalMultiSelectQueryExpression`](/api/modules#searchportalmultiselectqueryexpression), `ZodTypeDef`, [`SearchPortalMultiSelectQueryExpression`](/api/modules#searchportalmultiselectqueryexpression)\>

* * *

### SearchPortalNumberQueryExpression[​](#searchportalnumberqueryexpression "Direct link to heading")

• **SearchPortalNumberQueryExpression**: `ZodType`<[`SearchPortalNumberQueryExpression`](/api/modules#searchportalnumberqueryexpression), `ZodTypeDef`, [`SearchPortalNumberQueryExpression`](/api/modules#searchportalnumberqueryexpression)\>

* * *

### SearchPortalQuery[​](#searchportalquery-1 "Direct link to heading")

• **SearchPortalQuery**: `ZodType`<[`SearchPortalQuery`](/api/modules#searchportalquery-1), `ZodTypeDef`, [`SearchPortalQuery`](/api/modules#searchportalquery-1)\>

* * *

### SearchPortalQueryExpression[​](#searchportalqueryexpression-1 "Direct link to heading")

• **SearchPortalQueryExpression**: `ZodType`<[`SearchPortalQueryExpression`](/api/modules#searchportalqueryexpression-1), `ZodTypeDef`, [`SearchPortalQueryExpression`](/api/modules#searchportalqueryexpression-1)\>

* * *

### SearchPortalRefQueryExpression[​](#searchportalrefqueryexpression "Direct link to heading")

• **SearchPortalRefQueryExpression**: `ZodType`<[`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression), `ZodTypeDef`, [`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)\>

* * *

### SearchPortalRemTypeQueryExpression[​](#searchportalremtypequeryexpression "Direct link to heading")

• **SearchPortalRemTypeQueryExpression**: `ZodType`<[`SearchPortalRemTypeQueryExpression`](/api/modules#searchportalremtypequeryexpression), `ZodTypeDef`, [`SearchPortalRemTypeQueryExpression`](/api/modules#searchportalremtypequeryexpression)\>

* * *

### SearchPortalSingleSelectQueryExpression[​](#searchportalsingleselectqueryexpression "Direct link to heading")

• **SearchPortalSingleSelectQueryExpression**: `ZodType`<[`SearchPortalSingleSelectQueryExpression`](/api/modules#searchportalsingleselectqueryexpression), `ZodTypeDef`, [`SearchPortalSingleSelectQueryExpression`](/api/modules#searchportalsingleselectqueryexpression)\>

* * *

### SearchPortalSlotQueryNode[​](#searchportalslotquerynode "Direct link to heading")

• **SearchPortalSlotQueryNode**: `ZodType`<[`SearchPortalSlotQueryNode`](/api/modules#searchportalslotquerynode), `ZodTypeDef`, [`SearchPortalSlotQueryNode`](/api/modules#searchportalslotquerynode)\>

* * *

### SearchPortalTextQueryExpression[​](#searchportaltextqueryexpression "Direct link to heading")

• **SearchPortalTextQueryExpression**: `ZodType`<[`SearchPortalTextQueryExpression`](/api/modules#searchportaltextqueryexpression), `ZodTypeDef`, [`SearchPortalTextQueryExpression`](/api/modules#searchportaltextqueryexpression)\>

* * *

### SearchPortalUnaryQueryNode[​](#searchportalunaryquerynode "Direct link to heading")

• **SearchPortalUnaryQueryNode**: `ZodType`<[`SearchPortalUnaryQueryNode`](/api/modules#searchportalunaryquerynode), `ZodTypeDef`, [`SearchPortalUnaryQueryNode`](/api/modules#searchportalunaryquerynode)\>

* * *

### SettingEvents[​](#settingevents "Direct link to heading")

• `Const` **SettingEvents**: `Object`

#### Type declaration[​](#type-declaration-30 "Direct link to heading")

Name

Type

`SettingChanged`

`string`

* * *

### SidebarEvents[​](#sidebarevents "Direct link to heading")

• `Const` **SidebarEvents**: `Object`

#### Type declaration[​](#type-declaration-31 "Direct link to heading")

Name

Type

`ClickSidebarItem`

`string`

* * *

### SingleSelectMatcherTypesToDisplayValue[​](#singleselectmatchertypestodisplayvalue "Direct link to heading")

• `Const` **SingleSelectMatcherTypesToDisplayValue**: `Record`<[`SingleSelectMatcher`](/api/enums/SingleSelectMatcher), `string`\>

* * *

### StorageEvents[​](#storageevents "Direct link to heading")

• `Const` **StorageEvents**: `Object`

#### Type declaration[​](#type-declaration-32 "Direct link to heading")

Name

Type

`StorageLocalChange`

`string`

`StorageSessionChange`

`string`

`StorageSyncedChange`

`string`

* * *

### TextMatcherTypesToDisplayValue[​](#textmatchertypestodisplayvalue "Direct link to heading")

• `Const` **TextMatcherTypesToDisplayValue**: `Record`<[`TextMatcher`](/api/enums/TextMatcher), `string`\>

* * *

### TextMatchersAllowedWithoutPrimaryQuery[​](#textmatchersallowedwithoutprimaryquery "Direct link to heading")

• `Const` **TextMatchersAllowedWithoutPrimaryQuery**: [`TextMatcher`](/api/enums/TextMatcher)\[\]

* * *

### WidgetEvents[​](#widgetevents "Direct link to heading")

• `Const` **WidgetEvents**: `Object`

#### Type declaration[​](#type-declaration-33 "Direct link to heading")

Name

Type

`FakeEmbedComponentDimensionChange`

`string`

`FakeEmbedDOMEvent`

`string`

`StealKeyEvent`

`string`

* * *

### WindowEvents[​](#windowevents "Direct link to heading")

• `Const` **WindowEvents**: `Object`

#### Type declaration[​](#type-declaration-34 "Direct link to heading")

Name

Type

`CurrentWindowTreeChange`

`string`

`FocusedPaneChange`

`string`

* * *

### numberValidatorSig[​](#numbervalidatorsig "Direct link to heading")

• `Const` **numberValidatorSig**: `ZodUnion`<\[`ZodObject`<{ `arg`: `ZodNumber` ; `type`: `ZodLiteral`<`"gte"`\> }, `"strip"`, `ZodTypeAny`, { `arg`: `number` ; `type`: `"gte"` }, { `arg`: `number` ; `type`: `"gte"` }\>, `ZodObject`<{ `arg`: `ZodNumber` ; `type`: `ZodLiteral`<`"min"`\> }, `"strip"`, `ZodTypeAny`, { `arg`: `number` ; `type`: `"min"` }, { `arg`: `number` ; `type`: `"min"` }\>, `ZodObject`<{ `arg`: `ZodNumber` ; `type`: `ZodLiteral`<`"gt"`\> }, `"strip"`, `ZodTypeAny`, { `arg`: `number` ; `type`: `"gt"` }, { `arg`: `number` ; `type`: `"gt"` }\>\]\>

* * *

### richTextFormatNameCodeMap[​](#richtextformatnamecodemap "Direct link to heading")

• `Const` **richTextFormatNameCodeMap**: `Object`

#### Type declaration[​](#type-declaration-35 "Direct link to heading")

Name

Type

`bold`

`string`

`italic`

`string`

`quote`

`string`

`underline`

`string`

* * *

### stringValidatorSig[​](#stringvalidatorsig "Direct link to heading")

• `Const` **stringValidatorSig**: `ZodUnion`<\[`ZodObject`<{ `type`: `ZodLiteral`<`"email"`\> }, `"strip"`, `ZodTypeAny`, { `type`: `"email"` }, { `type`: `"email"` }\>, `ZodObject`<{ `type`: `ZodLiteral`<`"url"`\> }, `"strip"`, `ZodTypeAny`, { `type`: `"url"` }, { `type`: `"url"` }\>, `ZodObject`<{ `arg`: `ZodString` ; `type`: `ZodLiteral`<`"regex"`\> }, `"strip"`, `ZodTypeAny`, { `arg`: `string` ; `type`: `"regex"` }, { `arg`: `string` ; `type`: `"regex"` }\>, `ZodObject`<{ `arg`: `ZodString` ; `type`: `ZodLiteral`<`"startsWith"`\> }, `"strip"`, `ZodTypeAny`, { `arg`: `string` ; `type`: `"startsWith"` }, { `arg`: `string` ; `type`: `"startsWith"` }\>\]\>

## Functions[​](#functions "Direct link to heading")

### createReactiveApi[​](#createreactiveapi "Direct link to heading")

▸ **createReactiveApi**<`Func`\>(`plugin`, `userFunc`, `rerun`, `setState`, `previousSubscriptions`): `Promise`<[`SubscriptionInfo`](/api/interfaces/SubscriptionInfo)\[\]\>

#### Type parameters[​](#type-parameters-2 "Direct link to heading")

Name

Type

`Func`

extends (`plugin`: [`RNPlugin`](/api/classes/RNPlugin)) => `Promise`<`any`\>

#### Parameters[​](#parameters-2 "Direct link to heading")

Name

Type

`plugin`

[`RNPlugin`](/api/classes/RNPlugin)

`userFunc`

`Func`

`rerun`

() => `void`

`setState`

(`result`: `Awaited`<`ReturnType`<`Func`\>\>) => `void`

`previousSubscriptions`

[`SubscriptionInfo`](/api/interfaces/SubscriptionInfo)\[\]

#### Returns[​](#returns-2 "Direct link to heading")

`Promise`<[`SubscriptionInfo`](/api/interfaces/SubscriptionInfo)\[\]\>

* * *

### declareIndexPlugin[​](#declareindexplugin "Direct link to heading")

▸ **declareIndexPlugin**(`onActivate`, `onDeactivate`): `void`

#### Parameters[​](#parameters-3 "Direct link to heading")

Name

Type

`onActivate`

(`plugin`: `ReactRNPlugin`) => `Promise`<`void`\>

`onDeactivate`

(`plugin`: `ReactRNPlugin`) => `Promise`<`void`\>

#### Returns[​](#returns-3 "Direct link to heading")

`void`

* * *

### filterAsync[​](#filterasync "Direct link to heading")

▸ **filterAsync**<`T`\>(`array`, `filter`): `Promise`<`T`\[\]\>

#### Type parameters[​](#type-parameters-3 "Direct link to heading")

Name

`T`

#### Parameters[​](#parameters-4 "Direct link to heading")

Name

Type

`array`

`T`\[\]

`filter`

(`t`: `T`) => `Promise`<`boolean`\>

#### Returns[​](#returns-4 "Direct link to heading")

`Promise`<`T`\[\]\>

* * *

### isAppEvent[​](#isappevent "Direct link to heading")

▸ **isAppEvent**(`eventId`): eventId is string

#### Parameters[​](#parameters-5 "Direct link to heading")

Name

Type

`eventId`

`string`

#### Returns[​](#returns-5 "Direct link to heading")

eventId is string

* * *

### makeNamespacedCall[​](#makenamespacedcall "Direct link to heading")

▸ **makeNamespacedCall**(`call`, `namespace`): (`methodName`: `string`, `args`: `Record`<`string`, `any`\>) => `Promise`<`any`\>

#### Parameters[​](#parameters-6 "Direct link to heading")

Name

Type

`call`

(`methodName`: `string`, `args`: `Record`<`string`, `any`\>, `namespace?`: `string` | `string`\[\]) => `Promise`<`any`\>

`namespace`

`string`

#### Returns[​](#returns-6 "Direct link to heading")

`fn`

▸ (`methodName`, `args`): `Promise`<`any`\>

##### Parameters[​](#parameters-7 "Direct link to heading")

Name

Type

`methodName`

`string`

`args`

`Record`<`string`, `any`\>

##### Returns[​](#returns-7 "Direct link to heading")

`Promise`<`any`\>

* * *

### parseManifest[​](#parsemanifest "Direct link to heading")

▸ **parseManifest**(`m`): `Either`<`ValidationError`\[\], { `author`: `string` ; `changelogUrl`: `undefined` | `string` ; `description`: `undefined` | `string` ; `enableOnMobile`: `boolean` ; `id`: `string` ; `manifestVersion`: `1` ; `minimumRemNoteVersion`: `undefined` | { major: number; minor: number; patch: number; } ; `name`: `string` ; `projectUrl`: `undefined` | `string` ; `repoUrl`: `string` ; `requestNative`: `boolean` ; `requiredScopes`: ({ `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `type`: `All` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `remName`: `string` ; `type`: `DescendantsOfName` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `remId`: `string` ; `type`: `DescendantsOfId` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `powerupCode`: `string` ; `type`: `Powerup` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `type`: `FocusedSubtree` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `type`: `KnowledgeBaseInfo` })\[\] ; `supportUrl`: `undefined` | `string` ; `theme`: `undefined` | (`"dark"` | `"light"`)\[\] ; `unlisted`: `undefined` | `boolean` ; `version`: { major: number; minor: number; patch: number; } = VersionSig }\>

#### Parameters[​](#parameters-8 "Direct link to heading")

Name

Type

`m`

`any`

#### Returns[​](#returns-8 "Direct link to heading")

`Either`<`ValidationError`\[\], { `author`: `string` ; `changelogUrl`: `undefined` | `string` ; `description`: `undefined` | `string` ; `enableOnMobile`: `boolean` ; `id`: `string` ; `manifestVersion`: `1` ; `minimumRemNoteVersion`: `undefined` | { major: number; minor: number; patch: number; } ; `name`: `string` ; `projectUrl`: `undefined` | `string` ; `repoUrl`: `string` ; `requestNative`: `boolean` ; `requiredScopes`: ({ `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `type`: `All` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `remName`: `string` ; `type`: `DescendantsOfName` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `remId`: `string` ; `type`: `DescendantsOfId` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `powerupCode`: `string` ; `type`: `Powerup` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `type`: `FocusedSubtree` } | { `level`: `PluginActionPermissionLevel` = PluginActionPermissionLevelSig; `type`: `KnowledgeBaseInfo` })\[\] ; `supportUrl`: `undefined` | `string` ; `theme`: `undefined` | (`"dark"` | `"light"`)\[\] ; `unlisted`: `undefined` | `boolean` ; `version`: { major: number; minor: number; patch: number; } = VersionSig }\>

* * *

### remTypeTinyGraphToNormal[​](#remtypetinygraphtonormal "Direct link to heading")

▸ **remTypeTinyGraphToNormal**(`remType`): [`REM_TYPE`](/api/enums/REM_TYPE)

#### Parameters[​](#parameters-9 "Direct link to heading")

Name

Type

`remType`

[`RemTypeTinyGraph`](/api/enums/RemTypeTinyGraph)

#### Returns[​](#returns-9 "Direct link to heading")

[`REM_TYPE`](/api/enums/REM_TYPE)

* * *

### remTypeToTinyGraphType[​](#remtypetotinygraphtype "Direct link to heading")

▸ **remTypeToTinyGraphType**(`remType`): [`RemTypeTinyGraph`](/api/enums/RemTypeTinyGraph)

#### Parameters[​](#parameters-10 "Direct link to heading")

Name

Type

`remType`

[`REM_TYPE`](/api/enums/REM_TYPE)

#### Returns[​](#returns-10 "Direct link to heading")

[`RemTypeTinyGraph`](/api/enums/RemTypeTinyGraph)

* * *

### renderWidget[​](#renderwidget "Direct link to heading")

▸ **renderWidget**(`ComponentClass`): `void`

#### Parameters[​](#parameters-11 "Direct link to heading")

Name

Type

`ComponentClass`

`ComponentClass`<{}, `any`\> | () => `null` | `Element` | () => `null` | `Element`

#### Returns[​](#returns-11 "Direct link to heading")

`void`

* * *

### useAPIEventListener[​](#useapieventlistener "Direct link to heading")

▸ **useAPIEventListener**(`appEvent`, `listenerKey`, `callback`): `void`

#### Parameters[​](#parameters-12 "Direct link to heading")

Name

Type

`appEvent`

`string`

`listenerKey`

[`AppEventListerKey`](/api/modules#appeventlisterkey)

`callback`

(`args`: `any`) => `void`

#### Returns[​](#returns-12 "Direct link to heading")

`void`

* * *

### useGetRemsByIdsReactive[​](#usegetremsbyidsreactive "Direct link to heading")

▸ **useGetRemsByIdsReactive**(`inpRemIds`): ([`Rem`](/api/classes/Rem) | `undefined`)\[\]

#### Parameters[​](#parameters-13 "Direct link to heading")

Name

Type

`inpRemIds`

`undefined` | (`undefined` | `string`)\[\]

#### Returns[​](#returns-13 "Direct link to heading")

([`Rem`](/api/classes/Rem) | `undefined`)\[\]

* * *

### useLocalStorageState[​](#uselocalstoragestate "Direct link to heading")

▸ **useLocalStorageState**<`Value`\>(`key`, `defaultValue`): \[`Value`, (`value`: `Value`) => `Promise`<`void`\>\]

#### Type parameters[​](#type-parameters-4 "Direct link to heading")

Name

`Value`

#### Parameters[​](#parameters-14 "Direct link to heading")

Name

Type

`key`

`string`

`defaultValue`

`Value`

#### Returns[​](#returns-14 "Direct link to heading")

\[`Value`, (`value`: `Value`) => `Promise`<`void`\>\]

* * *

### useOnMessageBroadcast[​](#useonmessagebroadcast "Direct link to heading")

▸ **useOnMessageBroadcast**(`cb`): `void`

#### Parameters[​](#parameters-15 "Direct link to heading")

Name

Type

`cb`

(`message`: `any`) => `void`

#### Returns[​](#returns-15 "Direct link to heading")

`void`

* * *

### usePlugin[​](#useplugin "Direct link to heading")

▸ **usePlugin**(): [`RNPlugin`](/api/classes/RNPlugin)

#### Returns[​](#returns-16 "Direct link to heading")

[`RNPlugin`](/api/classes/RNPlugin)

* * *

### useRunAsync[​](#userunasync "Direct link to heading")

▸ **useRunAsync**<`T`\>(`fn`, `deps`): `undefined` | `T`

#### Type parameters[​](#type-parameters-5 "Direct link to heading")

Name

`T`

#### Parameters[​](#parameters-16 "Direct link to heading")

Name

Type

`fn`

() => `Promise`<`T`\>

`deps`

`any`\[\]

#### Returns[​](#returns-17 "Direct link to heading")

`undefined` | `T`

* * *

### useSessionStorageState[​](#usesessionstoragestate "Direct link to heading")

▸ **useSessionStorageState**<`Value`\>(`key`, `defaultValue`): \[`Value`, (`value`: `Value`) => `Promise`<`void`\>\]

#### Type parameters[​](#type-parameters-6 "Direct link to heading")

Name

`Value`

#### Parameters[​](#parameters-17 "Direct link to heading")

Name

Type

`key`

`string`

`defaultValue`

`Value`

#### Returns[​](#returns-18 "Direct link to heading")

\[`Value`, (`value`: `Value`) => `Promise`<`void`\>\]

* * *

### useSyncedStorageState[​](#usesyncedstoragestate "Direct link to heading")

▸ **useSyncedStorageState**<`Value`\>(`key`, `defaultValue`): \[`Value`, (`value`: `Value`) => `Promise`<`void`\>\]

#### Type parameters[​](#type-parameters-7 "Direct link to heading")

Name

`Value`

#### Parameters[​](#parameters-18 "Direct link to heading")

Name

Type

`key`

`string`

`defaultValue`

`Value`

#### Returns[​](#returns-19 "Direct link to heading")

\[`Value`, (`value`: `Value`) => `Promise`<`void`\>\]

* * *

### useTracker[​](#usetracker "Direct link to heading")

▸ **useTracker**<`T`\>(`userFunc`, `deps?`): `T` | `undefined`

#### Type parameters[​](#type-parameters-8 "Direct link to heading")

Name

Type

`T`

extends `unknown`

#### Parameters[​](#parameters-19 "Direct link to heading")

Name

Type

Default value

`userFunc`

(`plugin`: [`RNPlugin`](/api/classes/RNPlugin)) => `Promise`<`T`\>

`undefined`

`deps`

`any`\[\]

`[]`

#### Returns[​](#returns-20 "Direct link to heading")

`T` | `undefined`
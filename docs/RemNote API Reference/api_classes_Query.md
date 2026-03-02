<!-- source: https://plugins.remnote.com/api/classes/Query -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   API Reference
-   All Internals
-   Classes
-   Query

On this page

# Class: Query

## Constructors[​](#constructors "Direct link to heading")

### constructor[​](#constructor "Direct link to heading")

• **new Query**()

## Methods[​](#methods "Direct link to heading")

### and[​](#and "Direct link to heading")

▸ `Static` **and**(`queryExpressions`): [`SearchPortalQuery`](/api/modules#searchportalquery-1)

#### Parameters[​](#parameters "Direct link to heading")

Name

Type

`queryExpressions`

[`SearchPortalQuery`](/api/modules#searchportalquery-1)\[\]

#### Returns[​](#returns "Direct link to heading")

[`SearchPortalQuery`](/api/modules#searchportalquery-1)

* * *

### checkbox[​](#checkbox "Direct link to heading")

▸ `Static` **checkbox**(`matches`): [`SearchPortalCheckboxQueryExpression`](/api/modules#searchportalcheckboxqueryexpression)

#### Parameters[​](#parameters-1 "Direct link to heading")

Name

Type

`matches`

[`CheckboxMatcher`](/api/enums/CheckboxMatcher)

#### Returns[​](#returns-1 "Direct link to heading")

[`SearchPortalCheckboxQueryExpression`](/api/modules#searchportalcheckboxqueryexpression)

* * *

### date[​](#date "Direct link to heading")

▸ `Static` **date**<`Matcher`\>(`matches`): [`SearchPortalDateQueryExpression`](/api/modules#searchportaldatequeryexpression)

#### Type parameters[​](#type-parameters "Direct link to heading")

Name

Type

`Matcher`

extends [`IsEmpty`](/api/enums/DateMatcher#isempty) | [`IsNotEmpty`](/api/enums/DateMatcher#isnotempty)

#### Parameters[​](#parameters-2 "Direct link to heading")

Name

Type

`matches`

`Matcher`

#### Returns[​](#returns-2 "Direct link to heading")

[`SearchPortalDateQueryExpression`](/api/modules#searchportaldatequeryexpression)

▸ `Static` **date**<`Matcher`\>(`matches`, `date`): [`SearchPortalDateQueryExpression`](/api/modules#searchportaldatequeryexpression)

#### Type parameters[​](#type-parameters-1 "Direct link to heading")

Name

Type

`Matcher`

extends [`Is`](/api/enums/DateMatcher#is) | [`IsBefore`](/api/enums/DateMatcher#isbefore) | [`IsAfter`](/api/enums/DateMatcher#isafter) | [`IsOnOrBefore`](/api/enums/DateMatcher#isonorbefore) | [`IsOnOrAfter`](/api/enums/DateMatcher#isonorafter)

#### Parameters[​](#parameters-3 "Direct link to heading")

Name

Type

Description

`matches`

`Matcher`

\-

`date`

`Date` | [`RelativeDateMatcher`](/api/enums/RelativeDateMatcher)

#### Returns[​](#returns-3 "Direct link to heading")

[`SearchPortalDateQueryExpression`](/api/modules#searchportaldatequeryexpression)

▸ `Static` **date**<`Matcher`\>(`matches`, `date1`, `date2`): [`SearchPortalDateQueryExpression`](/api/modules#searchportaldatequeryexpression)

#### Type parameters[​](#type-parameters-2 "Direct link to heading")

Name

Type

`Matcher`

extends [`IsBetween`](/api/enums/DateMatcher#isbetween)

#### Parameters[​](#parameters-4 "Direct link to heading")

Name

Type

Description

`matches`

`Matcher`

\-

`date1`

`Date` | [`RelativeDateMatcher`](/api/enums/RelativeDateMatcher)

`date2`

`Date` | [`RelativeDateMatcher`](/api/enums/RelativeDateMatcher)

#### Returns[​](#returns-4 "Direct link to heading")

[`SearchPortalDateQueryExpression`](/api/modules#searchportaldatequeryexpression)

* * *

### dateRelativeToToday[​](#daterelativetotoday "Direct link to heading")

▸ `Static` **dateRelativeToToday**<`Modifier`\>(`relativeDateModifier`, `relativeDatePeriod`): [`SearchPortalDateQueryExpression`](/api/modules#searchportaldatequeryexpression)

#### Type parameters[​](#type-parameters-3 "Direct link to heading")

Name

Type

`Modifier`

extends [`This`](/api/enums/RelativeDateModifier#this)

#### Parameters[​](#parameters-5 "Direct link to heading")

Name

Type

Description

`relativeDateModifier`

`Modifier`

`relativeDatePeriod`

[`RelativeDatePeriod`](/api/enums/RelativeDatePeriod)

#### Returns[​](#returns-5 "Direct link to heading")

[`SearchPortalDateQueryExpression`](/api/modules#searchportaldatequeryexpression)

▸ `Static` **dateRelativeToToday**<`Modifier`\>(`relativeDateModifier`, `relativeDatePeriod`, `daysOffset`): [`SearchPortalDateQueryExpression`](/api/modules#searchportaldatequeryexpression)

#### Type parameters[​](#type-parameters-4 "Direct link to heading")

Name

Type

`Modifier`

extends [`Past`](/api/enums/RelativeDateModifier#past) | [`Next`](/api/enums/RelativeDateModifier#next)

#### Parameters[​](#parameters-6 "Direct link to heading")

Name

Type

`relativeDateModifier`

`Modifier`

`relativeDatePeriod`

[`RelativeDatePeriod`](/api/enums/RelativeDatePeriod)

`daysOffset`

`number`

#### Returns[​](#returns-6 "Direct link to heading")

[`SearchPortalDateQueryExpression`](/api/modules#searchportaldatequeryexpression)

* * *

### documentsThatContain[​](#documentsthatcontain "Direct link to heading")

▸ `Static` **documentsThatContain**(`remId`): [`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

#### Parameters[​](#parameters-7 "Direct link to heading")

Name

Type

`remId`

`string`

#### Returns[​](#returns-7 "Direct link to heading")

[`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

* * *

### hasAnyConnectionTo[​](#hasanyconnectionto "Direct link to heading")

▸ `Static` **hasAnyConnectionTo**(`remId`): [`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

#### Parameters[​](#parameters-8 "Direct link to heading")

Name

Type

`remId`

`undefined` | `string`

#### Returns[​](#returns-8 "Direct link to heading")

[`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

* * *

### hasReferenceTo[​](#hasreferenceto "Direct link to heading")

▸ `Static` **hasReferenceTo**(`remId`): [`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

#### Parameters[​](#parameters-9 "Direct link to heading")

Name

Type

Description

`remId`

`string`

#### Returns[​](#returns-9 "Direct link to heading")

[`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

* * *

### hasRemType[​](#hasremtype "Direct link to heading")

▸ `Static` **hasRemType**(`remType`): [`SearchPortalRemTypeQueryExpression`](/api/modules#searchportalremtypequeryexpression)

#### Parameters[​](#parameters-10 "Direct link to heading")

Name

Type

Description

`remType`

[`QueryRemType`](/api/modules#queryremtype-1)

#### Returns[​](#returns-10 "Direct link to heading")

[`SearchPortalRemTypeQueryExpression`](/api/modules#searchportalremtypequeryexpression)

* * *

### isDescendantOf[​](#isdescendantof "Direct link to heading")

▸ `Static` **isDescendantOf**(`remId`): [`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

#### Parameters[​](#parameters-11 "Direct link to heading")

Name

Type

Description

`remId`

`string`

#### Returns[​](#returns-11 "Direct link to heading")

[`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

* * *

### isDirectlyTaggedWith[​](#isdirectlytaggedwith "Direct link to heading")

▸ `Static` **isDirectlyTaggedWith**(`remId`): [`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

#### Parameters[​](#parameters-12 "Direct link to heading")

Name

Type

`remId`

`string`

#### Returns[​](#returns-12 "Direct link to heading")

[`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

* * *

### isInDocument[​](#isindocument "Direct link to heading")

▸ `Static` **isInDocument**(`remId`): [`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

#### Parameters[​](#parameters-13 "Direct link to heading")

Name

Type

Description

`remId`

`undefined` | `string`

#### Returns[​](#returns-13 "Direct link to heading")

[`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

* * *

### isTaggedWith[​](#istaggedwith "Direct link to heading")

▸ `Static` **isTaggedWith**(`remId`): [`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

#### Parameters[​](#parameters-14 "Direct link to heading")

Name

Type

Description

`remId`

`string`

#### Returns[​](#returns-14 "Direct link to heading")

[`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

* * *

### multiSelect[​](#multiselect "Direct link to heading")

▸ `Static` **multiSelect**<`Matcher`\>(`matches`): [`SearchPortalMultiSelectQueryExpression`](/api/modules#searchportalmultiselectqueryexpression)

#### Type parameters[​](#type-parameters-5 "Direct link to heading")

Name

Type

`Matcher`

extends [`IsEmpty`](/api/enums/MultiSelectMatcher#isempty) | [`IsNotEmpty`](/api/enums/MultiSelectMatcher#isnotempty)

#### Parameters[​](#parameters-15 "Direct link to heading")

Name

Type

`matches`

`Matcher`

#### Returns[​](#returns-15 "Direct link to heading")

[`SearchPortalMultiSelectQueryExpression`](/api/modules#searchportalmultiselectqueryexpression)

▸ `Static` **multiSelect**<`Matcher`\>(`matches`, `remIds`): [`SearchPortalMultiSelectQueryExpression`](/api/modules#searchportalmultiselectqueryexpression)

#### Type parameters[​](#type-parameters-6 "Direct link to heading")

Name

Type

`Matcher`

extends [`MultiSelectMatcher`](/api/enums/MultiSelectMatcher)

#### Parameters[​](#parameters-16 "Direct link to heading")

Name

Type

`matches`

`Matcher`

`remIds`

`string`\[\]

#### Returns[​](#returns-16 "Direct link to heading")

[`SearchPortalMultiSelectQueryExpression`](/api/modules#searchportalmultiselectqueryexpression)

* * *

### not[​](#not "Direct link to heading")

▸ `Static` **not**(`queryExpressions`): [`SearchPortalQuery`](/api/modules#searchportalquery-1)

#### Parameters[​](#parameters-17 "Direct link to heading")

Name

Type

`queryExpressions`

[`SearchPortalQuery`](/api/modules#searchportalquery-1)

#### Returns[​](#returns-17 "Direct link to heading")

[`SearchPortalQuery`](/api/modules#searchportalquery-1)

* * *

### number[​](#number "Direct link to heading")

▸ `Static` **number**<`Matcher`\>(`matches`): [`SearchPortalNumberQueryExpression`](/api/modules#searchportalnumberqueryexpression)

#### Type parameters[​](#type-parameters-7 "Direct link to heading")

Name

Type

`Matcher`

extends [`IsEmpty`](/api/enums/NumberMatcher#isempty) | [`IsNotEmpty`](/api/enums/NumberMatcher#isnotempty)

#### Parameters[​](#parameters-18 "Direct link to heading")

Name

Type

`matches`

`Matcher`

#### Returns[​](#returns-18 "Direct link to heading")

[`SearchPortalNumberQueryExpression`](/api/modules#searchportalnumberqueryexpression)

▸ `Static` **number**<`Matcher`\>(`matches`, `n`): [`SearchPortalNumberQueryExpression`](/api/modules#searchportalnumberqueryexpression)

#### Type parameters[​](#type-parameters-8 "Direct link to heading")

Name

Type

`Matcher`

extends [`NumberMatcher`](/api/enums/NumberMatcher)

#### Parameters[​](#parameters-19 "Direct link to heading")

Name

Type

`matches`

`Matcher`

`n`

`number`

#### Returns[​](#returns-19 "Direct link to heading")

[`SearchPortalNumberQueryExpression`](/api/modules#searchportalnumberqueryexpression)

* * *

### or[​](#or "Direct link to heading")

▸ `Static` **or**(`queryExpressions`): [`SearchPortalQuery`](/api/modules#searchportalquery-1)

#### Parameters[​](#parameters-20 "Direct link to heading")

Name

Type

`queryExpressions`

[`SearchPortalQuery`](/api/modules#searchportalquery-1)\[\]

#### Returns[​](#returns-20 "Direct link to heading")

[`SearchPortalQuery`](/api/modules#searchportalquery-1)

* * *

### singleSelect[​](#singleselect "Direct link to heading")

▸ `Static` **singleSelect**<`Matcher`\>(`matches`): [`SearchPortalSingleSelectQueryExpression`](/api/modules#searchportalsingleselectqueryexpression)

#### Type parameters[​](#type-parameters-9 "Direct link to heading")

Name

Type

`Matcher`

extends [`IsEmpty`](/api/enums/SingleSelectMatcher#isempty) | [`IsNotEmpty`](/api/enums/SingleSelectMatcher#isnotempty)

#### Parameters[​](#parameters-21 "Direct link to heading")

Name

Type

`matches`

`Matcher`

#### Returns[​](#returns-21 "Direct link to heading")

[`SearchPortalSingleSelectQueryExpression`](/api/modules#searchportalsingleselectqueryexpression)

▸ `Static` **singleSelect**<`Matcher`\>(`matches`, `remIds`): [`SearchPortalSingleSelectQueryExpression`](/api/modules#searchportalsingleselectqueryexpression)

#### Type parameters[​](#type-parameters-10 "Direct link to heading")

Name

Type

`Matcher`

extends [`SingleSelectMatcher`](/api/enums/SingleSelectMatcher)

#### Parameters[​](#parameters-22 "Direct link to heading")

Name

Type

`matches`

`Matcher`

`remIds`

`string`\[\]

#### Returns[​](#returns-22 "Direct link to heading")

[`SearchPortalSingleSelectQueryExpression`](/api/modules#searchportalsingleselectqueryexpression)

* * *

### tableColumn[​](#tablecolumn "Direct link to heading")

▸ `Static` **tableColumn**(`columnId`, `query`): [`SearchPortalSlotQueryNode`](/api/modules#searchportalslotquerynode)

#### Parameters[​](#parameters-23 "Direct link to heading")

Name

Type

Description

`columnId`

`string`

`query`

[`SearchPortalQuery`](/api/modules#searchportalquery-1)

#### Returns[​](#returns-23 "Direct link to heading")

[`SearchPortalSlotQueryNode`](/api/modules#searchportalslotquerynode)

* * *

### tagWithoutInheritance[​](#tagwithoutinheritance "Direct link to heading")

▸ `Static` **tagWithoutInheritance**(`remId`): [`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

#### Parameters[​](#parameters-24 "Direct link to heading")

Name

Type

`remId`

`string`

#### Returns[​](#returns-24 "Direct link to heading")

[`SearchPortalRefQueryExpression`](/api/modules#searchportalrefqueryexpression)

* * *

### text[​](#text "Direct link to heading")

▸ `Static` **text**<`Matcher`\>(`matches`): [`SearchPortalTextQueryExpression`](/api/modules#searchportaltextqueryexpression)

#### Type parameters[​](#type-parameters-11 "Direct link to heading")

Name

Type

`Matcher`

extends [`IsEmpty`](/api/enums/TextMatcher#isempty) | [`IsNotEmpty`](/api/enums/TextMatcher#isnotempty)

#### Parameters[​](#parameters-25 "Direct link to heading")

Name

Type

`matches`

`Matcher`

#### Returns[​](#returns-25 "Direct link to heading")

[`SearchPortalTextQueryExpression`](/api/modules#searchportaltextqueryexpression)

▸ `Static` **text**<`Matcher`\>(`matches`, `text`): [`SearchPortalTextQueryExpression`](/api/modules#searchportaltextqueryexpression)

#### Type parameters[​](#type-parameters-12 "Direct link to heading")

Name

Type

`Matcher`

extends [`TextMatcher`](/api/enums/TextMatcher)

#### Parameters[​](#parameters-26 "Direct link to heading")

Name

Type

`matches`

`Matcher`

`text`

`string`

#### Returns[​](#returns-26 "Direct link to heading")

[`SearchPortalTextQueryExpression`](/api/modules#searchportaltextqueryexpression)
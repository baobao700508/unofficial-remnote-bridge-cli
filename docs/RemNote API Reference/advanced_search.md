<!-- source: https://plugins.remnote.com/advanced/search -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   Advanced
-   Search

On this page

# Search

## Finding Rem using Ids[​](#finding-rem-using-ids "Direct link to heading")

If you know the Id of the Rem you want to find, you can use the `findOne` or `findMany` methods in the Rem namespace to get the Rem object:

```codeBlockLines_HKiK
const remId = "rem-id";const rem = await plugin.rem.findOne(remId);const remIds = ["rem-1", "rem-2", "rem-3"];const rems = await plugin.rem.findMany(remIds);
```

Note that `findOne` will return `undefined` when 1) a Rem with the Id you provided does not exist, or 2) you do not have the permissions to access the Rem.

## Finding Top-Level Rem[​](#finding-top-level-rem "Direct link to heading")

To find a top-level Rem (a Rem without a parent) when you don't know the Id, you can use the `plugin.rem.findByName` method. You provide the text of the Rem as a parameter, so the example below will return a top-level Rem with text "hello" if it exists.

```codeBlockLines_HKiK
const rem = await plugin.rem.findByName(["hello"])
```

Note that `findByName` will return `undefined` when 1) a top-level Rem with the text you provided does not exist, or 2) you do not have the permissions to access the Rem.

## Global Rem Text Search[​](#global-rem-text-search "Direct link to heading")

To find any Rem in a user's knowledgebase based on its text, use the `plugin.search.search()` method:

```codeBlockLines_HKiK
const text = ["biology"];const rem = plugin.search.search(text);
```

You can pass some additional parameters to refine the search:

If you are searching within a Rem, you probably don't want to return the Rem itself - in this case you can pass the remId as the `searchContextRemId` parameter which will filter it from the results. This also changes the ranking slightly to rank nearby Rem higher.

In the options object, you can specify the number of results using the `numResults` field. This is a performance optimization for when you only need a few results and don't want to exhaustively search the user's entire KB.

You can also choose to only search for concepts using the `filterOnlyConcepts` field.
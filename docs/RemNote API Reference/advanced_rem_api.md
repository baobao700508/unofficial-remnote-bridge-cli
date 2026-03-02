<!-- source: https://plugins.remnote.com/advanced/rem_api -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   Advanced
-   The Rem API

On this page

# The Rem API

Here we will introduce you to the most essential API methods for interacting with Rem in a user's RemNote knowledgebase.

## Creating Rem[​](#creating-rem "Direct link to heading")

Creating Rem is as simple as calling the `plugin.rem.createRem()` method on the Rem plugin object:

```codeBlockLines_HKiK
const plugin = usePlugin();const rem = useRunAsync(async () => await plugin.rem.createRem(), []);
```

This will create a completely empty Rem with no text. If you want to add some text, check the section below which explains the available Rem object methods.

Note that calls to `plugin.rem.createRem()` will automatically add the Rem in the broadest scope that your plugin has access to. See the the list of plugin permission scopes and `createRem` behaviors on the [plugin permissions](/advanced/permissions) page.

### Rate Limits[​](#rate-limits "Direct link to heading")

Note that we throttle the rate at which new Rem are created to avoid plugins causing the app to lag or crash while importing a lot of data. Typical plugins are unlikely to notice the rate limit, but if you are building a plugin to sync a significant amount of data from a third-party service, you may notice it. The time taken to create 1000 Rem is roughly 25 seconds. We believe that plugins will not be negatively impacted by this, but if you find the rate limit too restrictive, please get in touch and let us know.

## Getting Rem[​](#getting-rem "Direct link to heading")

You can access Rem in a user's knowledgebase by using the methods in the `rem` namespace of the `plugin` object. To access a single Rem by its id, use the `findOne` method:

```codeBlockLines_HKiK
const plugin = usePlugin();const remId = 'rem-i-want-to-find';const rem = useRunAsync(async () => await plugin.rem.findOne(remId), [remId]);
```

And to fetch a list of Rem by their ids, use the `findMany` method:

```codeBlockLines_HKiK
const plugin = usePlugin();const remIds = ['first-rem-i-want-to-find', 'second-rem-i-want-to-find'];const rem = useRunAsync(  async () => await plugin.rem.findMany(remIds),  [remIds],);
```

Note: Depending on your plugin's permission scope, you might not be able to access certain Rem in users' knowledgebases. For example, if your plugin's permission scope is retricted to `DescendantsOfName`, then your plugin will only be able to access Rem that are a descendant of a Rem with the given name. For more details, see the [plugin permissions](/advanced/permissions) documentation page.

## The Rem object[​](#the-rem-object "Direct link to heading")

The `findOne` and `findMany` methods return Rem objects which contain a large number of methods for interacting with Rem. Here we'll introduce some of the most commonly used methods. If you want to see the full list of available Rem methods, see the Rem object API documentation page, or inspect the Rem interface in your IDE.

### Text[​](#text "Direct link to heading")

To set the text of a Rem, use the `.setText()` method.

```codeBlockLines_HKiK
const plugin = usePlugin();const remId = '...';const rem = useRunAsync(async () => await plugin.rem.findOne(remId), [remId]);rem.setText(['Hello World']);
```

Note that `.setText()` takes a `RichTextInterface` as its argument, rather than plain text.

### Flashcards[​](#flashcards "Direct link to heading")

Flashcards are automatically created for Rem with non-empty `text` and `backText` fields. The `text` field will represent the question side of a flashcard, and the `backText` will represent the answer. You can set the `text` and `backText` fields of a Rem using the `.setText()` and `.setBackText()` methods.

To get a list of the flashcards which are generated from the current Rem, use the `getCards()` method.

You can also control the directions in which a flashcards can be studied. To do this, you can use the `setEnableBackwardPractice()` and `setEnableForwardPractice()` methods.

### Deleting Rem[​](#deleting-rem "Direct link to heading")

Simply use the `remove` method:

```codeBlockLines_HKiK
const plugin = usePlugin();const remId = '...';const rem = useRunAsync(async () => await plugin.rem.findOne(remId), [remId]);rem.remove();
```
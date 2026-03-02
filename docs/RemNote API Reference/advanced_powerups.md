<!-- source: https://plugins.remnote.com/advanced/powerups -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   Advanced
-   Powerups

On this page

# Powerups

Powerups are tags that you can add to Rem which also add new functionality. Chances are you are already familiar with using powerups like the Todo powerup, and Edit Later powerup. Now with the RemNote plugin API, you can make the powerup system even more powerful by creating your own custom powerups!

## Interacting with Built In Powerups[​](#interacting-with-built-in-powerups "Direct link to heading")

You can get the Rem representing a powerup using the `getPowerupByCode` method:

```codeBlockLines_HKiK
await plugin.powerup.getPowerupByCode(BuiltInPowerupCodes.Link);
```

You can get the data stored in a particular powerup property by using the `getPowerupProperty` method:

```codeBlockLines_HKiK
await plugin.powerup.getPowerupProperty(BuiltInPowerupCodes.Link, 'URL');
```

## Registering Custom Powerups[​](#registering-custom-powerups "Direct link to heading")

Here's an example of how to register a custom powerup:

```codeBlockLines_HKiK
await plugin.app.registerPowerup({  name: 'Custom Edit Later', // human-readable name  code: 'customEditLater', // powerup code used to uniquely identify the powerup  description: 'A Custom Edit Later powerup', // description  options: {    properties: [      {        // property code used to uniquely identify the powerup property        code: 'message',        // human readable property code name        name: 'Message',        // (optional: false by default)        // only allow the property to be modified programatically        onlyProgrammaticModifying: true,        // (optional: false by default)        // hide the property - don't show it in the editor        hidden: true,      },    ],  },});
```

Properties allow you to store custom data fields on Rem which are tagged with your custom powerup. In the example above, we added a property called "Message". Later on we will see how to save data and retrieve data from this property.

## Tagging Rem with Powerups[​](#tagging-rem-with-powerups "Direct link to heading")

When you register a powerup, this will create a powerup Rem with the name you specified in the user's knowledgebase. You can apply a powerup to another Rem by tagging that Rem with the powerup Rem:

```codeBlockLines_HKiK
const anotherRem = await plugin.rem.createRem();// pass the powerup code we used to register the powerupconst editLaterPowerup = await plugin.powerup.getPowerupByCode(  'customEditLater',);await anotherRem.addTag(editLaterPowerup._id);
```

This is essentially the same as typing "##" followed by the name of a powerup and pressing enter in RemNote.

Of course, you aren't limited to using your custom powerup inside plugins, users will also be able to use exactly the same workflows as with core powerups.

## Getting Rem Tagged with Your Powerup[​](#getting-rem-tagged-with-your-powerup "Direct link to heading")

You can easily get a list of all the Rem tagged with your powerup by using the `.taggedRem()` method on the powerup Rem object.

```codeBlockLines_HKiK
const editLaterPowerup = await plugin.powerup.getPowerupByCode(  'customEditLater',);const editLaters = await editLaterPowerup.taggedRem();
```

## Properties[​](#properties "Direct link to heading")

As mentioned above, properties are a data storage mechanism - they allow you to store key-value pairs on Rem tagged with the powerup.

### Setting Data in Properties[​](#setting-data-in-properties "Direct link to heading")

Here's an example of how to set the "message" property on our Custom Edit Later powerup to "Hello World".

```codeBlockLines_HKiK
const anotherRem = await plugin.rem.createRem();const editLaterPowerup = await plugin.powerup.getPowerupByCode(  'customEditLater',);await anotherRem.addTag(powerup.id);await anotherRem.setPowerupProperty(  'customEditLater', // powerup code  'message', // property code  ['Hello World'], // value (RichTextInterface));
```

Note that powerup property values are stored as `RichTextInterface` values, rather than as strings or some other data format.

Since users can interact with your custom registered powerups like normal core powerups, they can also add properties manually by adding children to the tagged Rem and using the property Omnibar command.

### Getting Data from Properties[​](#getting-data-from-properties "Direct link to heading")

To get the value of a property from a Rem tagged with a powerup, call the `.getPowerupProperty()` method:

```codeBlockLines_HKiK
const value = await anotherRem.getPowerupProperty(  'customEditLater', // powerup code  'message', // property code);
```
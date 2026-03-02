<!-- source: https://plugins.remnote.com/advanced/settings -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   Advanced
-   Settings

On this page

# Settings

Plugins can register settings without having to build any custom UI components. Settings automatically appear in the standard RemNote Settings UI and are automatically synced across devices.

## Registering Settings[​](#registering-settings "Direct link to heading")

### strings[​](#strings "Direct link to heading")

```codeBlockLines_HKiK
async function onActivate(plugin: ReactRNPlugin) {  await plugin.settings.registerStringSetting({    id: "name",    title: "What is your name?",    defaultValue: "Bob",  });});
```

You can also register multiline text settings by passing `multiline: true`:

```codeBlockLines_HKiK
async function onActivate(plugin: ReactRNPlugin) {  await plugin.settings.registerStringSetting({    id: "name",    title: "What is your name?",    defaultValue: "Bob",    multiline: true,  });});
```

### numbers[​](#numbers "Direct link to heading")

```codeBlockLines_HKiK
async function onActivate(plugin: ReactRNPlugin) {  await plugin.settings.registerNumberSetting({    id: "age",    title: "What is your age?",    defaultValue: 20,  });});
```

### booleans[​](#booleans "Direct link to heading")

```codeBlockLines_HKiK
async function onActivate(plugin: ReactRNPlugin) {  await plugin.settings.registerBooleanSetting({    id: "trueOrFalse",    title: "True or False?",    defaultValue: false,  });});
```

### dropdowns[​](#dropdowns "Direct link to heading")

```codeBlockLines_HKiK
await plugin.settings.registerDropdownSetting({  id: "favorite-food",  title: "Favorite Food",  defaultValue: "pizza"  options: [{    key: "0",    label: "Pizza",    value: "pizza",  },  {    key: "1",    label: "Cake",    value: "cake",  }]})
```

## Getting Settings[​](#getting-settings "Direct link to heading")

Settings can be retrieved through plugin method calls or plugin hooks by passing the same id you used to register the setting.

```codeBlockLines_HKiK
const value = useTracker(  async (reactivePlugin) =>    await reactivePlugin.settings.getSetting('mySettingId'),  [],);
```

```codeBlockLines_HKiK
const value = await plugin.settings.getSetting('mySettingId");
```
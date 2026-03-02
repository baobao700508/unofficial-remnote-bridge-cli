<!-- source: https://plugins.remnote.com/advanced/events -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   Advanced
-   Event Handling

On this page

# Event Handling

## Event Types[​](#event-types "Direct link to heading")

All event types are documented in the `AppEvents` enum [documentation page](/api/modules#appevents).

## Reactive Hooks[​](#reactive-hooks "Direct link to heading")

You often won't need to listen to an event directly and can instead rely on our [Reactive Hooks](/advanced/react):

## Listening to Events[​](#listening-to-events "Direct link to heading")

We strongly recommend you always use our pre-packaged hooks for registering event listeners. These hooks cleanup after themselves automatically to avoid memory leaks.

```codeBlockLines_HKiK
useAPIEventListener(  AppEvents.ClickRemReference, // App event id  'workspace', // event key for keyed events, else undefined  (data) => {    // event callback    /* ... */  },);
```

## Global and Keyed Events[​](#global-and-keyed-events "Direct link to heading")

Events can either be "Global" or "Keyed".

-   **Keyed Events** trigger for individual items, such as `AppEvents.RemChanged`. See the AppEvents enum for documentaiton on each key type.

For event types which require an event key, pass the key as the third argument to `useAPIEventListener`.:

```codeBlockLines_HKiK
useAPIEventListener(AppEvents.RemChanged, rem._id, () => {  /* ... */});
```

-   Rem Events (key=RemId):
    
    -   `AppEvents.RemChanged`
-   Powerup Events (key=PowerupCode):
    
    -   `AppEvents.ClickRemReference`
-   Special Events
    
    -   `AppEvents.MessageBroadcast (key = Message Channel)`
    -   `AppEvents.SettingChanged (key = Setting ID)`
    -   `AppEvents.StorageSessionChange (key = Storage Key)`
    -   `AppEvents.StorageSyncedChange (key = Storage Key)`
    -   `AppEvents.StorageLocalChange (key = Storage Key)`
-   **Global Events** trigger when for events that effect the entire app, such as `AppEvents.QueueEnter`.
    

You do not need to pass an event key to listen to a global event:

```codeBlockLines_HKiK
useAPIEventListener(AppEvents.QueueEnter, undefined, () => {  /* ... */});
```

-   Global Events (key=undefined):
    -   `AppEvents.GlobalOpenRem`
    -   `AppEvents.URLChange`
    -   `AppEvents.QueueCompleteCard`
    -   `AppEvents.QueueEnter`
    -   `AppEvents.QueueExit`
    -   `AppEvents.EditorSelectionChanged`
    -   `AppEvents.EditorTextEdited`
    -   `AppEvents.ClickSidebarItem`
<!-- source: https://plugins.remnote.com/advanced/storage -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   Advanced
-   Storage

On this page

# Storage

We provide two kinds of storage: Rem Storage and Key-Value pairs.

## Rem Storage[​](#rem-storage "Direct link to heading")

In RemNote, **everything is a Rem**. We strongly encourage you to store information within Rem when possible. This has a number of benefits:

1.  Syncing and merging diffs are automatically handled.
2.  Your plugin data is inspectible by the user, allowing you to rely on the core RemNote editor for powerful UX interactions.
3.  Your plugin data can define a shared schema through our [powerup system](/advanced/powerups) in a way that's interpretable by the end user and other plugins.
4.  Data is shared across all users of the KB.
5.  Your data will automatically work nicely with some upcoming RemNote features where tabular data is useful. ;)

To learn more about how to store data using Rem, see our [powerup system](/advanced/powerups) documentation, which explains how to attach key-value pairs to Rem using custom powerups.

## Key-Value Pair Storage[​](#key-value-pair-storage "Direct link to heading")

All key-value pairs are automatically synced between widgets, making it easy to create complex plugins. Using any of the following hooks inside a widget component will cause components to re-render whenever the storage variable changes.

### Session Storage[​](#session-storage "Direct link to heading")

Session storage is transient and only stored until the user refreshes the page. If your user closes and re-opens your widget, session storage will be **retained**.

Our React helpers mimic the interface of `useState`, but add magic syncing and storage behind the scenes:

```codeBlockLines_HKiK
const [value, setValue] = useSessionStorageState<Value>(  'myStorageKey',  'myDefaultValue',);
```

### Synced Storage[​](#synced-storage "Direct link to heading")

Synced storage is automatically synced and stored at the **user level**. That means that key-value pairs stored here will get synced between a user's different devices.

```codeBlockLines_HKiK
const [value, setValue] = useSyncedStorageState<Value>(  'myStorageKey',  'myDefaultValue',);
```

### Local Storage[​](#local-storage "Direct link to heading")

Synced storage is only stored on the local machine at the **user level**. That means that key-value pairs stored here will **not** get synced between users' devices, they will only stay on the local machine.

```codeBlockLines_HKiK
const [value, setValue] = useLocalStorageState<Value>(  'myStorageKey',  'myDefaultValue',);
```
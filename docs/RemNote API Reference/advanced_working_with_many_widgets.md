<!-- source: https://plugins.remnote.com/advanced/working_with_many_widgets -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   Advanced
-   Working With Multiple Widgets

On this page

# Working With Multiple Widgets

Each widget runs in a separate IFrame and thus in a different browser process. We've created a shared messaging and storage layer to make it easy for you to work with multiple widgets.

## Messaging[​](#messaging "Direct link to heading")

You can use the message broadcasting API methods and hooks to send and receive arbitrary data between widgets.

See our [messaging](/advanced/messaging) documentation for examples.

## Storage[​](#storage "Direct link to heading")

You can use the storage API and hooks to persist synced and local-only data which can be accessed by multiple widgets and even multiple plugins.

See our [storage](/advanced/storage) documentation for examples.
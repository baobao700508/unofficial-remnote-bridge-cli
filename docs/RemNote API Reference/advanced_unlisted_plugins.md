<!-- source: https://plugins.remnote.com/advanced/unlisted_plugins -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   Advanced
-   Unlisted Plugins

On this page

# Unlisted Plugins

## Uploading[​](#uploading "Direct link to heading")

If you want to upload a plugin for personal use without listing it on the plugin marketplace, you can set unlisted to `true` in the plugin `manifest.json` file.

```codeBlockLines_HKiK
{  "id": "pluginId"  ...  "unlisted": true,}
```

Note that the plugin will still need to abide by our [submission guidelines](/advanced/submitting_plugins) and be approved by a RemNote team member.

## Installing[​](#installing "Direct link to heading")

To install an unlisted plugin, navigate to the URL for your plugin in a web browser. The URL for your plugin will be `https://www.remnote.com/plugins/{YOUR PLUGIN ID}`. For example, if your plugin ID is `pluginId`, the URL will be `https://www.remnote.com/plugins/pluginId`. This link will take you to the plugin marketplace page for your unlisted plugin. You can also share this link with others.
<!-- source: https://plugins.remnote.com/advanced/assets -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   Advanced
-   Asset Handling

On this page

# Asset Handling

Plugins can include CSS, images, media files, and other arbitrary assets. We aim to support a wide range of devices (web, desktop, mobile) and modes (native plugins, sandboxed plugins, and in-progress developer plugins). To ensure that assets are loaded correctly across different environments, please follow the following guidelines:

## The `public` folder[​](#the-public-folder "Direct link to heading")

Any files in the `public` folder are automatically bundled directly into your plugin in the **root** folder. For example, if you have created a `/public/logo.png` file, it will be accessible in sandbox mode at `${plugin.rootURL}logo.png}` (ex. at `localhost:8080/logo.png`).

## The `plugin.rootURL` property[​](#the-pluginrooturl-property "Direct link to heading")

You should not rely on static, relative, or absolute pathnames. These pathnames mayb break on different devices, or in native mode. Instead, always construct pathnames dynamically of the style of `${plugin.rootURL}logo.png}`.

## Adding Assets[​](#adding-assets "Direct link to heading")

Assets can be easily created:

1.  Create a file in the `/public` folder of the plugin template.
2.  Access your asset dynamically through a `${plugin.rootURL}fileName.fileExtension` path.

For example, if you've created `/public/logo.png`, you should embed your logo image in React with:

```codeBlockLines_HKiK
<img src={`${plugin.rootURL}logo.svg\`}/>
```
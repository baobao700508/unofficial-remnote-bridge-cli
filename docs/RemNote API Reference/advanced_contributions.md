<!-- source: https://plugins.remnote.com/advanced/contributions -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   Advanced
-   Contributions

On this page

# Contributions

Your plugin can add a number of custom styles and functionalities to RemNote, including powerups, slash commands, menu items and Custom CSS. These are called _Contributions_. Widgets are also a type of Contribution. You learned about them on the [Widgets page](/advanced/widgets).

Contributions are _registered_, usually in your index widget, by by calling a `registerCONTRIBUTION_NAME` function.

You can update some contributions by calling the register function again, e.g. to supply a new CSS string.

## Example: Adding Custom CSS[​](#example-adding-custom-css "Direct link to heading")

You can register any text as Custom CSS like this:

```codeBlockLines_HKiK
plugin.app.registerCSS(  'text-color',  `.rem-text { color: var(--rn-${color}-80);`,);
```

## 🚧 Under Construction 🚧[​](#-under-construction- "Direct link to heading")

More docs coming soon.
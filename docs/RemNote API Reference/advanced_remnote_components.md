<!-- source: https://plugins.remnote.com/advanced/remnote_components -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   Advanced
-   RemNote Components

On this page

# RemNote Components

The remnote plugin sdk includes out of the box components that you can use to provide native RemNote experience within your plugin. Some of the core components are [RemRichTextEditor](/api/classes/RemRichTextEditor), [RemHierarchyEditorTree](/api/classes/RemHierarchyEditorTree), [Queue](/api/classes/Queue), etc.

## Sizing Parameters[​](#sizing-parameters "Direct link to heading")

We've developed a technology we're calling "Virtual Embedding" to render these core RemNote components. For performance reasons, Virtual Embedding renders the component in a div in the main RemNote page, rather than within your widget's iframe. To ensure correct rendering, you must manually specify width and height parameters for the RemNote components.

All the RemNote components using Virtual Embedding have these props that you can use to size the component.

```codeBlockLines_HKiK
interface ComponentDimensionProps {  height?: number | Percentage | 'auto';  maxHeight?: number | Percentage | 'auto';  width?: number | Percentage | 'auto';  maxWidth?: number | Percentage | 'auto';}
```

The width and height parameters can be number (pixel), percentage based string or `auto`. The percentage based value will depend on direct parent's dimension and `auto` will take up only the requried space. The default value is `auto`.

## Cheat Sheet:[​](#cheat-sheet "Direct link to heading")

-   `auto`: Wrap the size of the content being rendered.
    
    ![Widget Locations](/img/tutorials/width_auto.svg)
    
-   `100%`: Match the size of the parent.
    
    ![Widget Locations](/img/tutorials/width_100.svg)
    
-   `60%`: Match a percent of the parent's size.
    
    ![Widget Locations](/img/tutorials/width_60.svg)
    

## Examples[​](#examples "Direct link to heading")

```codeBlockLines_HKiK
<div>  <RemViewer remId='remId' width='50%'></div>
```

```codeBlockLines_HKiK
<div>  <RemRichTextEditor maxWidth='70%' height={200}></div>
```
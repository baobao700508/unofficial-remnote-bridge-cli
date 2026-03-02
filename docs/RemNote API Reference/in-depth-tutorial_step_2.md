<!-- source: https://plugins.remnote.com/in-depth-tutorial/step_2 -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   In-Depth Tutorial
-   Step 2 - Using Hooks

On this page

# Step 2 - Using Hooks

Now let's take our first steps into the RemNote API by modifying our `SelectedTextDictionary` component to:

-   Display the user's currently selected text rather than "Hello World!".
-   Keep the widget up to date by rerendering the widget every time the user's selected text changes.

Open the `selected_text_dictionary.tsx` file and make the following changes to the body of the `SelectedTextDictionary` component:

```codeBlockLines_HKiK
import {  usePlugin,  renderWidget,  useTracker,  SelectionType,} from '@remnote/plugin-sdk';function SelectedTextDictionary() {  const plugin = usePlugin();  const selText = useTracker(async (reactivePlugin) => {    const sel = await reactivePlugin.editor.getSelection();    if (sel?.type == SelectionType.Text) {      return await plugin.richText.toString(sel.richText);    } else {      return '';    }  });  return <div>{selText}</div>;}renderWidget(SelectedTextDictionary);
```

Don't worry if this code looks intimidating, we are going to break it down line by line.

Since we want to access the value of the user's selected text, our first instinct might be to call the `plugin.editor.getSelection(...)` function. This seems like a reasonable approach, but it doesn't allow us to update our component in response to changes in the selected text.

What we need is a way to access the latest selected text value in our component every time it changes. While it would be possible to do this with `useEffect` and subscribing to selected text change events using `plugin.event.addListener`, this would make our code a bit messy and more difficult to understand. Thankfully there is a much better option available: Reactive Hooks!

## The Tracker System (Reactive Hooks)[​](#the-tracker-system-reactive-hooks "Direct link to heading")

```codeBlockLines_HKiK
const selText = useTracker(async (reactivePlugin) => {  const sel = await reactivePlugin.editor.getSelection();  if (sel?.type == SelectionType.Text) {    return await plugin.richText.toString(sel.richText);  } else {    return '';  }});
```

Reactive functions allow you to tell the plugin system that your widget component wants to be notified every time the value of some variable changes, so it can rerender in response to the change. So in our example, the `useTracker` hook wraps the normal plugin API methods and automatically subscribes to relevant events which tells the plugin system that our component doesn't just want to get the current value of the selected text, but it wants to rerender **every time** the selected text changes.

Reactive hooks are explained in depth in our [reactive method hooks](/advanced/react#reactive-method-hooks) documentation.

## Rich Text[​](#rich-text "Direct link to heading")

If you hover over the `sel.richText` variable, your IDE should tell you that the type of this variable is `RichTextInterface`. `RichTextInterface` represents the underlying rich text storage format in RemNote. Rather than storing text as a string using some kind of markup language, text is stored internally as an array of rich text elements where each element could represent plain text, bold text, text with color, embedded media like images and audio etc. We won't delve into the intricacies of this data type here.

We simply use the `plugin.richText.toString()` method to convert from the `RichTextInterface` representation to a human-readable string so we can display it to the user.

Let's test our new component!

If you still have the plugin running from the test we did earlier, the plugin should have automatically refreshed itself in response to the changes you made. Otherwise you will need to open a new terminal inside the plugin folder, and run:

```codeBlockLines_HKiK
npm run dev
```

![Selected Text Widget](/img/tutorials/selected_text_widget.png)

Open a Rem, highlight some text and click on the dictionary tab icon. While the selected text menu is open, try changing the highlighted text and make sure that the displayed value of the selected text in the component updates correctly.

Excellent. Now let's start working on the dictionary integration.
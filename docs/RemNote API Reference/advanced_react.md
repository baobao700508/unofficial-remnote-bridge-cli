<!-- source: https://plugins.remnote.com/advanced/react -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   Advanced
-   React Helpers

On this page

# React Helpers

## RemNote React Helper Hooks[​](#remnote-react-helper-hooks "Direct link to heading")

We've provided a number of helper hooks to make it easier to write clean functional React components.

### Reactive Method Hooks (useTracker)[​](#reactive-method-hooks-usetracker "Direct link to heading")

See the [Tracker system docs](/advanced/tracker).

### Non-Reactive Method Hooks[​](#non-reactive-method-hooks "Direct link to heading")

#### useRunAsync[​](#userunasync "Direct link to heading")

The `useRunAsync` simplifies calling of async plugin API methods inside the rendering code of React components.

Consider the following example where we have a variable containing some rich text and we want to convert it to a normal string so we can work with it inside our component.

```codeBlockLines_HKiK
export const MyComponent = () => {  const plugin = usePlugin();  const richText: RichTextInterface = ...  // convert to string  const str = ...}
```

The function to convert `RichTextInterface`s to string is the `toString` method in the `richText` namespace. Like the rest of the plugin API methods it is an async method, so our first instinct is to call it like this: `await plugin.richText.toString(...)`. Unfortunately, this isn't possible within the rendering code of React components without wrapping the async code inside a `useEffect` hook and using `useState` to record the result of the async function.

```codeBlockLines_HKiK
export const MyComponent = () => {  const plugin = usePlugin();  const richText: RichTextInterface = ...  // not possible - can't await async functions here  // const str = await plugin.richText.toString(richText)  // we could use useEffect and useState, but it's pretty messy  const [str, setStr] = useState();  useEffect(() => {    const setStr = async () => {      setStr(await plugin.richText.toString(richText));    }    setStr();  }, [richText])}
```

A better option is to use the `useRunAsync` hook which simplifies our code dramatically by allowing us to call the function inline:

```codeBlockLines_HKiK
export const MyComponent = () => {  const plugin = usePlugin();  const richText: RichTextInterface = ...  // useRunAsync allows us to call the async  // plugin.richText.toString function inline, rather  // than needing to wrap things in useEffect and setState  const str = useRunAsync(    async () => await plugin.richText.toString(richText), // function we want to call    [richText], // dependences (like useEffect)  )}
```

Note that hooks [cannot be called conditionally or inside loops](https://reactjs.org/docs/hooks-rules.html) because it can change the order in which hooks are called, preventing React from tracking the state of your component between rerenders. So the following code will cause errors:

```codeBlockLines_HKiK
if (condition) {  const str = useRunAsync(plugin.richText.toString, [], richText);}
```

If you need to call the function conditionally, move the condition inside the function parameter:

```codeBlockLines_HKiK
const str = useRunAsync(async () => {  if (condition) {    await plugin.richText.toString(richText);  }}, [richText]);
```

See the the [API documentation page](/api/modules#userunapimethod) for more details.

#### useAPIEventListener[​](#useapieventlistener "Direct link to heading")

The `useAPIEventListener` hook simplifies subscribing to plugin events in components - rather than needing to use `useEffect` to add and remove plugin event listeners, you can use the `useAPIEventListener` hook to subscribe to events inline without having to write any boilerplate code:

```codeBlockLines_HKiK
useAPIEventListener(AppEvents.GlobalRemChanged, undefined, async (data) => {  if (data.remId) {    const rem = await plugin.rem.findOne(data.remId);    setRemWordsMap(Re.set(rem.id, allRemText(rem)));  }});
```

Please see the [events documentation page](/advanced/events) for more examples and see the the [API documentation page](/api/modules#useapieventlistener) for more details on the `useAPIEventListener` hook.

### Storage Hooks[​](#storage-hooks "Direct link to heading")

See the [storage documentation](/advanced/storage)
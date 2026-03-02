<!-- source: https://plugins.remnote.com/advanced/tracker -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   Advanced
-   The Tracker System (Reactive Hooks)

On this page

# The Tracker System (Reactive Hooks)

The `useTracker` hook converts normal, non-reactive plugin API methods into reactive methods. "Reactive" means that the methods will be re-run in response to certain events - for example, the normal `plugin.rem.findOne(remId)` method will return a Rem once based on the remId parameter, but it will not attempt to refetch the Rem in response to the user editing the Rem's text or tagging it with a powerup. However using `useTracker` you can ensure that whenever the Rem is changed externally, the Rem will be refetched and your component will re-render with the latest value:

```codeBlockLines_HKiK
const remId = '...';useTracker(  async (reactivePlugin) => await reactivePlugin.rem.findOne(remId), // tracked function to call whenever the Rem changes  [remId], // dependencies (like useEffect));
```

Behind the scenes `useTracker` achieves this by subscribing to the relevant plugin system events and re-running the tracked function when those events fire.

Note that in order for the reactivity to work, you must use the `reactivePlugin` variable passed as an argument to the function parameter rather than a value returned from the `usePlugin` hook in another scope. So doing this will not cause an error, but it won't be reactive:

```codeBlockLines_HKiK
const plugin = usePlugin();const remId = '...';useTracker(  // non-reactive because we didn't use the  // reactivePlugin variable.  async () => await plugin.rem.findOne(remId),  [remId],);
```

You can include multiple reactive method calls inside the same `useTracker` call:

```codeBlockLines_HKiK
const remId = '...';const allDesc = useTracker(  async (reactivePlugin) => {    const rem = await reactivePlugin.rem.findOne(remId);    return await rem.allDescendants();  },  [remId],);
```

Note that `Rem` objects returned from methods called within `useTracker` will also have reactive behavior.

Beware that large `useTracker` functions might not be very efficient - whenever any event related to any method in the function fires, the **entire** tracked function will be re-run, so you should aim to split the function into smaller, logically independant `useTracker` calls.

Below we've created some more examples of common use cases for `useTracker`. You can also see the [API documentation page](http://plugins.remnote.com/api/modules#useTracker) for more details.

#### Settings[​](#settings "Direct link to heading")

In the example below, `useTracker` will return the default setting value of "Pizza". Later if the user sets the favorite food setting to some other value, the component in which we called `useTracker` will rerender and have access to the new value.

```codeBlockLines_HKiK
await plugin.settings.registerStringSetting({  id: 'favoriteFood',  title: 'Favorite Food?',  defaultValue: 'Pizza',});const food = useTracker(  async (reactivePlugin) =>    await reactivePlugin.settings.getSetting('favoriteFood'),);
```

#### Rem[​](#rem "Direct link to heading")

The following code will re-fetch the Rem and re-render our component whenever the Rem is updated.

```codeBlockLines_HKiK
const rem = useTracker(  async (reactivePlugin) => await reactivePlugin.rem.findOne(remId),  [remId],);
```

## Reactivity in the Index Widget[​](#reactivity-in-the-index-widget "Direct link to heading")

You can't use `useTracker` in the `index.ts` widget because React hooks can only be used inside React components. We created a special function called `track` which is very similar to the `useTracker` hook, except that it does not return the value of the reactive method. Instead it returns a function which you can call to stop the reactive computation from re-running in response to events:

```codeBlockLines_HKiK
async function onActivate(plugin: ReactRNPlugin) {  // Changing the focused Rem by clicking around in a document will log the current focused Rem.  const stop = plugin.track((reactivePlugin) => {    const rem = await reactivePlugin.focus.getFocusedRem();    console.log('Focused rem changed!', rem);  });  // The computation is stopped after 10 seconds  // The function will not be re-run again when the focused Rem changes.  setTimeout(() => {    console.log('Stopping reactive computation!');    stop();  }, 1000 * 10);}
```
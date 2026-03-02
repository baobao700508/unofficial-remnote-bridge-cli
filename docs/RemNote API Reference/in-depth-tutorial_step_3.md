<!-- source: https://plugins.remnote.com/in-depth-tutorial/step_3 -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   In-Depth Tutorial
-   Step 3 - Dictionary Integration

On this page

# Step 3 - Dictionary Integration

We have created the technical foundations of the dictionary plugin. Now we need to create a bridge between our plugin and the dictionary API so we can get the definitions of words.

## Dictionary API[​](#dictionary-api "Direct link to heading")

![Dictionary API Webpage](/img/tutorials/dict_api_webpage.png)

We are going to be using a [free English Dictionary API service](https://dictionaryapi.dev/) to get the definitions of words. This service is free and doesn't require that we sign-up or request API keys.

Open the [homepage for the dictionary API service](https://dictionaryapi.dev/) and search for a word. The website will show you an example JSON response. Later in the tutorial are going to take those JSON objects and transform them into RemNote flashcards, but first let's modify our plugin to simply display the JSON response object from the dictionary API for the user's selected text. All we will be concerned with for now is displaying the raw JSON object as a blob of text. We can add some UI polish later.

Go back to `selected_text_dictionary.tsx`. We need to add some code to request the definition of a word when the selected text string changes. The code is mostly straightforward, however note that there is a small performance consideration we need to adress using custom hook called `useDebounce`. Don't worry if this is unfamiliar to you, each section of the following chunk of code will be explained below:

```codeBlockLines_HKiK
import { usePlugin, renderWidget } from '@remnote/plugin-sdk';import React from 'react';function cleanSelectedText(s?: string) {  return (    s      // Remove leading and trailing whitespace      ?.trim()      // Split on whitespace and take the first word      ?.split(/(\s+)/)[0]      // This removes non-alphabetic characters      // including Chinese characters, Cyrillic etc.      // But the Dictionary API in this plugin only      // works with English, so this is okay.      ?.replaceAll(/[^a-zA-Z]/g, '')  );}// We use the `useDebounce` hook to limit the number of API calls// made to the dictionary API to avoid getting rate limited by the APIexport function useDebounce<T>(value: T, msDelay: number) {  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);  React.useEffect(() => {    const handler = setTimeout(() => {      setDebouncedValue(value);    }, msDelay);    return () => {      clearTimeout(handler);    };  }, [value, msDelay]);  return debouncedValue;}function SelectedTextDictionary() {  const plugin = usePlugin();  // This stores the response from the dictionary API.  const [wordData, setWordData] = React.useState<string>();  // By wrapping the call to `useTracker` in  // `useDebounce`, the `selTextRichText` value will only get set  // *after* the user has stopped changing the selected text for 0.5 seconds.  // Since the API gets called every time the value of `selTextRichText` /  // `selText` change, debouncing limits unnecessary API calls.  const searchTerm = useDebounce(    useTracker(async (reactivePlugin) => {      const sel = await reactivePlugin.editor.getSelection();      if (sel?.type == SelectionType.Text) {        return cleanSelectedText(await plugin.richText.toString(sel.richText));      } else {        return undefined;      }    }),    500,  );  // When the selText value changes, and it is not null or undefined,  // call the dictionary API to get the definition of the selText.  React.useEffect(() => {    const getAndSetData = async () => {      if (!searchTerm) {        return;      }      try {        const url = 'https://api.dictionaryapi.dev/api/v2/entries/en/';        const response = await fetch(url + searchTerm);        const json = await response.json();        setWordData(Array.isArray(json) ? json[0] : undefined);      } catch (e) {        console.log('Error getting dictionary info: ', e);      }    };    getAndSetData();  }, [searchTerm]);  return <pre>{JSON.stringify(wordData, null, 2)}</pre>;}renderWidget(SelectedTextDictionary);
```

## Debouncing the reactive selected text[​](#debouncing-the-reactive-selected-text "Direct link to heading")

```codeBlockLines_HKiK
const searchTerm = useDebounce(  useTracker(async (reactivePlugin) => {    const sel = await reactivePlugin.editor.getSelection();    if (sel?.type == SelectionType.Text) {      return cleanSelectedText(await plugin.richText.toString(sel.richText));    } else {      return undefined;    }  }),  500,);
```

Debouncing the function ensures that it doesn't get called too frequently. Recall that `useTracker` will cause our component to rerender **every time** the value of the selected text changes. This means that for every single character the user selects or deselects while dragging the cursor, our component will rerender and trigger an API request to get the definition for the currently selected word. Unless we limit the number of API calls, we are likely to get [rate limited](https://datadome.co/bot-management-protection/what-is-api-rate-limiting/) by the API service.

The `useDebounce` hook allows us to limit the number of API calls. It makes it so that the `searchTerm` variable will only get set after the user has stopped highlighting. It knows that the user has stopped selecting text when there haven't been any selected text updates for 0.5 seconds.

## Cleaning the selected text[​](#cleaning-the-selected-text "Direct link to heading")

```codeBlockLines_HKiK
function cleanSelectedText(s?: string) {  return (    s      // Remove leading and trailing whitespace      ?.trim()      // Split on whitespace and take the first word      ?.split(/(\s+)/)[0]      // This removes non-alphabetic characters      // including Chinese characters, Cyrillic etc.      // But the Dictionary API in this plugin only      // works with English, so this is okay.      ?.replaceAll(/[^a-zA-Z]/g, '')  );}
```

Since the user's selected text could contain multiple words, punctuation, characters from unsupported languages etc, we need to clean the value returned by the `plugin.richText.toString` function so we are left with a single English word which we can request the definition for.

## Getting the definition[​](#getting-the-definition "Direct link to heading")

```codeBlockLines_HKiK
// This stores the response from the dictionary API.const [wordData, setWordData] = R.useState<string>();// When the selText value changes, and it is not null or undefined,// call the dictionary API to get the definition of the selText.React.useEffect(() => {  const getAndSetData = async () => {    if (!searchTerm) {      return;    }    try {      const url = 'https://api.dictionaryapi.dev/api/v2/entries/en/';      const response = await fetch(url + searchTerm);      const json = await response.json();      setWordData(Array.isArray(json) ? json[0] : null);    } catch (e) {      console.log('Error getting dictionary info: ', e);    }  };  getAndSetData();}, [searchTerm]);
```

Each time the debounced `searchTerm` value changes, we send a request to the dictionary API to get the definition of the word and store the response in the `wordData` state variable.

## Displaying the definition[​](#displaying-the-definition "Direct link to heading")

```codeBlockLines_HKiK
return <pre>{JSON.stringify(wordData, null, 2)}</pre>;
```

Finally we use `JSON.stringify` to prettify the JSON object and display it as a string inside the selected text menu.

That's it for part 3 of the tutorial. At this point you should go and test that everything works inside RemNote, then we can move on to creating a better UI and flashcard generation.

If you still have the plugin running from the test we did earlier, the plugin should have automatically refreshed itself in response to the changes you made. Otherwise you will need to open a new terminal inside the plugin folder, and run:

```codeBlockLines_HKiK
npm run dev
```

![Dictionary API Webpage](/img/tutorials/dict_api_response.png)

Now it should show the JSON object response from the Dictionary API with definitions for the selected word.
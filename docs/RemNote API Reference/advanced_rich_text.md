<!-- source: https://plugins.remnote.com/advanced/rich_text -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   Advanced
-   Rich Text

On this page

# Rich Text

Rather than using the `string` datatype and some kind of markup language (eg. markdown) to represent formatted text, RemNote uses the `RichTextInterface` type. `RichTextInterface` is an array of rich text elements, where each rich text element could represent any of the rich text types that get rendered in the editor, like images, audio, latex, bold/italic/highlighted text etc.

## Text[​](#text "Direct link to heading")

### Structure[​](#structure "Direct link to heading")

Plain text is represented simply as a `string`, while text with formatting (like bold, undeline or italics) applied will be represented as a `RichTextElementTextInterface` object (simplified below):

```codeBlockLines_HKiK
export type RichTextElementTextInterface = {  i: RICH_TEXT_ELEMENT_TYPE.TEXT;  text: string;  [RICH_TEXT_FORMATTING.CLOZE]?: string;  [RICH_TEXT_FORMATTING.UNDERLINE]?: boolean;  [RICH_TEXT_FORMATTING.BOLD]?: boolean;  [RICH_TEXT_FORMATTING.ITALIC]?: boolean;  [RICH_TEXT_FORMATTING.QUOTE]?: boolean;  [RICH_TEXT_FORMATTING.CODE]?: boolean;  [RICH_TEXT_FORMATTING.HIGHLIGHT]?: string;  [RICH_TEXT_FORMATTING.CODE_LANGUAGE]?: string;};
```

The `i` field tells you the type of the rich text object. This helps typescript infer the available fields on different kinds of rich text. You can also use it to filter rich text arrays:

```codeBlockLines_HKiK
const selection = await plugin.editor.getSelectedText();const onlyFormattedText = selection.richText.filter(  (e) => typeof e !== 'string' && e.i === RICH_TEXT_ELEMENT_TYPE.TEXT,);
```

There are a number of optional formatting fields you can use to apply text formats to rich text. For example, to make rich text bold you set the `RICH_TEXT_FORMATTING.UNDERLINE` field to `true`:

```codeBlockLines_HKiK
const richTextElement: RichTextElementTextInterface = ...;richTextElement[RICH_TEXT_FORMATTING.UNDERLINE] = true;
```

## Rich Text Builder[​](#rich-text-builder "Direct link to heading")

Rather than manually constructing rich text objects yourself, you can use the `RichTextBuilder` methods in the `plugin.richText` namespace:

```codeBlockLines_HKiK
const richText = await plugin.richText  .text('Hello World', ['bold', 'underline'])  .newline()  .text('A video:')  .newline()  .video('https://youtube.com/...')  .newline()  .text('and a ')  .highlight('screenshot: ', 'green')  .image('https://...', 600, 300)  .value();
```

Don't forget to await the asynchronous `.value()` method at the end to return the rich text array.

## Manipulating Rich Text[​](#manipulating-rich-text "Direct link to heading")

There are a many methods in the `plugin.richText` namespace which you can use to manipulate rich text. Many of the methods mirror the JavaScript string APIs you are already used to - eg. `substring`, `indexOf`, `length` and `trim`. There are also some others which are specific to RemNote, like `getRemIdsFromRichText`.
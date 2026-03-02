<!-- source: https://plugins.remnote.com/CHANGELOG -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   Changelog

On this page

# Changelog

## 0.0.39[​](#0039 "Direct link to heading")

-   Breaking: updated the `plugin.app.registerPowerup` method to take an object argument instead.

## 0.0.38[​](#0038 "Direct link to heading")

-   Added `cardId` to the `AppEvents.RevealAnswer` event data.

## 0.0.37[​](#0037 "Direct link to heading")

-   Added `plugin.app.waitForInitialSync` method which returns a promise that resolves when the initial sync is complete. This is useful for plugins that need to wait for the initial sync to complete before eg. syncing data from a third party service.

## 0.0.36[​](#0036 "Direct link to heading")

-   Added `plugin.queue.getCurrentCard` method to get the current card in the flashcard queue.

## 0.0.35[​](#0035 "Direct link to heading")

-   Small CSS changes to fix native plugins in dark mode.

## 0.0.34[​](#0034 "Direct link to heading")

-   Added `WidgetLocation.FlashcardUnder` widget location which allows you to add extra elements under the flashcard content.

## 0.0.33[​](#0033 "Direct link to heading")

-   Added a new `queueItemTypeFilter` for the register widget method.

## 0.0.32[​](#0032 "Direct link to heading")

-   Added a new reader namespace `plugin.reader` which contains methods related to the PDF reader and web reader.
-   Added `SelectionType.PDF` and `SelectionType.WebReader` to the `SelectionType` enum. Methods that return a `SelectionType` variable may now take these new values.
-   Added a `DocumentViewer` component to render a Rem using the full document editor.

## 0.0.31[​](#0031 "Direct link to heading")

-   Added `parseAndInsertHtml` method to the `plugin.richText` namespace.
-   Added `plugin.rem.createTable` method for creating table Rem.
-   Added `rem.isTable` method to check if a Rem is a table.
-   Added `rem.setTableFilter` method to set the filter of a table.
-   Added `Query` class to help build table filters. For example:

```codeBlockLines_HKiK
// Filter a table to show only Rem where the `column-id` column contains the text "hello" or "world".const tableRem = ...const query = Query.tableColumn('column-id', Query.or([  Query.text(TextMatcher.Contains, 'hello'),  Query.text(TextMatcher.Contains, 'world'),]));await tableRem.setTableFilter(query);
```

-   Added property options to the `plugin.app.registerPowerup` method. This allows plugins to integrate nicely with tables. For example:

```codeBlockLines_HKiK
await plugin.app.registerPowerup(  'Incremental',  powerupCode,  'Incremental Everything Powerup',  {    slots: [      {        code: prioritySlotCode,        name: 'Priority',        propertyType: PropertyType.NUMBER,        propertyLocation: PropertyLocation.RIGHT,      },      {        code: nextRepDateSlotCode,        name: 'Next Rep Date',        propertyType: PropertyType.DATE,        propertyLocation: PropertyLocation.RIGHT,      },    ],  },);
```

-   Added `plugin.app.unregisterMenuItem` method to unregister menu items.
-   Added `plugin.queue.inLookbackMode` method to check if the user has gone back in the flashcard queue.
-   Added `PluginCommandMenuLocation.DocumentMenu` location to the `plugin.app.registerMenuItem` method.

## 0.0.30[​](#0030 "Direct link to heading")

### Added[​](#added "Direct link to heading")

-   Added `SpecialPluginCallback.GetNextCard` callback which allows you to inject cards into the flashcard queue.
-   Added `rem.allRemInFolderQueue` method which returns all the Rem which are searched for cards in when practicing a specific Rem's cards in the flashcard queue.
-   Added `WidgetLocation.FlashcardAnswerButtons` widget location which allows you to override the flashcard answer buttons.
-   Added `PluginCommandMenuLocation.ReaderMenu` and `PluginCommandMenuLocation.PDFHighlightPopupLocation` locations to the `plugin.app.registerMenuItem` method.

## 0.0.29[​](#0029 "Direct link to heading")

### Added[​](#added-1 "Direct link to heading")

-   Added `rem.getTagPropertyValue(propertyId: RemId)` and `rem.setTagPropertyValue(propertyId: RemId, value: any)` methods to get and set the value of a cell in a table.
-   Added `rem.getPropertyType()` method to get the data type of a tag's property.
-   Added the ability to register menu item buttons in the table property menu using the `plugin.app.registerMenuItem` method.

## 0.0.28[​](#0028 "Direct link to heading")

### Added[​](#added-2 "Direct link to heading")

-   Added `getPlatform` and `getOperatingSystem` methods to the `plugin.app` namespace.

## 0.0.27[​](#0027 "Direct link to heading")

### Added[​](#added-3 "Direct link to heading")

-   Added the `scheduled` field to the `RepetitionStatus` interface.

## 0.0.26[​](#0026 "Direct link to heading")

### Added[​](#added-4 "Direct link to heading")

-   Added the `createdAt` field to the `Rem` object.

## 0.0.25[​](#0025 "Direct link to heading")

### Added[​](#added-5 "Direct link to heading")

-   Added `window.isPageOpen` method to check whether a user is on a particular page. Eg. `window.isPageOpen(PageType.Queue)`.
-   Added a new `plugin.queue` namespace containing methods related to the flashcard queue.
-   Added `plugin.queue.getNumRemainingCards` method to check how many cards are left in the current queue.
-   Added `plugin.queue.getCurrentStreak` method to get the user's current streak.

## 0.0.24[​](#0024 "Direct link to heading")

### Added[​](#added-6 "Direct link to heading")

-   Added widget mount locations for the Flashcard Home Deck Page and the Learning Progress Page.

## 0.0.23[​](#0023 "Direct link to heading")

### Added[​](#added-7 "Direct link to heading")

-   Added `data-plugin-id` selectors to style specific plugins.
-   Plugins must update to >= SDK v0.0.23 for the selector to appear.

Example:

```codeBlockLines_HKiK
div[data-plugin-id='demo-tabs'] {  color: blue;}
```

## 0.0.22[​](#0022 "Direct link to heading")

### Updated[​](#updated "Direct link to heading")

-   Custom CSS block styles will be applied to plugins.
-   Theme plugin styles will be applied to other plugins.
-   Plugins must update to >= SDK v0.0.22 to be styled by Custom CSS and themes.

## 0.0.21[​](#0021 "Direct link to heading")

### Added[​](#added-8 "Direct link to heading")

-   Added `cardId: string | undefined` parameter to the `SRSScheduleCard` callback. Note that `cardId` is `undefined` when the method is called to calculate interval dates for the interval spacing visualization on the Custom Scheduler settings page. But when calculating scheduling dates for cards, the `cardId` should always be defined.

## 0.0.20[​](#0020 "Direct link to heading")

Note that this release contains a **breaking change**.

### Removed[​](#removed "Direct link to heading")

-   (BREAKING): removed the `plugin.rem.createWithMarkdown` method. It has been replaced by two new methods: `plugin.rem.createSingleRemWithMarkdown` and `plugin.rem.createTreeWithMarkdown`.

### Added[​](#added-9 "Direct link to heading")

-   Added `plugin.rem.createTreeWithMarkdown(markdown)` method. This method creates a tree of Rem from your parsed markdown. Newlines will be turned into separate sibling/child Rem.
-   Added `plugin.rem.createSingleRemWithMarkdown(markdown)` method. This method creates a single Rem from your parsed markdown. Newlines will NOT be turned into separate sibling/child Rem.

## 0.0.19[​](#0019 "Direct link to heading")

### Added[​](#added-10 "Direct link to heading")

-   Added a new namespace for accessing knowledge base information. To access a user's knowledge base information, your plugin needs to add the KnowledgeBaseInfo permission scope in the manifest.json file. See the [permission scope docs](/advanced/permissions#permission-scopes) for more detail.
-   Added `plugin.kb.getCurrentKnowledgebaseData` and `plugin.kb.isPrimaryKnowledgeBase` methods

### Other Changes[​](#other-changes "Direct link to heading")

-   We now support uploading unlisted plugins for personal use. See the [unlisted plugins docs](/advanced/unlisted_plugins) for a guide on how to upload and install unlisted plugins.

## 0.0.18[​](#0018 "Direct link to heading")

### Added[​](#added-11 "Direct link to heading")

-   Added a new method called `plugin.app.transaction` to run code inside a transaction. If the code throws an error, the transaction will be not be saved to disk. Be careful not to hold transactions open for extended periods of time, as this might block other parts of the app.

### Theming and CSS[​](#theming-and-css "Direct link to heading")

-   We now support uploading simpler CSS snippet plugins which only contain CSS. Simply copy and paste your CSS snippet into a snippet.css file, zip and upload. No need to mess around with GitHub or JS! See the [Custom CSS docs](/custom-css) for a guide on how to do this.

### Other Changes[​](#other-changes-1 "Direct link to heading")

-   Updated the `plugin.rem.createWithMarkdown` function so that if the markdown string contains newlines, a single Rem is created containing newlines, rather than a separate Rem for each newline.
-   Added `clickOutsideToClose?: boolean` parameter to the `plugin.widget.openPopup` method.
-   Added `addTitle?: boolean` parameter to the `plugin.rem.createLinkRem` method.

## 0.0.17[​](#0017 "Direct link to heading")

### Added[​](#added-12 "Direct link to heading")

-   Added a new method to create Rem representing web links called `plugin.rem.createLinkRem`.
    -   If you want to include the link in rich text, use the `plugin.richText.rem` method and pass the link Rem's `_id` as an argument

### Fixes and Improvements[​](#fixes-and-improvements "Direct link to heading")

-   Made some minor changes related to fix special callback handling. This should only affect custom SRS scheduler plugins.

## 0.0.16[​](#0016 "Direct link to heading")

### Fixes and Improvements[​](#fixes-and-improvements-1 "Direct link to heading")

-   Small fix to the `RepetitionStatus` interface, renaming the `customData` field to `pluginData`.

## 0.0.15[​](#0015 "Direct link to heading")

This version adds support for Plugin SRS Schedulers as well as some new features and bug fixes.

### Added[​](#added-13 "Direct link to heading")

#### Plugin SRS Schedulers[​](#plugin-srs-schedulers "Direct link to heading")

With this release RemNote now supports Plugin SRS Schedulers. It will be possible to install Plugin Schedulers through the plugin marketplace and customize them in the Custom Scheduler settings page.

-   Added a new `plugin.scheduler` namespace.
-   Added a `plugin.scheduler.registerCustomScheduler` method to register a plugin scheduler with custom scheduler parameters.
-   Upated the `plugin.app.registerCallback` command to optionally take a generic parameter. This is used to provide type inference for the special `SRSScheduleCard` callback.

#### Other Additions[​](#other-additions "Direct link to heading")

-   Added a new parameter `closeWhenClickOutside?: boolean` to the `plugin.window.openFloatingWidget` method. It is true by default.
-   Added support for custom placeholders to the `RichTextEditor` components through a new `placeholder` prop.
-   Added a new `QueueLoadCard` event which fires each time a card changes in the queu so you can keep track of what the current card in the queue is.
-   Added a new widget location filter field called `remId` to the `registerWidget` options parameter. Plugins can now register widgets in locations filtered by a particular Rem Id.

### Fixes and Improvements[​](#fixes-and-improvements-2 "Direct link to heading")

-   Fixed an issue with localhost plugins failing to activate.
-   Fixed editor text not immediately updating when calling the `rem.setBackText` method.
-   Fixed the `RichText` component throwing an error and refusing to load.
-   Fixed button click events not working in native plugins.
-   Fixed registered plugin commands not always getting added to the Omnibar and Slash Command Menu.

## 0.0.14 - 2022-09-22[​](#0014---2022-09-22 "Direct link to heading")

### Fixed[​](#fixed "Direct link to heading")

-   Fixed incompatibility of the `npx` scripts with lower node versions.

## 0.0.11..0.0.13 - 2022-09-22[​](#00110013---2022-09-22 "Direct link to heading")

Skipped.

## 0.0.10 - 2022-09-20[​](#0010---2022-09-20 "Direct link to heading")

This version we focused on tooling around plugin creation.

### Added[​](#added-14 "Direct link to heading")

-   `npx` scripts to initialise and validate a plugin before upload.
    -   `npx remnote-plugin init` command to generate the manifest.json file with an interactive prompt.
    -   `npx remnote-plugin validate` to validate the plugin before uploading.
-   Support plugin template npm scripts on Windows.
-   Json schema and linting for `manifest.json`.
-   `richText.indexOfElementAt` function to convert a string index to a rich text element array index.

### Fixes and Improvements[​](#fixes-and-improvements-3 "Direct link to heading")

-   Fix `getSelectedRem` and `getSelectedText` reactivity.
-   Removed stealKeys and releaseKeys methods from the editor namespace. They have already been moved into the app namespace.

### Theming and CSS[​](#theming-and-css-1 "Direct link to heading")

-   Added `data-rem-property` and `data-rem-container-property` data attribute to target slot instances like `[[Aliases]]`.

## 0.0.9 - 2022-08-31[​](#009---2022-08-31 "Direct link to heading")

### Fixed[​](#fixed-1 "Direct link to heading")

-   Fix `window.stealKeys`, `window.releaseKeys` and `app.unregisterWidget` calling wrong endpoints.

## 0.0.8 - 2022-08-31[​](#008---2022-08-31 "Direct link to heading")

### Changed[​](#changed "Direct link to heading")

-   Manifest: `repoUrl` is required for now.
-   Manifest: `enabledOnMobile` (boolean) must be set if the plugin should run on mobile. Make sure the plugin does require any features not supported on mobile yet, like the right sidebar.
-   -   ✨ Completely refactored the [`editor`](/api/classes/EditorNamespace) namespace.
    -   This makes it more suitable for programmatically modifying content. We plan to reintroduce methods to simulate user actions.
-   [`Rem` class](/api/classes/Rem)
    -   Renamed `Rem.tagAncestorRem` to `Rem.ancestorTagRem` and `Rem.tagDescendantRem` to `Rem.descendantTagRem`.
    -   Renamed `Rem.u` to `Rem.updatedAt` and `Rem.o` to `Rem.localUpdatedAt`.
    -   Renamed `(set)isCollapsedPortal` to `(set)isCollapsed`.
-   `RichTextBuilder` normalizes rich text now. This turns `value()` into an `async` method.
-   Changed `getFocusedPortalId(): RemId` to `getFocusedPortal(): Rem`.
-   Removed `getDescendantIds(): RemId[]` in favor of `getDescendants() : Rem[]`.
-   Moved `stealKeys`/`releaseKeys` into the `app` namespace.
-   Moved `getWidgetContext` into the `widget` namespace.
-   Flattened context data for `WidgetLocation.Popup` (`context.openContext.focusedRemId` -> `context.focusedRemId`)

### Added[​](#added-15 "Direct link to heading")

-   ✨ Added 18 new methods to the [`richText`](/api/classes/RichTextNamespace#methods) namespace
    -   General: `empty`, `indexOf`, `length`
    -   Modification: `replaceAllRichText`, `split`, `splitRichText`, `trim`, `trimStart`, `trimEnd`
    -   Formatting: `removeTextFormatFromRange`, `applyTextFormatFromRange`, `applyTextFormatFromRange`
    -   Conversion: `toHTML`
    -   Linking: `getRemIdsFromRichText`, `deepGetRemIdsFromRichText`, `getRemAndAliasIdsFromRichText`, `deepGetRemAndAliasIdsFromRichText`, `findAllExternalURLs`
-   ✨ Added experimental [`rem.getAll()`](/api/classes/RemNamespace#getall) and [`card.getAll()`](/api/classes/CardNamespace#getall) methods to get all rem or cards respectively. Use with care on large KBs😄.
-   ✨ Added experimental shotcut capturing system to implement custom keyboard controls, like a VIM mode.
-   Support reactivity in the index widget. Wrap your API calls in `plugin.track()` and they rerun automatically when something has changed.
-   Make `focus.focusedRem()` and `focus.getFocusedPortal()` reactive and add `AppEvents.FocusedRemChange` and `AppEvents.FocusedPortalChange` events for manual tracking.
-   Add `AppEvent.PowerupSlotChanged` event to watch for powerup changes, like todo status or highlight color.
-   Added `date.getDailyDoc(date: Date)`.
-   Added `Rem.removeTag(tagId: RemId, removeProperties = false)`. If `removeProperties` is specified all slots of the tag will be removed as well.
-   Added `Rem.removePowerup(powerupCode)`. It will always remove all powerup slots.
-   Added `onlyProgrammaticModifying: boolean` and `hidden: boolean` [powerup slot options](/advanced/powerups#registering-custom-powerups). Set these to ensure data consistency.
-   Added `widget.closeAllFloatingWidgets()`.

### Fixes and Improvements[​](#fixes-and-improvements-4 "Direct link to heading")

-   Many methods accept `Rem` as parameter in addition to `RemId`. `Rem` wrapper objects are the preferred way to work with rem and we want to abstract away `RemId`s as best as possible.
-   Fix `AppEvents.QueueCompleteCard` event being triggered too often.
-   Fix `RichTextBuilder` duplicating references.
-   Make `searchContextRemId` optional in [`search.search()`](/advanced/search#global-rem-text-search). If you omit the context rem searches globally.
-   Typings: Add return type for all methods that were still returning `Promise<any>`.
-   Typings: Type `Rem.setHighlightColor` with the available highlight colors.
-   Typings: Add `RepetitionStatus` type.

### Theming and CSS[​](#theming-and-css-2 "Direct link to heading")

-   Added `data-cloze-id` data attribute to Fill-In-The-Blank elements.
-   Added `rn-plugin-root` class to the plugin `iframe` (sandboxed) or `div` (native) node.

### Other[​](#other "Direct link to heading")

-   Add _Repository_ and _Report bugs_ links to the marketplace details page.
-   Manifests are now validated on build.

## 0.0.7 - 2022-08-01[​](#007---2022-08-01 "Direct link to heading")

### Changed[​](#changed-1 "Direct link to heading")

-   Change `getFocusedRemId(): RemId` to `getFocusedRem(): Rem`.

### Added[​](#added-16 "Direct link to heading")

-   Added `Rem.addPowerup(powerupCode: BuildInPowerupCodes)`.
-   Added `widget.getDimensions(widgetInstanceId: number)`. You can get the `widgetInstanceId` from the `getWidgetContext()`.
-   Added `remId` to the widget context of [`WidgetLocation.UnderRemEditor`](/api/interfaces/WidgetLocationContextDataMap#underremeditor).

### Fixes and Improvements[​](#fixes-and-improvements-5 "Direct link to heading")

-   Some `Rem` methods had the wrong permission levels.

### Other[​](#other-1 "Direct link to heading")

-   Added documentation for the [`search`](/advanced/search) namespace.
-   Added documentation for the [`richText`](/advanced/rich_text) namespace.
-   Added documentation for [Floating Widgets](/advanced/widgets#floating-widgets) and [Popup Widgets](/advanced/widgets#popup-widgets) and [Pane Widgets](/advanced/widgets#pane-widgets).

## 0.0.6 - 2022-07-14[​](#006---2022-07-14 "Direct link to heading")

### Changed[​](#changed-2 "Direct link to heading")

-   Make `settings.getSetting` generic, e.g. `plugin.settings.getSetting<string>('my-string-setting');`

## 0.0.5 - 2022-07-14[​](#005---2022-07-14 "Direct link to heading")

## 0.0.4 - 2022-07-14[​](#004---2022-07-14 "Direct link to heading")

### Changed[​](#changed-3 "Direct link to heading")

-   Move `addListener` and `removeListener` into new `event` namespace.
-   Move `register*` and `toast` into new `app` namespace.
-   Move `unregisterWidget` and `getWidgetContext` to the `widget` namespace.

## 0.0.3 - 2022-07-14[​](#003---2022-07-14 "Direct link to heading")

### Changed[​](#changed-4 "Direct link to heading")

-   Refactored `useReactiveAPI` to `useTracker` replacing individual hooks.

## 0.0.2 - 2022-07-11[​](#002---2022-07-11 "Direct link to heading")

### Added[​](#added-17 "Direct link to heading")

-   `useReactiveAPI` hook.

## 0.0.1 - 2022-07-09[​](#001---2022-07-09 "Direct link to heading")

Initial release 🎉.
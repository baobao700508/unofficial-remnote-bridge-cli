<!-- source: https://plugins.remnote.com/advanced/project_structure -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   Advanced
-   Project Structure

On this page

# Project Structure

The [plugin template](https://github.com/remnoteio/remnote-plugin-template-react) is a public Git repository which comes preconfigured with the correct directory structure, default files and preconfigured settings so you can skip the boilerplate and focus on implementing your ideas!

## Directory Structure[​](#directory-structure "Direct link to heading")

Let's examine the directory structure of a typical plugin and understand the purpose of each file.

```codeBlockLines_HKiK
📦 remnote-plugin-template-react ┣ 📂 public             - Store any static asset files like images here ┃ ┣ 📜 logo.svg         - Example image asset ┃ ┗ 📜 manifest.json    - Contains plugin metadata, like the plugin id and author name ┣ 📂 src                - Contains all the source code for your plugin ┃ ┣ 📂 widgets          - Contains embeddable widget components and the index widget ┃ ┃ ┃ 📜 index.tsx      - Contains the entrypoint for the plugin ┃ ┃ ┗ 📜 widget1.tsx    - Embeddable widget file which loads a React component ┃ ┗ 📜 App.css          - Example CSS style sheet for App.tsx ┣ 📜 tsconfig.json      - Specifies compiler options required to compile the project ┣ 📜 webpack.config.js  - Config file for webpack which bundles JS files for the browser ┣ 📜 README.md          - Markdown description of your project displayed on GitHub ┣ 📜 package.json       - Specifies project metadata and dependencies ┣ 📜 package-lock.json  - Keeps track of dependency version information ┣ 📜 schema.json        - File generated on install to provide type hints when editing manifest.json ┗ 📜 postcss.config.js  - Config for transforming CSS styles with JS plugins
```

### project root[​](#project-root "Direct link to heading")

```codeBlockLines_HKiK
 ┣ 📜 tsconfig.json ┣ 📜 webpack.config.js ┣ 📜 README.md ┣ 📜 package.json ┣ 📜 package-lock.json ┗ 📜 postcss.config.js
```

The project root contains a number of preconfigured settings files. In most cases you can ignore these files.

### public[​](#public "Direct link to heading")

```codeBlockLines_HKiK
 ┣ 📂 public ┃ ┣ 📜 logo.svg ┃ ┗ 📜 manifest.json
```

The `public` folder contains static asset files such as image files which you want to include in your plugin. Refer to the guidelines for including assets in your plugin [here](/advanced/assets) to ensure that they get loaded correctly across different devices.

It also contains the manifest.json plugin configuration file. The `manifest.json` file contains plugin information, including the plugin id, version information and the name of the author. You need to modify some of these fields when creating a new plugin. See the [plugin manifest documentation](/advanced/manifest) page for details on all of the fields inside the manifest file and which are required/optional.

### src folder[​](#src-folder "Direct link to heading")

```codeBlockLines_HKiK
 ┣ 📂 src ┃ ┣ 📂 widgets ┃ ┣ ┃ 📜 index.tsx ┃ ┃ ┗ 📜 widget1.tsx ┃ ┗ 📜 App.css
```

The `src` folder contains all of the source code for your plugin. It also contains the App.css stylesheet.

### widgets folder[​](#widgets-folder "Direct link to heading")

```codeBlockLines_HKiK
 ┣ 📂 widgets ┣ ┃ 📜 index.tsx ┃ ┗ 📜 widget1.tsx
```

Plugins consist of a main "index widget" and multiple normal widgets. The index widget is located in `index.ts` and is responsible for registering all of the widgets, commands and other [contributions](/advanced/contributions) your plugin provides. The `widget1.tsx` file is an example of a normal widget which will get registered with the plugin system in `index.ts`. Normal widgets are React components which can be embedded into RemNote at predefined locations. You can learn more about widgets on the [widget documentation](/advanced/widgets) page.

### index.ts file[​](#indexts-file "Direct link to heading")

The code in this file can be considered the entrypoint for your plugin. Here you will register the widgets, commands, settings and any other functionality your plugin provides. Plugins can register commands, widgets, buttons, custom CSS and many other kinds of [contributions](/advanced/contributions). Please see the [widgets documentation](/advanced/widgets) for specific details.
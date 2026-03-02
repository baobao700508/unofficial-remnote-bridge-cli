<!-- source: https://plugins.remnote.com/getting-started/quick_start_guide -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   Getting Started
-   Quick Start Guide

On this page

# Quick Start Guide

## Setup your development environment[​](#setup-your-development-environment "Direct link to heading")

You'll need the following software to start developing:

### 1\. [Node.js](https://nodejs.org/en/download/)[​](#1-nodejs "Direct link to heading")

We will use Node.js to build the plugin.

### 2\. [A GitHub Account](https://github.com/)[​](#2-a-github-account "Direct link to heading")

We will use GitHub to create a repository for our plugin project based on the [template plugin](https://github.com/remnoteio/remnote-plugin-template-react).

### 3\. [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)[​](#3-git "Direct link to heading")

You will also need to install Git. Check the [official guide](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) with instructions for each operating system.

### 4\. An IDE or text editor[​](#4-an-ide-or-text-editor "Direct link to heading")

We recommend using [Visual Studio Code](https://code.visualstudio.com/), but any other IDE or text editor will work.

## Setup the plugin template[​](#setup-the-plugin-template "Direct link to heading")

The [plugin template](https://github.com/remnoteio/remnote-plugin-template-react) is a public Git repository which comes preconfigured with the correct plugin directory structure and default settings so you can skip the boilerplate and focus on implementing your ideas!

### Clone the template[​](#clone-the-template "Direct link to heading")

![Clone Template](/img/tutorials/clone_template.png)

-   Navigate to the main page of the [plugin template repository](https://github.com/remnoteio/remnote-plugin-template-react) on GitHub.
-   Click on the Clone or download button.
-   Press "HTTPS".
-   Copy the link.
-   Open a terminal in the directory where you want to clone the repository.
-   Run `git clone <link>` to download the template repository.

## Test-run the template[​](#test-run-the-template "Direct link to heading")

Open your terminal of choice and navigate into the folder of the repository you just cloned.

Then run:

```codeBlockLines_HKiK
npm install
```

This will install a very minimal React App, along with the RemNote plugin SDK (software development kit).

### Generate the manifest[​](#generate-the-manifest "Direct link to heading")

Inside the plugin folder, run:

```codeBlockLines_HKiK
npx remnote-plugin init
```

This will prompt you for some information which will get automatically saved to the `manifest.json` metadata file.

### Start your plugin[​](#start-your-plugin "Direct link to heading")

Inside the plugin folder, run:

```codeBlockLines_HKiK
npm run dev
```

This should compile and run the template plugin project.

### Run the plugin template inside RemNote[​](#run-the-plugin-template-inside-remnote "Direct link to heading")

The plugin template contains some sample code to test that your development environment is configured correctly. To test the plugin, open RemNote and open the settings modal. At the bottom of the settings sidebar on the left click on the link called "Plugins" and then the "Build" tab.

Then click on the "Develop from localhost" button. Enter "http://localhost:8080".

![Add Plugin Input](/img/tutorials/add_plugin_input.png)

If you get a notification that the plugin has been installed successfully, your development environment has been configured correctly! If you click on the "sample\_widget" tab in the right sidebar, you should see an extremely simple example widget:

![Template Right Sidebar](/img/tutorials/template_right_sidebar.png)

If you change the "Name", "Favorite Number" and "Likes Pizza" options in the RemNote settings modal, then the widget should automatically update with the new information.

## Add a new Widget[​](#add-a-new-widget "Direct link to heading")

Let's add a new widget to the plugin.

```codeBlockLines_HKiK
 📦 <your repo name>    - The root of the project ┣ 📂 src ┃ ┣ 📂 widgets         - Contains all of your plugin's widgets ┃ ┣ ┃ 📜 index.tsx     - Contains the entrypoint for the plugin
```

1.  Add a new file called `right_sidebar.tsx` in `src/widgets` and add this template:

```codeBlockLines_HKiK
import { renderWidget } from '@remnote/plugin-sdk';function MyWidget() {  return <div>My Widget</div>;}renderWidget(MyWidget);
```

2.  Register your widget in the `index.tsx` file:

```codeBlockLines_HKiK
async function onActivate(plugin: ReactRNPlugin) {  await plugin.app.registerWidget(    'right_sidebar',    WidgetLocation.RightSidebar,    {      dimensions: {        height: 'auto',        width: 350,      },    },  );}
```

3.  Restart your plugin, refresh the page and you should see your new widget registered as a tab in the right sidebar:

![Template Right Sidebar](/img/tutorials/new_widget.png)

## Plugins Escape Hatch[​](#plugins-escape-hatch "Direct link to heading")

Visit [http://www.remnote.com/notes?disablePlugins](http://www.remnote.com/notes?disablePlugins) to temporarily disable all plugins. This can be used as an escape hatch if you've added a plugin that is preventing you from loading RemNote.

## Next steps[​](#next-steps "Direct link to heading")

### Beginners[​](#beginners "Direct link to heading")

If you are new to programming, we recommend going through the [In-Depth Tutorial](/in-depth-tutorial/overview). It will equip you with the basic tools you need to start building your own plugins.

### Pros[​](#pros "Direct link to heading")

If you are already a React pro, you may still want to go through at least some of the [In-Depth Tutorial](/in-depth-tutorial/overview) to understand the basic API functions. Alternatively you can use the rest of the documentation guides as well as the [commented source code of the example plugins built by the RemNote team](https://github.com/remnoteio/remnote-official-plugins) to work out how to implement your plugin ideas.
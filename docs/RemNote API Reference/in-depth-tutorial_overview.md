<!-- source: https://plugins.remnote.com/in-depth-tutorial/overview -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   In-Depth Tutorial
-   Overview

On this page

# Overview

Let's build a dictionary plugin! We'll cover these topics:

-   How to create a widget in the selected text menu.
-   How to use some of the custom React Hooks provided by the RemNote plugin SDK.
-   Some helpful React best practices to help you build plugins.
-   How to programatically create flashcards.

Once you have completed this tutorial, you will be able to build anything you want with the help of the API Reference on the sidebar.

## What we're building[​](#what-were-building "Direct link to heading")

![Final Plugin UI](/img/tutorials/final_plugin_ui.png)

In this tutorial we will build a [simple dictionary plugin](https://github.com/remnoteio/remnote-official-plugins/tree/main/dictionary-tutorial) from scratch. The plugin will:

-   Lookup the definitions of selected words using a [free English dictionary API](https://dictionaryapi.dev/).
-   Display matching dictionary definitions in the selected text popup menu.
-   Add definitions to the user's knowledgebase.
-   Create flashcards from the definitions.

![Plugin Marketplace](/img/tutorials/dict_plugin_in_marketplace.png)

The full source code for the final version of the plugin is available [on GitHub](https://github.com/remnoteio/remnote-official-plugins/tree/main/dictionary-tutorial).

After completing this tutorial, you will know how to create plugins for RemNote, and you will have an understanding of the essential tools available to you when writing one.

## Requirements[​](#requirements "Direct link to heading")

The tutorial doesn’t assume any existing knowledge about the RemNote API, but we are assuming that you have already **setup your development environment** as explained out in the [development setup guide](/getting-started/overview). If you have not already gone through the guide, please do that now before continuing with the tutorial. You should also have a small number of [prerequisite skills](/getting-started/overview#requirements).

You don’t have to complete all of the sections at once to get value out of this tutorial. Try to get as far as you can — even if it’s one or two sections.

## Help and feedback[​](#help-and-feedback "Direct link to heading")

There may be times when you aren't sure how to achieve a particular behaviour, in these situations it can be helpful to look through the code of existing plugins on GitHub. The full source code for this tutorial is available [here](https://github.com/remnoteio/remnote-official-plugins/tree/main/dictionary-tutorial).

If you get stuck or run into bugs, try asking for help in the extension-developers channel in the [RemNote Discord server](http://bit.ly/RemNoteDiscord). We have a friendly community of developers who are more than willing to help newcomers get up to speed with the plugin system.
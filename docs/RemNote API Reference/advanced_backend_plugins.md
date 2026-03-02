<!-- source: https://plugins.remnote.com/advanced/backend_plugins -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   Advanced
-   Backend Plugins

# Backend Plugins

We currently don't host a backend API. If you were hoping to create a plugin which makes use of the backend API, we suggest that instead you try to build it via the frontend API.

For example, instead of writing a program which sends data to RemNote from a third party service, use a frontend plugin to request data from the third party service each time RemNote loads and import the data.

For a real life example of this, see the [Readwise plugin](https://github.com/bjsi/remnote-readwise) which used to use the backend API, but has been rebuilt as a frontend plugin.
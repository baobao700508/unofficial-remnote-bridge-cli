<!-- source: https://plugins.remnote.com/advanced/manifest -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   Advanced
-   Manifest

On this page

# Manifest

The plugin manifest describes your plugin and its permission levels.

## Example[​](#example "Direct link to heading")

```codeBlockLines_HKiK
{  "id": "demo_right_sidebar_plugin",  "name": "Demo Right Sidebar Plugin",  "author": "martin",  "repoUrl": "",  "enableOnMobile": false,  "projectUrl": "",  "supportUrl": "",  "changelogUrl": "",  "version": {    "major": 0,    "minor": 1,    "patch": 0  },  "description": "Adds a right sidebar for editing Rem.",  "requestNative": false,  "requiredScopes": [    {      "type": "Plugin",      "powerupCode": "book",      "level": "ReadCreateModifyDelete"    }  ],  "manifestVersion": 1}
```

## Fields Explained[​](#fields-explained "Direct link to heading")

Field

Description

Required

id

A globally unique ID for your plugin. Only one plugin of each ID can be installed or registered in our marketplace. Please choose a simple, readable ID. Ids may consist only of lowercase Latin letters a-z, A-Z, hyphens, underscores, and digits 0-9.

Yes

name

A human-readable name for your plugin to be displayed to the user.

Yes

repoUrl

Link to your GitHub repository so we can review your code.

Yes if your plugin uses JS

enableOnMobile

Whether or not to allow this plugin to be loaded on mobile.

Yes

projectUrl

Optional link to your website / GitHub repository.

No

supportUrl

Optional link to a support website / GitHub issues

No

changelogUrl

Optional link to the changelog

No

version

An object describing the version.

Yes

description

A short description of <200 chars to be displayed in our Marketplace.

No

requestNative

Please see [Plugin Permissions](/advanced/permissions) for information.

Yes

requiredScopes

Please see [Plugin Permissions](/advanced/permissions) for information.

Yes

manifestVersion

The version of the **manifest** itself. Leave this at `1`.

Yes

unlisted

If `true`, the plugin will not be listed in the plugin marketplace. See the docs on [unlisted plugins](/advanced/unlisted_plugins)

No
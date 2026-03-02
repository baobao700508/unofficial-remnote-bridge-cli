<!-- source: https://plugins.remnote.com/advanced/permissions -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   Advanced
-   Permissions

On this page

# Permissions

RemNote plugins are designed with security first. They can run in completely sandboxed environments and precisely define the minimal amount of permissions that they need.

## Sandboxing[​](#sandboxing "Direct link to heading")

Plugins can either run in a sandboxed IFrame or in "Native Mode" running in the main browser JavaScript process.

Sandboxed plugins are significantly safer for users to use. They can only interact with private user data through our API, which is restricted by your plugin Permission Levels and Permission Scopes. Unlike with Native Plugins, Sandboxed Plugins have no concerns with attacks that could try to steal a user's authenticatino information in the browser.

We've designed our plugin architecture so that most plugins should work identically in Sandboxed and Native modes. Thus, we strongly encourage you to design and your plugins in Sandboxed Mode. We want users to feel 100% safe trying out new plugins and will likely only be allowing highly-vetted Native plugins into our Marketplace. Sandboxed plugins will also receive a significant boost in rankings in our Marketplace (see our latest [marketplace guidelines](/advanced/submitting_plugins)).

If your plugin would like to request access to running in Native Mode, you can set `requestNative` to true in your manifest config. This should only be an optimization and not a requirement of your plugin.

## Permission Scopes[​](#permission-scopes "Direct link to heading")

Plugins must define a set of "Permission Scopes" that determines which Rem can be viewed or modified by the plugin. Scopes can either be hard-coded into the plugin manifest, or dynamically requested while the plugin is running. Plugins can ask for multiple scopes.

Scope `type`s:

1.  **All**: The plugin has access to all Rem in the user's Knowledge Base.

```codeBlockLines_HKiK
{  "requiredScopes": [    {      "type": "All",      "level": "Read",    }  ]}
```

2.  **DescendantsOfName**: The plugin has access to all Rem that are a descendant of a Rem that has a `name` field with a single plain piece of text.

```codeBlockLines_HKiK
{  "requiredScopes": [    {      "type": "DescendantsOfName",      "remName": "Books",      "level": "Read",    }  ]}
```

3.  **Powerup**: The plugin has access to (1) the powerup with code `powerup` (2) all of the powerup's descendants and (3) any Rem tagged with the powerup.

```codeBlockLines_HKiK
{  "requiredScopes": [    {      "type": "Powerup",      "powerupCode": "book",      "level": "Read",    }  ]}
```

4.  **DescendantsOfId**: The plugin has access to all Rem that are a descendant of a Rem that has a specific `id`. You will not want to include this in your plugin manifest, and will instead want to dynamically request this permission at runtime. (See \[\[Dynamically requesting plugin permissions\]\])

```codeBlockLines_HKiK
{  "requiredScopes": [    {      "type": "DescendantsOfId",      "remId": "KJfRK4xeff85RDiR2",      "level": "Read",    }  ]}
```

5.  **KnowledgeBaseInfo**: The plugin has access to users' knowledge base information.

```codeBlockLines_HKiK
{  "requiredScopes": [    {      "type": "KnowledgeBaseInfo",      "level": "Read",    }  ]}
```

See the [plugin manifest documentation](/advanced/manifest) for config information. Please select the minimal permission level that your application needs.

## Permission Levels[​](#permission-levels "Direct link to heading")

Plugins must define a `level` for each permission scope that determines how they can manipulate Rem:

1.  **Read**: The plugin can only read Rem.
2.  **ReadCreate**: The plugin can only read or create Rem.
3.  **ReadCreateModify**: The plugin can only read, create or modify Rem.
4.  **ReadCreateModifyDelete**: The plugin can perform all actions on Rem.

## API Behavior with Limited Permission Scopes[​](#api-behavior-with-limited-permission-scopes "Direct link to heading")

### Creating Rem[​](#creating-rem "Direct link to heading")

Calls to `plugin.rem.createRem()` will automatically add the Rem in the broadest scope that your plugin has access to:

1.  **All**: A top-level Rem will be created (the Rem has no parent).
2.  **DescendantsOfName**: The Rem will be created as a child of a top-level Rem with your specified name.
3.  **Powerup**: The Rem will be created as a child of the Powerup Rem.
4.  **DescendantsOfId**: The Rem will be created as a child of the Rem with the specified ID.

### Reading Rem[​](#reading-rem "Direct link to heading")

API calls that attempt to access a Rem outside of the plugin's scope will silently return `undefined`. This is designed with security in mind: a non-existent Rem and a private Rem return the same API response.

When "Developer Mode" is on, warnings will be displayed that your plugin attempted to access a non-existing Rem.
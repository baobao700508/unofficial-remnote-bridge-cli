<!-- source: https://plugins.remnote.com/advanced/messaging -->
<!-- crawled: 20260302_170143 -->

-   [](/)
-   Advanced
-   Messaging

On this page

# Messaging

## Broadcasting Messages[​](#broadcasting-messages "Direct link to heading")

From any Rem, simply call `plugin.messaging.broadcast({anyDataGoesHere: "awesome!"})`. This message will be sent to all of your other widgets, who can then receive the message with a listener call:

```codeBlockLines_HKiK
useOnMessageBroadcast((message) => {  console.log(message.anyDataGoesHere)})
```

Broadcasting messages can be especially useful if you want to communicate between the callback in keyboard shortcuts/commands registered in the `onActivate` function in the index widget file and a UI widget component. Eg:

In `index.ts`:

```codeBlockLines_HKiK
async function onActivate(plugin: ReactRNPlugin) {  await plugin.app.registerCommand({    id: 'send-message',    name: 'Send Message',    action: async () => {      await plugin.messaging.broadcast({ anyDataGoesHere: 'awesome!' });    },  });}
```

In some widget file:

```codeBlockLines_HKiK
function Widget() {  useOnMessageBroadcast((message) => {    console.log(message.anyDataGoesHere);  });}
```
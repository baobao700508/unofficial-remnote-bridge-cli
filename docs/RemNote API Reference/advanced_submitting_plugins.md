<!-- source: https://plugins.remnote.com/advanced/submitting_plugins -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   Advanced
-   Submitting Plugins

On this page

# Submitting Plugins

## Approval guidelines[​](#approval-guidelines "Direct link to heading")

### Plugin Review[​](#plugin-review "Direct link to heading")

Plugins which include any JavaScript code will be reviewed by a member of the team to make sure that they are safe for users to install. That means you need to include a link to your public github repo in the manifest.json file so we can review your code. We will contact you either through GitHub or through the RemNote Discord channel to communicate any changes which should be made before the plugin is approved.

### Pro Features[​](#pro-features "Direct link to heading")

Our vision is to have one of the most powerful plugin platforms on the market. We want you to be able to build ANY feature in a way which tightly integrates with the rest of the app, as though it was natively built by us. We strongly believe that this will be possible with our architecture and that this could unlock the community to build _their own versions of RemNote_ and expand in a multitude of directions which would not be practically possible for our small team.

But since features are our only way to earn subscription money from users and sustain RemNote as a business, we request that you do not build plugins with similar offerings to our paid features, otherwise your plugin will not be admitted to the marketplace. We hope this is not an unreasonable request or a constraint on your creativity. We can't wait to see what you will build 🚀!

### Data Privacy[​](#data-privacy "Direct link to heading")

As part of our commitment to transparency and user privacy, any plugin submission which sends user data to a third party service or API should state this clearly in the README.md file. See [here](https://github.com/bjsi/prompt-explorer/blob/main/README.md#data-privacy) for an example.

## Uploading plugins[​](#uploading-plugins "Direct link to heading")

Plugins can be uploaded to the plugin marketplace directly from within RemNote. First you should run `npm run build` to build the plugin. This will create a zip file in the root directory of your plugin project. Navigate to the build tab and press the "Upload plugin" button to upload your Plugin ZIP directly. Please make sure that your GitHub repository is public before uploading!

![Upload](https://i.imgur.com/RbhdknP.png)
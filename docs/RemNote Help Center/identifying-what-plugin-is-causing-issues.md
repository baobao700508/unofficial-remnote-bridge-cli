<!-- source: https://help.remnote.com/en/articles/7225443-identifying-what-plugin-is-causing-issues -->
<!-- crawled: 20260306_142324 -->

# Identifying What Plugin is Causing Issues

Occasionally, RemNote plugins might have bugs that cause issues using RemNote that can't easily be traced to that plugin. If you're encountering such a bug, it's helpful to quickly identify which plugin is causing the problem so you can report the bug to the author of that plugin, and then disable the plugin so you can keep working while you're waiting for a fix.

## Getting into RemNote with a broken plugin  
(usually not necessary)

Occasionally a plugin might be so badly broken that you **can't get into RemNote at all** to access the plugin settings. In this case, you can log in on the web version without loading any plugins by appending `?disablePlugins` to the end of the URL. For instance, [https://remnote.com/notes/?disablePlugins](https://remnote.com/notes/?disablePlugins).

A message "Plugins disabled" will appear in the upper-right corner after RemNote loads, and you'll be able to follow the troubleshooting steps below.

## Step 1: Disable all plugins

1.  In RemNote's Settings menu, select _Plugins_ from the sidebar.
    
2.  Click on the _Manage_ tab at the top to view the list of currently installed plugins.
    
3.  Click on the toggle switch next to each plugin, turning it from blue (active) to gray (inactive).
    
4.  Refresh the page (if on the web app) or restart the app (if on the desktop app) and confirm that the problem no longer occurs. If you're still having an issue at this point, the problem is not with a plugin; consider reaching out to RemNote support for further assistance if needed.
    

## Step 2: Re-enable plugins one by one

1.  Back in _Settings > Plugins > Manage_, enable the first plugin on the list by clicking on its toggle switch.
    
2.  Check if the issue reoccurs. If the problem has started occurring again, it's likely that the plugin you just enabled is the cause.
    
3.  If not, repeat this process with the rest of the plugins in the list, enabling one plugin at a time and checking for the issue after each one.
    

## Step 3: Disable the offending plugin and report the issue

Once you've identified the plugin causing the issue, disable it again and enable your other plugins.

If you have a few moments, the plugin author would appreciate a bug report so they can fix the issue! To submit one, click on the **...** to the right of the plugin in the _Manage_ tab and choose _Report Bugs_. If you don't have a GitHub account, you may need to create one; this is free and only takes about a minute. You can then explain the problem here.

Since most plugins are provided by third parties, we are unable to accept bug reports for plugins through standard RemNote support channels – even plugins provided by RemNote. We will of course respond to and fix issues in official plugins when reported through the _Report Bugs_ button on the plugin, however!

RemNote automatically updates plugins when they release new versions, but will not automatically re-enable plugins that you've disabled. GitHub will normally email you when the author replies to your bug report, so you should be able to get status updates this way and can re-enable the plugin when a fix is available.

* * *

Related Articles

[

How Network Restrictions in Mainland China Affect RemNote

](https://help.remnote.com/en/articles/13826510-how-network-restrictions-in-mainland-china-affect-remnote)
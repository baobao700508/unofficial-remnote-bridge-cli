<!-- source: https://help.remnote.com/en/articles/13826510-how-network-restrictions-in-mainland-china-affect-remnote -->
<!-- crawled: 20260306_142324 -->

# How Network Restrictions in Mainland China Affect RemNote

Due to network restrictions in mainland China, you may experience **intermittent connectivity issues** when using RemNote, such as:

-   Slow page loading or timeouts
    
-   Occasional sync failures or delays
    
-   Inconsistent performance across other **features requiring an active internet connection**
    

We understand how frustrating this can be. Please note that this is due to local network environments rather than an issue with RemNote's servers.

# Images Failing to Sync

Some users report that images fail to sync even when using a network proxy tool. Common causes include:

-   The proxy tool is **not routing system-wide traffic**, so the RemNote desktop app's connections are not being proxied
    
-   **Unstable proxy connection quality**, causing large file transfers to be interrupted
    
-   **Local DNS resolution issues**
    

# Recommendations

-   Use a **network proxy tool** when accessing RemNote for a more stable connection
    
-   Ensure your proxy tool is set to **global mode** so that desktop app traffic is also routed through the proxy
    
-   If image sync fails, try **switching to a different proxy node**
    
-   When connectivity is unstable, you can use the desktop app's **[offline mode](https://help.remnote.com/en/articles/6752029-offline-mode)** to continue editing — your changes will sync automatically once the connection is restored
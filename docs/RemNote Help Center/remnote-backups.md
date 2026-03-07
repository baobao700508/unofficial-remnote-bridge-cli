<!-- source: https://help.remnote.com/en/articles/6301627-remnote-backups -->
<!-- crawled: 20260306_142324 -->

# RemNote Backups

On rare occasions, you may accidentally delete something from your Knowledge Base or lose content due to a hardware or software error, such as a power failure, a corrupted hard disk, an operating system error, or a bug in RemNote. To reduce the risk of permanently losing your notes, RemNote automatically takes backups in many cases and provides a way to restore them.

If you've lost some Rem but aren't sure if you need to restore a backup specifically, try the quick steps in [Help! I deleted my Rems or they've gone missing!](https://help.remnote.com/en/articles/6301581-help-i-deleted-my-rem-or-they-ve-gone-missing) first.

# Finding a backup to restore

**Backups are generated automatically** and can come from several sources.

## Daily Backups

Our cloud servers automatically store a backup of your **Synced Knowledge Base** every day unless it has not changed since the previous day's backup. All Daily Backups are retained for at least 60 days, unless you delete your RemNote account. (Backups older than this will likely be available as well, but only some of them will be retained and the details of which ones are retained may change from time to time.)

You can download a Daily Backup by going to _Settings > Backups_ and then selecting the date of the backup you want.

## Local Backups

If you are using the **[desktop app](https://help.remnote.com/en/articles/6030835-desktop-app)**, you will have local backups available for your knowledge bases on your computer. You can adjust how often backups are created and set a maximum storage size for them. To quickly access your backup location or change backup settings, go to _Settings > Backups > Local Backups_.

Both **Synced** and **Local Knowledge Bases** generate local backups.

[![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1682636193/bc78869a9a22e3b3919ab818cfea/CleanShot+2025-08-22+at+12_57_38%402x.png?expires=1772827200&signature=45ea5805ba4ca1378f72fbc8db30c6aff5c830428bf228f7edbcd85c9bdd2634&req=dSYvFM99m4BWWvMW1HO4zbSWUEOA0rGSmtEIL%2BzTJXseF4JQ9J4Z0Cd55Ae3%0AgzYXWhHiM01JNDO6Iyw%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1682636193/bc78869a9a22e3b3919ab818cfea/CleanShot+2025-08-22+at+12_57_38%402x.png?expires=1772827200&signature=45ea5805ba4ca1378f72fbc8db30c6aff5c830428bf228f7edbcd85c9bdd2634&req=dSYvFM99m4BWWvMW1HO4zbSWUEOA0rGSmtEIL%2BzTJXseF4JQ9J4Z0Cd55Ae3%0AgzYXWhHiM01JNDO6Iyw%3D%0A)

Local backups are stored on your computer's hard drive, in the `backups` subfolder of a folder which you can find at the _Local Storage Location_ displayed in your Knowledge Base's settings (click on the name of your KB under the “Knowledge Base” heading in settings to get here).

Along with your daily backups, RemNote also keeps copies of all files you’ve uploaded (such as images, PDFs, and audio files) on your hard drive. These files can be found in the ‎`files` subfolder within the same folder as your backups.

Additionally, you can also **open your KB's local folder** from the KB that's currently open in your app by going to _Settings > Troubleshooting > Locate .db file_.

## Manual Backups

If you've manually backed up your knowledge base recently (see _Making a manual backup_, further down), you can also restore from that backup.

# Restoring a backup

Once you've found a backup, you'll want to restore it. The procedure will differ somewhat depending on what you've lost.

## If you've lost or completely destroyed an entire Knowledge Base

If there's nothing left in your Knowledge Base that you want to keep:

1.  If you still have any Rems in the Knowledge Base, choose _Settings > Profile > Account Deletion > Delete All Rems_ to clean everything up.
    
2.  Choose _Settings > Import > RemNote_ or [click here](https://remnote.com/import) while logged into RemNote.
    
3.  Choose the RemNote tile.
    
4.  Click _Browse for file and_ select the backup file you want to restore (if you're not sure how to find your backup, see the previous section, _Finding a backup to restore_).
    
5.  Click _Open._
    

## If you want to recover specific Rems from a backup

If your Knowledge Base is mostly fine, but you've accidentally deleted or lost some specific Rems that you weren't able to restore from the [Trash](https://help.remnote.com/en/articles/6301581-help-i-deleted-my-rems-or-they-ve-gone-missing#h_37328af2d4), then you can import a complete backup into a new Local Knowledge Base and retrieve the specific Rems that you need to restore from it.

Note: Be careful to not import the complete backup into your main Knowledge Base by accident. This **can't be undone** (except by restoring another backup from scratch), and it can create a huge mess. In particular, if you've slightly changed some Rems between now and when the backup was taken, then a lot of near-duplicate Rem will be created on your main KB.

1.  [Download](https://remnote.com/download) and install the desktop version of RemNote if you don't already have it.
    
2.  From the user drop-down in the upper-left corner, select _Add New Knowledge Base_.
    
3.  Give your new KB a name, choose “Local Only” for the type, and choose a folder on your hard drive to place this temporary KB in.
    
4.  Click _Create Knowledge Base._
    
5.  Choose _Settings > Import_ while logged into RemNote.
    
6.  Choose the _RemNote_ tile.
    
7.  Click _Select File and_ select the backup file you want to restore (if you're not sure how to find one, see the previous section, _Finding a backup to restore_).
    
8.  Click _Open._
    
9.  Explore your knowledge base to find the Rems that you need.
    
10.  Transfer the appropriate Rems into your knowledge base using one of the following methods:
     
     1.  Copy and pasting. This is particularly easy, but may lose some amount of data on occasion (for example, flashcard review history).
         
     2.  Export the documents you want to transfer to the _RemNote (Complete)_ type. To do this, choose _Export_ from the document menu, the "..." (3-dot) button in the upper-right corner of the document, and then import the resulting files into your main KB.
         
     
11.  When you're done with the temporary knowledge base, clean up by choosing _Settings > Knowledge Base > "name of temporary KB" > Delete Knowledge Base_, then follow the instructions shown on the app.
     

## If you're not sure what backup to restore

Sometimes you might not be sure when you lost your data, so you may need to check several backups to find a version that contains what you've lost and is still reasonably up to date.

1.  Pick a backup to check first and follow the instructions in the _If you want to recover specific Rems from a backup_ section, stopping at step 9 (after you have imported a backup).
    
2.  Remove all Rems from the temporary KB by choosing _Settings > Profile > Account Deletion > Delete All Rems_
    
3.  Repeat steps 5–9 above using different backup files until you find the appropriate backup, then continue to steps 10–11.
    

# Making a backup manually

If you went to transfer the data in a Local Knowledge Base to a different computer or if you're feeling particularly paranoid, you can export your entire KB in the RemNote format by choosing _Settings > Export._ Then select the Knowledge Base you want to backup, set the _Format_ to _Full RemNote (Complete),_ and click the _Export button_.

This backup includes everything in your KB _except:_

-   Copies of files you have uploaded to RemNote. To export or import these files, please refer to [How do I move content from a Local KB to a Synced KB?](https://help.remnote.com/en/articles/6758834-how-do-i-move-content-from-a-local-kb-to-a-synced-kb)
    
-   Your RemNote settings
    
-   Your Knowledge Base's name
    
-   Your themes and plugin's installations and settings.
    

The backup can later be restored using any of the methods described above in _Restoring a backup_.

* * *

Related Articles

[

Help! I deleted my Rems or they've gone missing!

](https://help.remnote.com/en/articles/6301581-help-i-deleted-my-rems-or-they-ve-gone-missing)[

Multiple Knowledge Bases

](https://help.remnote.com/en/articles/7867942-multiple-knowledge-bases)[

Moving Content Between Knowledge Bases

](https://help.remnote.com/en/articles/7868482-moving-content-between-knowledge-bases)[

Importing Notes

](https://help.remnote.com/en/articles/7898005-importing-notes)[

Deleting Your Account

](https://help.remnote.com/en/articles/8033036-deleting-your-account)
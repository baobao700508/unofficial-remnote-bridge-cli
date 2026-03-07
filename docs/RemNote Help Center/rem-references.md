<!-- source: https://help.remnote.com/en/articles/6030714-rem-references -->
<!-- crawled: 20260306_142324 -->

# Rem References

Human memory and understanding is fundamentally based on connecting ideas together. You don't learn new facts in a vacuum, you learn them by connecting them to things you already know. And you remember things by first thinking of something else they're related to.

We believe that your notes and flashcards are more effective when they match the way you naturally think, so **Rem References** – links between concepts, ideas, and sections of your notes – are a key part of RemNote.

# Creating Rem References

You can insert a Rem Reference anywhere in your notes by typing `[[`, `++`, or `@`. A search popup will appear; find the Rem you want to reference as you would in any other search and click on it or press Enter to add it. If you want to create and link to a _new_ Rem at the top level (not inside any document), rather than finding an existing one, you can type its full text and then select the last option in the list, labeled _Create Rem_, or press Ctrl+Enter (Cmd+Enter on a Mac).

If you can already see the Rem you want to reference, you can also copy and paste it. First, click on or use the arrow keys to move to the target Rem, but don’t highlight anything. Then press Ctrl+C (Cmd+C on a Mac). A small tooltip that says _Copied to clipboard_ will appear. Now put your cursor where you want to insert the Rem Reference and press Ctrl+V; a reference will be pasted.

Several options in _Settings > Editor_ allow you to control exactly what is created when you use Ctrl+Enter to create a new Rem from the reference search.

[![](https://downloads.intercomcdn.com/i/o/730066624/2e8d8730331590888a9128ca/image.png?expires=1772827200&signature=4046e79875eaf0ab387d97bea73282cef42833aeb5a5f4feb711649bdfd0aa6b&req=cyMnFs94m4NbFb4f3HP0gFiQAUxfBpwvkq8u4NOuIvut7krq7FZsNpjsAQtr%0A1%2FN1zI%2BFntBgNkKeLA%3D%3D%0A)](https://downloads.intercomcdn.com/i/o/730066624/2e8d8730331590888a9128ca/image.png?expires=1772827200&signature=4046e79875eaf0ab387d97bea73282cef42833aeb5a5f4feb711649bdfd0aa6b&req=cyMnFs94m4NbFb4f3HP0gFiQAUxfBpwvkq8u4NOuIvut7krq7FZsNpjsAQtr%0A1%2FN1zI%2BFntBgNkKeLA%3D%3D%0A)

_Note:_ If you actually want to type the characters `[[`, `++`, or `@`, rather than creating a Reference, just press the Escape key afterwards.

## Referencing an image

You can also create a Rem Reference to an image. However, this can be a little tricky if you don't know how, since it's hard to search for an image by typing on the keyboard! There are two approaches:

-   Copy the image's Rem as a reference, as described in the previous section.
    
-   Add an [alias](https://help.remnote.com/en/articles/6751477-aliases) to the image's Rem, then search for that alias with `[[` reference search.
    

# Using Rem References

As with links in other applications, you can click on a Rem Reference to navigate to that Rem. You can also hold down Shift while clicking on the reference to open the Rem in a [new pane](https://help.remnote.com/en/articles/6751451-using-multiple-panes-split-screen), or right-click on the reference for more options.

If you frequently need to peek at referenced Rems, consider enabling the _Preview Rems on Hover_ option in _Settings > Quick Lookup_. With this option on, when you hover your mouse cursor over the link, a preview popup will appear showing the content of the referenced Rem and its children.

RemNote uses the references you create to populate the Knowledge Graph (choose `/view local graph` or `/view global graph` from the [omnibar](https://intercom.help/remnote/en/articles/7852647-using-the-omnibar); this is a Pro feature). It also considers references when deciding what flashcards are related and should be shown near each other.

If you ever change the text of a Rem, all references to it automatically update.

[![](https://remnote.intercom-attachments-1.com/i/o/475956853/271a3d6cf3a0e66de5862ed7/_wGMbBxktZG4IhjUp_DZ8NMm-iPKwqp-aCOgq1W1wtXD64vTbQykJThkpQXIoLBfpnRfOWHPQE5H4AWD73V_M_6-WxLMFlFiuyy4A0AsLviMeuW2NYuWfsIKdlwFDrHq.gif?expires=1772827200&signature=8df631162ccb31cb4944917f43653b6b69b40d1455827ace56481274bdb4dc1b&req=cCciH8x4lYRcFb4f3HP0gH35%2FuZo1X9cxGuYzUYjfLGvS3C1umR650ttwZtR%0AxxWVgAc%2FKqC%2FY3rIaw%3D%3D%0A)](https://remnote.intercom-attachments-1.com/i/o/475956853/271a3d6cf3a0e66de5862ed7/_wGMbBxktZG4IhjUp_DZ8NMm-iPKwqp-aCOgq1W1wtXD64vTbQykJThkpQXIoLBfpnRfOWHPQE5H4AWD73V_M_6-WxLMFlFiuyy4A0AsLviMeuW2NYuWfsIKdlwFDrHq.gif?expires=1772827200&signature=8df631162ccb31cb4944917f43653b6b69b40d1455827ace56481274bdb4dc1b&req=cCciH8x4lYRcFb4f3HP0gH35%2FuZo1X9cxGuYzUYjfLGvS3C1umR650ttwZtR%0AxxWVgAc%2FKqC%2FY3rIaw%3D%3D%0A)

# Backlinks

Rem References, like links in your memory, are bidirectional. That is, when you're in a Rem A and reference another Rem B, a link is also created from B to A. This backwards link from B to A is called a _backlink_. References to a Rem appear in a small gray box showing the number of references at the far right of that Rem on the screen. Or, if you've zoomed in to the Rem, they'll appear at the bottom of the page.

[![](https://remnote.intercom-attachments-1.com/i/o/475956840/044c2861a64a7f5e52dcf476/HFv7WUbtyfGVIGgyEM4EyTqhGtsjBT53L9Vejb8C3hbF3qEcbXCi6qJFMSS7pUK2VePuZX4tnijDoeNxYN0gxD5ShVU7LcNjjr1NsZU9utNL1gBrWUhrajs0ni-hx6aK.png?expires=1772827200&signature=7faa6651eb21fbafce7f928629bd528cd542029e2dc72168de22c6445d26a404&req=cCciH8x4lYVfFb4f3HP0gFGdloFRRk5qsMsDbGYoFWW0AtJrzR38Bkc1wNW7%0A1ERbQAceWoISnnQ2dQ%3D%3D%0A)](https://remnote.intercom-attachments-1.com/i/o/475956840/044c2861a64a7f5e52dcf476/HFv7WUbtyfGVIGgyEM4EyTqhGtsjBT53L9Vejb8C3hbF3qEcbXCi6qJFMSS7pUK2VePuZX4tnijDoeNxYN0gxD5ShVU7LcNjjr1NsZU9utNL1gBrWUhrajs0ni-hx6aK.png?expires=1772827200&signature=7faa6651eb21fbafce7f928629bd528cd542029e2dc72168de22c6445d26a404&req=cCciH8x4lYVfFb4f3HP0gFGdloFRRk5qsMsDbGYoFWW0AtJrzR38Bkc1wNW7%0A1ERbQAceWoISnnQ2dQ%3D%3D%0A)

See the [Backlinks](https://help.remnote.com/en/articles/6030776-backlinks) article for more information about this linking functionality.

# Rem References vs. Links

Rem References are similar to but distinct from [links](https://help.remnote.com/en/articles/7042107-links). Links are underlined rather than just shown in a different color. Unlike Rem References, links can have arbitrary text, and they can link to external websites in addition to Rems in your knowledge base. Otherwise, they work similarly.

[![](https://downloads.intercomcdn.com/i/o/730050713/2cf6a349f9d129a9f3d17b3f/image.png?expires=1772827200&signature=e75e0fa7262b0ec5400902676a1f3d58eb05548e81223f008fc61cb333e672d6&req=cyMnFsx%2BmoBcFb4f3HP0gARZjrFtnxYu%2FXTcoXcH%2FW%2B71l%2BXrdfZObHfZRPm%0A65W7bJo%2F%2FId9tE%2BRdA%3D%3D%0A)](https://downloads.intercomcdn.com/i/o/730050713/2cf6a349f9d129a9f3d17b3f/image.png?expires=1772827200&signature=e75e0fa7262b0ec5400902676a1f3d58eb05548e81223f008fc61cb333e672d6&req=cyMnFsx%2BmoBcFb4f3HP0gARZjrFtnxYu%2FXTcoXcH%2FW%2B71l%2BXrdfZObHfZRPm%0A65W7bJo%2F%2FId9tE%2BRdA%3D%3D%0A)

* * *

Related Articles

[

Moving Rems & Organizing Hierarchies

](https://help.remnote.com/en/articles/6030548-moving-rems-organizing-hierarchies)[

Super-Private Rems

](https://help.remnote.com/en/articles/6052751-super-private-rems)[

What's the difference between References, Tags, and Portals?

](https://help.remnote.com/en/articles/6634227-what-s-the-difference-between-references-tags-and-portals)[

Links

](https://help.remnote.com/en/articles/7042107-links)[

Rems

](https://help.remnote.com/en/articles/8017859-rems)
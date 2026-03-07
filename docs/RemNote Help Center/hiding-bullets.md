<!-- source: https://help.remnote.com/en/articles/10113772-hiding-bullets -->
<!-- crawled: 20260306_142324 -->

# Hiding Bullets

There are a couple of ways to hide bullets from your Rems to achieve a cleaner look in your notes. Depending on your visual preferences, having these hidden can look better when writing long-form text or documents that have few or no indentation levels.

# Hide Bullets mode on Documents

Documents have a special **Hide Bullets mode** that not only hides the bullets of their direct children but also changes certain behaviors of the editor for a better long-form writing experience.

When zoomed into a document, open the Document menu (smiley icon) and select Hide Bullets.

[![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1860667400/89014f651b69759fb62fc5d77022/CleanShot+2025-12-02+at+17_22_31%402x.png?expires=1772827200&signature=fe6bab5fd8022567021ed98629dc5cf3d31e00421e997ca5b0b5a0c23e65d259&req=dSghFs94moVfWfMW1HO4zaEjEQKn%2FUZ4HftrYRDI4XM9Wc%2FJY%2BHWpkjJGl2s%0AGJM%2B8DYKyh5Oh7DPmn4%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1860667400/89014f651b69759fb62fc5d77022/CleanShot+2025-12-02+at+17_22_31%402x.png?expires=1772827200&signature=fe6bab5fd8022567021ed98629dc5cf3d31e00421e997ca5b0b5a0c23e65d259&req=dSghFs94moVfWfMW1HO4zaEjEQKn%2FUZ4HftrYRDI4XM9Wc%2FJY%2BHWpkjJGl2s%0AGJM%2B8DYKyh5Oh7DPmn4%3D%0A)

These are the special behaviors of your document when this mode is enabled.

-   Rems that are direct children of the document won't have any visible bullets.
    
-   Typing `-` or `*` at the beginning of a direct children Rem or pressing **Tab** will make a bullet appear again on it. Pressing **Shift+Tab** will also hide the bullet again.
    
    -   In this mode, Rems with hidden bullets can't have any Rems _truly_ indented under them. You can only indent Rems with bullets under other Rems with bullets
        
    -   **Be careful!** Rems with a bullet are not indented under a Rem without a bullet, even in the case of headers (see more info below).
        
    
-   Headers will be able to collapse and expand Rems on the same level as them and they will **respect the Heading size hierarchy**.
    
    -   Collapsing a heading will hide all content below it up until the next heading of the same or larger size. For example, collapsing a H2 heading won't hide an H2 or H1 heading that is positioned below it in the document, but will hide any H3 headings up until the next H2 or H1.
        
    -   It is as if the headings are separating different sections of the document, just like a non-outliner text editor would.
        
        [![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1248109252/4a59d5e9c7201ab60373bd778fdc/2024-11-11_21-29-29.gif?expires=1772827200&signature=2bb92cf5a430c9634e0ef820ad70f1298d6a90bf275f1dec21d55dd410ac4d9f&req=dSIjHsh%2BlINaW%2FMW1HO4zUl6ocg2rwx1rNDcx9dMcogj7Pll3FZ5kxdbTpBs%0AwQQJ%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1248109252/4a59d5e9c7201ab60373bd778fdc/2024-11-11_21-29-29.gif?expires=1772827200&signature=2bb92cf5a430c9634e0ef820ad70f1298d6a90bf275f1dec21d55dd410ac4d9f&req=dSIjHsh%2BlINaW%2FMW1HO4zUl6ocg2rwx1rNDcx9dMcogj7Pll3FZ5kxdbTpBs%0AwQQJ%0A)
        
    

**Be careful!** Even though this heading behavior may look like the Rems that are collapsed with it are indented under it (children of it), they are not.

If you create flashcards in such a document, even if you press Tab to show a bullet point underneath the heading, **the header won't appear in the flashcard** because they are actually at the same hierarchy level. For this reason, we usually don't recommend using _Hide Bullets_ mode for documents that will include many flashcards, where being able to easily understand the hierarchy is critical to predicting how the flashcards will appear in the queue.

Note in this image that "Header" doesn't appear on the flashcard.

[![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1248112121/cff5e5bc63e78ca3c7be79c32da3/image.png?expires=1772827200&signature=c7451d6205cd33377a1bd0e7ae5252e202cd1c749cdf5fa6d7dda17856f91ef3&req=dSIjHsh%2Fn4BdWPMW1HO4zbKmgaP8F47Z2vU%2BJY0YKyFDhzjBiNIZaVGAHCho%0AmXJrG6tR09Zucn%2Bnj4w%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1248112121/cff5e5bc63e78ca3c7be79c32da3/image.png?expires=1772827200&signature=c7451d6205cd33377a1bd0e7ae5252e202cd1c749cdf5fa6d7dda17856f91ef3&req=dSIjHsh%2Fn4BdWPMW1HO4zbKmgaP8F47Z2vU%2BJY0YKyFDhzjBiNIZaVGAHCho%0AmXJrG6tR09Zucn%2Bnj4w%3D%0A)

Likewise, these headings won't be part of the breadcrumbs of Rems “under” them.

If you want to hide bullets and still preserve the standard hierarchy behavior, use the second method (below) instead.

# Hiding bullets of individual Rems

A simpler and more flexible method of achieving this is using the **Hide Bullet command**. This will hide the bullet of the selected Rem or Rems...that's it!

You can toggle Hide Bullet using the [/-menu or Omnibar bar command](https://help.remnote.com/en/articles/7893440-keyboard-shortcuts#h_f2dd482769) `/hide bullet` or `/hb`. Additionally, pressing Enter on a Rem that has its bullet hidden will create a new Rem with its bullet already hidden.

[![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1248122513/2103411737cb43072c6281b306c8/2024-11-11_21-48-21.gif?expires=1772827200&signature=7aeeeefbdb30ea7fca97abf70f08e9cb1a094e3a72ae09229dd7485edc069251&req=dSIjHsh8n4ReWvMW1HO4zawWvol%2B9%2Fbe%2BEx5zfL%2BWITlPjYjxYSPsOMM6wPS%0A598dBTYcGHqDdgKJrRg%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1248122513/2103411737cb43072c6281b306c8/2024-11-11_21-48-21.gif?expires=1772827200&signature=7aeeeefbdb30ea7fca97abf70f08e9cb1a094e3a72ae09229dd7485edc069251&req=dSIjHsh8n4ReWvMW1HO4zawWvol%2B9%2Fbe%2BEx5zfL%2BWITlPjYjxYSPsOMM6wPS%0A598dBTYcGHqDdgKJrRg%3D%0A)

* * *

Related Articles

[

5-Minute Editor Overview

](https://help.remnote.com/en/articles/6030541-5-minute-editor-overview)[

Documents and Folders

](https://help.remnote.com/en/articles/6030703-documents-and-folders)[

Hiding Rems

](https://help.remnote.com/en/articles/6030711-hiding-rems)[

Rems

](https://help.remnote.com/en/articles/8017859-rems)[

Hiding Ancestors on Flashcards

](https://help.remnote.com/en/articles/9631727-hiding-ancestors-on-flashcards)
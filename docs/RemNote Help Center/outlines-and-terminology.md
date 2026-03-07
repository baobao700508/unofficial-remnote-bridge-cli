<!-- source: https://help.remnote.com/en/articles/8196578-outlines-and-terminology -->
<!-- crawled: 20260306_142324 -->

# Outlines and Terminology

RemNote is fundamentally an _outline-based_ note-taking tool: documents are composed of a series of bullet points which can be indented to form a hierarchy. This makes it easy to organize your notes in as much detail as you require.

Here's how to work with and talk about outlines.

# Indenting

To indent a Rem, press the Tab key on your keyboard (near the top-left on most keyboard layouts). This will move it a short distance further to the right on the screen, indicating that it's a subpart of the Rem above it. Note that you can only indent one level at a time; for instance, here you couldn't indent B a second level:

-   A
    
    -   B
        
    

Instead, you'd need to add another Rem in between, and then you could indent B to the third level:

-   A
    
    -   C
        
        -   B
            
        
    

The opposite of indenting is **outdenting** (some other outliners call this **dedenting**). To outdent, press Shift+Tab. This will move the Rem one level back towards the left.

When you outdent, by default, the Rem you're outdenting will be moved up or down as necessary to maintain the parent/child relationships between Rems (see the next section). For instance, here, if you outdent B, it will be moved down to be placed _after_ C. Otherwise, C would suddenly become a child of B instead of A, which would change the logical relationship of the bullet points to one another, and potentially what was shown on the flashcards of the surrounding Rems.

-   A
    
    -   B
        
    -   C
        
    

If you prefer to just indent the bullets directly, changing the relationships between them if necessary, change the _Default Outdenting Behavior_ option in _Settings > Editor_ to _Google-Docs Style_.

[![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1494696352/82d1ebc5bd4b0498540d52a81eba/CleanShot+2025-04-25+at+15_54_22%402x.png?expires=1772827200&signature=53710c2bce6ca1b2d009d3cb73e82d96c498b1d1a5b86055c496bd824e724791&req=dSQuEs93m4JaW%2FMW1HO4zYtZPibn4YYXo0Adyvn30heWSzOr95eSYit181Qd%0ADAqbJpYr2wLMHKu2v8w%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1494696352/82d1ebc5bd4b0498540d52a81eba/CleanShot+2025-04-25+at+15_54_22%402x.png?expires=1772827200&signature=53710c2bce6ca1b2d009d3cb73e82d96c498b1d1a5b86055c496bd824e724791&req=dSQuEs93m4JaW%2FMW1HO4zYtZPibn4YYXo0Adyvn30heWSzOr95eSYit181Qd%0ADAqbJpYr2wLMHKu2v8w%3D%0A)

# Families of Rems

To speak concisely about the logical relationships between Rems created by indentation, we borrow terminology from family trees.

**Child:** B is a child of A when B is indented exactly one level below A, with no other Rem on the level of A coming in between.

**Parent:** A is a parent of B when B is indented exactly one level below A, with no other Rem on the level of A coming in between.

Here, B is a child of A and A is a parent of B:

-   A
    
    -   B
        
    

Here, B is a child of C (and C a parent of B). B does not have a parent/child relationship with A.

-   A
    
-   C
    
    -   B
        
    

We can extend this same family-relations language to work with multiple levels.

**Descendant:** C is a descendant of A when C is indented one or more levels below A.

**Ancestor:** A is an ancestor of C when C is indented one or more levels below A.

Note that this definition means a parent is also an ancestor, and a child is also a descendant.

Here, both B and C are descendants of A, and A is an ancestor of both B and C. (Also, B is an ancestor of C, and C a descendant of B.):

-   A
    
    -   B
        
        -   C
            
        
    

Here, A is an ancestor of every other letter. C is a descendant of A, E, F, and G:

-   A
    
    -   B
        
    -   D
        
    -   E
        
        -   F
            
            -   G
                
                -   **C**
                    
                
            -   H
                
            
        
    

**Sibling:** Sibling Rems are at the same level of indentation and have the same parent. In the above example, B, D, and E are siblings, as are G and H.

If you ever have occasion to, you can continue the metaphor and talk about **grandparents**, **uncles**, and so on, but such specific descriptions are rarely needed.

# Top-level Rems

A **top-level Rem** is one that has no parent – it's at the top level of its hierarchy. It can have any number of descendants. Top-level Rems are normally either documents or [concepts](https://help.remnote.com/en/articles/6026154-structuring-knowledge-with-the-concept-descriptor-framework) that are relevant in a variety of different contexts. In theory you can make anything into a top-level Rem, but if you make something that's not a document or a reusable concept into a top-level Rem, chances are you'll lose track of it, so this usually isn't a good idea.

You can make a Rem that currently has a parent into a top-level Rem by moving it (Ctrl+Alt+M, or Cmd+Opt+M on a Mac) and selecting the _No parent: Turn this into a top-level Rem_ option from the search popup.

[![](https://downloads.intercomcdn.com/i/o/808923252/25b4ddc32a37c215efa014bf/image.png?expires=1772827200&signature=ebbcfa32496f881eac09abdefa5e4d8740d77ce9c1b295fffadebb4d9353d4ef&req=fCAvH8t9n4RdFb4f3HP0gBfpRvV5qYXsXuZ681nvPX%2Bg2hwbQzfKNqdoODC5%0ATDqwrxbxyezKW4EYpQ%3D%3D%0A)](https://downloads.intercomcdn.com/i/o/808923252/25b4ddc32a37c215efa014bf/image.png?expires=1772827200&signature=ebbcfa32496f881eac09abdefa5e4d8740d77ce9c1b295fffadebb4d9353d4ef&req=fCAvH8t9n4RdFb4f3HP0gBfpRvV5qYXsXuZ681nvPX%2Bg2hwbQzfKNqdoODC5%0ATDqwrxbxyezKW4EYpQ%3D%3D%0A)

Top-level Rems can be, but do not have to be, [documents](https://help.remnote.com/en/articles/6030703-documents-and-folders).

# Topology of a RemNote knowledge base

Each top-level Rem within your knowledge base creates a hierarchy below it. This hierarchy can contain any number of Rems – all the way from one (just the top-level Rem by itself) to an unlimited number of descendants. And you can have any number of separate hierarchies.

These “separate” hierarchies are not separate worlds which can never meet, however; Rems that are in different hierarchies can be connected with [references, tags, and portals](https://help.remnote.com/en/articles/6634227-what-s-the-difference-between-references-tags-and-portals).

# Zooming

You can [zoom in to](https://help.remnote.com/en/articles/6030710-zooming-into-rem) any Rem anywhere in a hierarchy. This makes that Rem appear like a document – the Rem you zoom in to becomes the document title in large text at the top of the screen, and its descendants appear below. The ancestors of the Rem you zoom in to collapse into the **breadcrumb** at the top of the page. Here we've zoomed in to the **631 Architecture** Rem, and you can see that it has two folders above it:

[![](https://downloads.intercomcdn.com/i/o/802117932/6c5baf4fad6ba72c68b6e0fb/image.png?expires=1772827200&signature=11f6dafb40b655e91bbf338d18b75e637eea4671d6eb5feadee3ddadde9a825e&req=fCAlF8h5lIJdFb4f3HP0gEWSs74CWkqvB9tG8BtzDjEun8CkmIPg58TRqzUC%0AR9hFshxx0t2rkWwBlQ%3D%3D%0A)](https://downloads.intercomcdn.com/i/o/802117932/6c5baf4fad6ba72c68b6e0fb/image.png?expires=1772827200&signature=11f6dafb40b655e91bbf338d18b75e637eea4671d6eb5feadee3ddadde9a825e&req=fCAlF8h5lIJdFb4f3HP0gEWSs74CWkqvB9tG8BtzDjEun8CkmIPg58TRqzUC%0AR9hFshxx0t2rkWwBlQ%3D%3D%0A)

In practice, you'll likely want to zoom in to a fairly limited number of points throughout each hierarchy. Usually these will put some large folder, concept, or category at the top of the page – maybe a subject, a class, a lecture, or a project. For this reason, any Rem that is marked as a folder or document is a “zoom point”. When you navigate to a Rem through search or by clicking on a Reference, RemNote zooms into the closest ancestor of that Rem that is marked as a folder or document and then highlights the target Rem within that view.

Here you can see that at first, searching for D zooms in to _Top-Level Document_ and highlights D. But when we mark B as a document, searching for D zooms in to B and highlights D.

[![](https://downloads.intercomcdn.com/i/o/717734223/5f93465038be681049eb3c91/Peek+2023-04-21+09-04.gif?expires=1772827200&signature=76aa5895244b4dc2f5da3faff3c26f7560091ae4db15c2e76ee8caf44e2d9bd6&req=cyEgEcp6n4NcFb4f3HP0gJpDnqmrv9EtLL2UT9wIrIzOzKa0uc6GkbW%2BQmPx%0AEpZud0y%2FM%2FdcaNjYBw%3D%3D%0A)](https://downloads.intercomcdn.com/i/o/717734223/5f93465038be681049eb3c91/Peek+2023-04-21+09-04.gif?expires=1772827200&signature=76aa5895244b4dc2f5da3faff3c26f7560091ae4db15c2e76ee8caf44e2d9bd6&req=cyEgEcp6n4NcFb4f3HP0gJpDnqmrv9EtLL2UT9wIrIzOzKa0uc6GkbW%2BQmPx%0AEpZud0y%2FM%2FdcaNjYBw%3D%3D%0A)

# References and Tags

Rems in different hierarchies (as well as Rems in the same hierarchy) can be linked together using [references](https://help.remnote.com/en/articles/6030714-rem-references) and [tags](https://help.remnote.com/en/articles/6030770-tags). References create a link to another Rem; clicking a Reference will take you to the document the Rem is contained in (see _Zooming_ above) and highlight it. Tags indicate that one Rem is _a type of_ another Rem (for instance, that a Cat is a type of Animal); you can jump quickly between a Rem and its tag, and a tag and all Rems that it is attached to.

# Portals

[Portals](https://help.remnote.com/en/articles/6030742-portals) allow Rems from one hierarchy to appear somewhere within a different hierarchy. They solve a key problem: in traditional hierarchies, each item can only be in a single place, but sometimes the same idea belongs in multiple places in your notes. With a portal, you can put the idea in one primary location (maybe as a top-level Rem, or in the document it is most obviously related to), and then **portal in** the relevant Rems to every other place where they belong.

Portals have a blue line to their left when they're not selected, and a blue line all the way around them when they are selected, to indicate that the Rems within them are not actually within the current hierarchy. When your cursor is inside a portal, if the topmost Rem within the portal isn't a top-level Rem, the hierarchy where that Rem is actually located will additionally be displayed to the upper-right of the portal.

[![](https://downloads.intercomcdn.com/i/o/802122936/2389818fb9845d971b84c4c5/image.png?expires=1772827200&signature=a0d9ceca3916baab70cc58616c7ce0c955bedfd23ba46c55241ca4a35d22c5f4&req=fCAlF8t8lIJZFb4f3HP0gO4iqqgLY3FL1%2BFmAbZcjoy712CYV2ZthHGVvnAR%0AB%2FJB3fAH58Xtgg1MOA%3D%3D%0A)](https://downloads.intercomcdn.com/i/o/802122936/2389818fb9845d971b84c4c5/image.png?expires=1772827200&signature=a0d9ceca3916baab70cc58616c7ce0c955bedfd23ba46c55241ca4a35d22c5f4&req=fCAlF8t8lIJZFb4f3HP0gO4iqqgLY3FL1%2BFmAbZcjoy712CYV2ZthHGVvnAR%0AB%2FJB3fAH58Xtgg1MOA%3D%3D%0A)

* * *

Related Articles

[

5-Minute Editor Overview

](https://help.remnote.com/en/articles/6030541-5-minute-editor-overview)[

Setting Priorities and Disabling Flashcards

](https://help.remnote.com/en/articles/7950982-setting-priorities-and-disabling-flashcards)[

Rems

](https://help.remnote.com/en/articles/8017859-rems)[

Tags, Properties, Templates, and Tables in Five Minutes

](https://help.remnote.com/en/articles/8070716-tags-properties-templates-and-tables-in-five-minutes)[

How does RemNote decide what flashcards are part of a document?

](https://help.remnote.com/en/articles/8892109-how-does-remnote-decide-what-flashcards-are-part-of-a-document)
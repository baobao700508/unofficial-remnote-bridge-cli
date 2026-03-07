<!-- source: https://help.remnote.com/en/articles/7897630-powerups -->
<!-- crawled: 20260306_142324 -->

# Powerups

A **powerup** is a special kind of [tag](https://help.remnote.com/en/articles/6030770-tags) you can add to a Rem to give it new behavior. Most kinds of formatting and special behaviors that can be attached to individual Rems are implemented as power-ups – for instance, background color/[highlighting](https://help.remnote.com/en/articles/6030579-formatting-your-notes#h_d2a48071b5), [todos](https://help.remnote.com/en/articles/6752161-managing-tasks-with-todos), and [Extra Card Detail](https://help.remnote.com/en/articles/6751966-extra-card-detail-power-up).

Because powerups work a bit differently than normal tags, you won’t find them in the `##` tag search (instead, apply them from the /-menu, more on which in a moment), and you won’t always see a tag in the editor when one is applied. Only powerups that don’t otherwise cause visible changes to a Rem in the editor show a tag. For instance, todos don’t have a tag because a large checkbox appears on the left side of the Rem, making it obvious that it’s a todo. But Extra Card Detail only does anything noticeable when you’re studying flashcards, not when you’re in the editor, so a tag with a powerup icon is displayed in the right margin when you’ve applied this powerup to a card.

[![](https://downloads.intercomcdn.com/i/o/740743697/2e2fa3053fe5076aa24c2f94/image.png?expires=1772827200&signature=94a226e3822df6528a3d366c1ac47bba52590a66ea7c24cff9d3a7d43b77d23e&req=cyQnEc19m4hYFb4f3HP0gHkGWZtwqIm2CmNB%2BG9Rr2d8kvOK4OxqUygCQUyp%0AmiPczWLuHarI2KeQYQ%3D%3D%0A)](https://downloads.intercomcdn.com/i/o/740743697/2e2fa3053fe5076aa24c2f94/image.png?expires=1772827200&signature=94a226e3822df6528a3d366c1ac47bba52590a66ea7c24cff9d3a7d43b77d23e&req=cyQnEc19m4hYFb4f3HP0gHkGWZtwqIm2CmNB%2BG9Rr2d8kvOK4OxqUygCQUyp%0AmiPczWLuHarI2KeQYQ%3D%3D%0A)

# Applying and removing powerups

You can find most powerups on the [/-menu](https://help.remnote.com/en/articles/7893440-keyboard-shortcuts#h_f2dd482769) – many of them in the _Power-Ups_ section. (A few internal powerups that you wouldn’t have any good reason to attach to a Rem yourself are left off of the /-menu.) For example, use `/red` to highlight a Rem in red, or `/ecd` to make a Rem appear as Extra Card Detail.

If a Rem already has a powerup and you want to remove it, you can do so in several ways, depending on the type of powerup:

-   If the powerup shows a tag in the right margin, click the X button on that tag.
    
-   If the powerup is an on-or-off state, activate it again (for example, type `/ecd` a second time to turn off Extra Card Detail).
    
-   If the powerup is one of a group of values, select the “off” or “none” item in this group from the /-menu (for example, type `/no highlight` after typing `/red` or another color to remove the highlight power-up).
    

# Searching for Rems with a powerup

Since powerups are tags, you can find Rems with that powerup by searching for an appropriate tag. For instance, to find all todo items in a particular document in a [search portal](https://help.remnote.com/en/articles/7231624-search-portals), you can search for Rems in that document with _Any Connection To_ Todo:

[![](https://downloads.intercomcdn.com/i/o/740764500/6c2f425634932f79a0877f59/image.png?expires=1772827200&signature=2515478088a1e90d32ccd841044a78a4b93721885e6c5e7e169d7ab5be992c9e&req=cyQnEc96mIFfFb4f3HP0gJPG5neqS%2FzEF64l1wIy1eC0P%2BzmbWFXgUfBdJJY%0Al2ghNnGf2fGUDEKMFA%3D%3D%0A)](https://downloads.intercomcdn.com/i/o/740764500/6c2f425634932f79a0877f59/image.png?expires=1772827200&signature=2515478088a1e90d32ccd841044a78a4b93721885e6c5e7e169d7ab5be992c9e&req=cyQnEc96mIFfFb4f3HP0gJPG5neqS%2FzEF64l1wIy1eC0P%2BzmbWFXgUfBdJJY%0Al2ghNnGf2fGUDEKMFA%3D%3D%0A)

# Properties

For many powerups, applying the powerup to a Rem also adds one or more special hidden data fields called **properties** to that Rem. For instance, selecting any highlight color actually applies a single _Highlight_ power-up, with different values of a _Color_ property, and the _Todo_ power-up has _Unfinished_ and _Finished_ property values, set to indicate whether the todo has been marked complete or not.

(_Note:_ The properties associated with powerups are fundamentally the same thing as [properties in templates](https://help.remnote.com/en/articles/8070716-tags-properties-templates-and-tables-in-five-minutes), but powerup slots are built into RemNote, rather than defined by you, and look different in the editor.)

Just like you can search for Rems tagged with a particular powerup, you can search for Rems with a particular value in some property. To extend the example above, suppose you want to see only all to-do Rems in a document that are still unfinished. To do this, we’ll search for Rems with _Any Connection To_ Unfinished (a property value associated with the _Todo_ power-up):

[![](https://downloads.intercomcdn.com/i/o/740750780/be0726aac1959e93d58db660/image.png?expires=1772827200&signature=d1195c4a5ebd78429c2c6c1f7bc22088d45b17378aea9fbeb44e74478dc8807c&req=cyQnEcx%2BmolfFb4f3HP0gN0vFeb7IYu29MbaO3kkQ8Dpjh0TlGhp43FHVxnd%0A06FzN2So2SZx%2FU43Ww%3D%3D%0A)](https://downloads.intercomcdn.com/i/o/740750780/be0726aac1959e93d58db660/image.png?expires=1772827200&signature=d1195c4a5ebd78429c2c6c1f7bc22088d45b17378aea9fbeb44e74478dc8807c&req=cyQnEcx%2BmolfFb4f3HP0gN0vFeb7IYu29MbaO3kkQ8Dpjh0TlGhp43FHVxnd%0A06FzN2So2SZx%2FU43Ww%3D%3D%0A)

# Finding powerup and property names

Especially for powerups that don’t show a tag in the editor, the name of a powerup or property value you want to search for may not be obvious. The Filters section of [Ctrl+F search](https://help.remnote.com/en/articles/6030721-searching-your-knowledge-base#h_16c99a77d9) shows both all tags used in the current documents, including powerups, and all property values used on that tag, so aside from being a useful way to filter your documents in its own right, this is the easiest way to find the correct powerup or property name to search for.

[![](https://downloads.intercomcdn.com/i/o/740748329/43026c385c06213cadde5a82/Screenshot+2023-05-12+at+1.30.27+PM.png?expires=1772827200&signature=e187431227dc9327609305b70afe73d53ed0768baed53fa49f49598285073923&req=cyQnEc12noNWFb4f3HP0gHE6TnvR5OslbV5eye7CwpBZ72iN7JMztA5dRhVC%0AYnq0fThhuM0IdKeI1w%3D%3D%0A)](https://downloads.intercomcdn.com/i/o/740748329/43026c385c06213cadde5a82/Screenshot+2023-05-12+at+1.30.27+PM.png?expires=1772827200&signature=e187431227dc9327609305b70afe73d53ed0768baed53fa49f49598285073923&req=cyQnEc12noNWFb4f3HP0gHE6TnvR5OslbV5eye7CwpBZ72iN7JMztA5dRhVC%0AYnq0fThhuM0IdKeI1w%3D%3D%0A)

Similarly, you can create a search portal that finds Rems with _Any Connection To_ the _Unfinished_ property value (you’ll be able to find this in the standard reference search when creating search queries, even though it is hidden from normal searches):

## A few common property values

-   **Todo**: Finished, Unfinished
    
-   **Highlight:** Red, Orange, Yellow, Green, Blue, Purple
    
-   **Header:** H1, H2, H3
    

* * *

Related Articles

[

5-Minute Editor Overview

](https://help.remnote.com/en/articles/6030541-5-minute-editor-overview)[

Tags

](https://help.remnote.com/en/articles/6030770-tags)[

Managing Tasks with Todos

](https://help.remnote.com/en/articles/6752161-managing-tasks-with-todos)[

Rems

](https://help.remnote.com/en/articles/8017859-rems)[

Columns

](https://help.remnote.com/en/articles/8890750-columns)
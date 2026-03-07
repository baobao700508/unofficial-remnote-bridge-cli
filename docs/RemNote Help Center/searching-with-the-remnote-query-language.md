<!-- source: https://help.remnote.com/en/articles/6964961-searching-with-the-remnote-query-language -->
<!-- crawled: 20260306_142324 -->

# Searching with the RemNote Query Language

The RemNote Query Language is used to describe what Rems you want to display in a [Search Portal](https://help.remnote.com/en/articles/7231624-search-portals). You can use a wide variety of criteria and be much more specific than when using standard searches (e.g., in Ctrl+P search or reference search).

## The Query Builder

There are two ways to write queries: by directly typing text, and by using the Query Builder, which provides a graphical interface for designing queries. You can open the Query Builder by clicking on the filter icon next to a search portal.

[![](https://downloads.intercomcdn.com/i/o/665866932/39451cb1ec1b3007da5b9a87/image.png?expires=1772826300&signature=c35b955abe2196ff776dd0ec388ec4094b112fe7ae36e91279c136aff54d806e&req=ciYiHs94lIJdFb4f3HP0gMySpnlxaWAybwFb%2BMch7V3bDSdp0oyAHYosXjaG%0ARFc7veHcZGOD6VHhKA%3D%3D%0A)](https://downloads.intercomcdn.com/i/o/665866932/39451cb1ec1b3007da5b9a87/image.png?expires=1772826300&signature=c35b955abe2196ff776dd0ec388ec4094b112fe7ae36e91279c136aff54d806e&req=ciYiHs94lIJdFb4f3HP0gMySpnlxaWAybwFb%2BMch7V3bDSdp0oyAHYosXjaG%0ARFc7veHcZGOD6VHhKA%3D%3D%0A)

You can switch back and forth between using the Query Builder and directly editing the search query in the text box at any time. New users should start with the Query Builder.

## Query Filters and Operators

Options in the Query Builder are shown in **bold**; the syntax used when manually writing a query is shown in `monospaced font`.

### Connections

Here, _SomeRem_ represents a Rem Reference inserted into the query with `[[` or `@`. (If you're using the Query Builder, you don't have to type `[[`; reference search will start automatically when you click in the right-hand drop-down, _Cat_ in the screenshot above.)

-   **Has Reference To** (`SomeRem`): Matches Rems that reference _SomeRem_.
    
-   **Is Tagged With** (`#SomeRem`): Matches Rems tagged with _SomeRem_, as well as Rems tagged with any Rem that _SomeRem_ is tagged with (tag inheritance).
    
-   **Is Directly Tagged With** (`!#SomeRem`): Matches Rems tagged with _SomeRem_ (no tag inheritance).
    
-   **Documents That Have** (`@SomeRem`): Matches documents that contain _SomeRem_, either as a direct descendant or as a portal. (Documents that contain a _reference_ to _SomeRem_ are not included; if you want this behavior, try `*SomeRem`, explained below.)
    
-   **In Document** (`^SomeRem`): Matches Rems that you can see if you open the document _SomeRem_. This includes Rems in fixed portals, but not search portals, and does _not_ include Rems that are children of collapsed Rems.
    
-   **Descendant Of** (`^^SomeRem`): Matches Rems that are direct descendants of _SomeRem_. This does not include Rems in portals, but does include Rems that are children of collapsed Rems.
    
-   **Any Connection To** (`*SomeRem`): Matches Rems that are connected to _SomeRem_ through any kind of link other than parent/child (reference, tag, etc.).
    

### Miscellaneous

-   **Has Text** (`"text"`): Matches Rems that contain the string of text within the quotation marks.
    
    -   Text “contains” searches work in a somewhat peculiar way for performance reasons. You can usually think of “contains” as “contains a word which begins with the search text”.  
        ​  
        ​_Nitty-gritty details – only read this if you're experiencing unexpected behavior in your contains searches after reading the above:_ RemNote first searches for all Rems which contain a word _beginning with_ at least one of the “contains” strings you typed. In contrast to the “starts with” search, this matches at the beginning of any word in the Rem, rather than only at the start of the entire Rem. Then, if you have multiple “contains” filters in the same search query, RemNote goes through all of the Rems it found in the first pass again, and shows only those that contain all of the “contains” filters as a substring; this time it does not have to be anchored at the beginning of a word.
        
    
-   **Has Rem Type** (`remType:concept`, `remType:descriptor`, `remType:none`): Matches Rems that are Concepts, Descriptors, or neither.
    
-   `~`: The tilde is a valid expression that never matches anything. When writing a query, you can use this as a placeholder for an expression to be inserted later.
    

### Boolean operators

Search terms above can be combined into expressions using `and`, `or`, and `not`, and grouped using Query Groups (in the visual query builder) or parentheses (in manually written queries). Here, _X_, _Y_, and _Z_ represent connections or miscellaneous search terms from the lists above.

In manually written queries, `and` and `or` have the same precedence and are evaluated from left to right. `not` has higher precedence than either.

-   `X and Y`: Matches Rems that match both terms _X_ and _Y_.
    
-   `X or Y`: Matches Rems that match either term _X_ or term _Y_, or both.
    
-   `not X`: Matches Rems that do not match term _X_.
    
-   `X and (Y or Z)`: Matches Rems that match both _X_, and either _Y_ or _Z_.
    
-   `X and not Y or Z`: Matches Rems that match X, but do not match Y; _or_ Rems that match Z, irrespective of whether they match X or Y.
    

* * *

Related Articles

[

Searching Your Knowledge Base

](https://help.remnote.com/en/articles/6030721-searching-your-knowledge-base)[

Hierarchical Search

](https://help.remnote.com/en/articles/6030777-hierarchical-search)[

Search Portals

](https://help.remnote.com/en/articles/7231624-search-portals)[

Powerups

](https://help.remnote.com/en/articles/7897630-powerups)[

Templates

](https://help.remnote.com/en/articles/8117687-templates)
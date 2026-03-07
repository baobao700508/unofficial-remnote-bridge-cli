<!-- source: https://help.remnote.com/en/articles/9252072-how-to-import-flashcards-from-text -->
<!-- crawled: 20260306_142324 -->

# How to Import Flashcards from Text

It is possible to have your imported notes automatically recognized as flashcards on RemNote. By using certain combinations of characters, RemNote will automatically convert those newly imported Rems into flashcards of a specific type. This can be especially useful to **programmatically create flashcards** through external means, like, for example, ChatGPT. Knowing some of these can also be handy when typing new flashcards in your notes.

This will work for imported notes from our [import feature](https://help.remnote.com/en/articles/7898005-importing-notes) or simply by **copying and pasting the contents on RemNote**.

# Basic flashcards

Use `>>` or `==` to signify that the bullet is a Basic Forward Flashcard, with the front side being before those characters, and the back side being after.

Example:

Question >> Answer

You can also use:

-   `<<` to create a backward flashcard
    
-   `<>` or `><` to create a two-way flashcard
    
-   `>-` to create a disabled flashcard
    

# Cloze flashcards

Add two braces `{` between the words you want to be occluded in a Cloze Flashcard. You can also have multiple clozes in the same bullet. Note, however, that each cloze will be independent. It is not currently possible to merge clozes prior to pasting them into RemNote.

Example:

{{Cloze 1}} and {{Cloze 2}}

## Adding Hints to Cloze Flashcards

When importing Cloze Flashcards, you can also include [hints](https://help.remnote.com/en/articles/9626898-mastering-flashcards-with-effective-hints) to provide additional context or guidance for each cloze. To add a hint, surround the hint text with ‎⁠`{({`⁠ and ‎⁠`})}`⁠. If you have multiple clozes, simply add a hint for each as needed.

Example:

{{Cloze 1}}{({Hint 1})} and {{Cloze 2}}{({Hint 2})}

[![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1599120715/2b7869711bb758d32784eea54881/CleanShot+2025-07-02+at+13_13_14%402x.png?expires=1772827200&signature=e56d4cb44cd96808f224c1f5e83562bb05fc55118c44d7ab35eb9d75619808a4&req=dSUuH8h8nYZeXPMW1HO4za2oGInV1gZb6xfYRgvlaadBiOuz3%2BaYjenn5bRh%0Ay86EAnPglCu8XnyoTg8%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1599120715/2b7869711bb758d32784eea54881/CleanShot+2025-07-02+at+13_13_14%402x.png?expires=1772827200&signature=e56d4cb44cd96808f224c1f5e83562bb05fc55118c44d7ab35eb9d75619808a4&req=dSUuH8h8nYZeXPMW1HO4za2oGInV1gZb6xfYRgvlaadBiOuz3%2BaYjenn5bRh%0Ay86EAnPglCu8XnyoTg8%3D%0A)

# Bullets and indentation and when pasting multiple lines

When pasting text with multiple lines, you can opt to use `-` (dashes) at the beginning of each line or not. These will be automatically converted to Rems with bullets when pasted into RemNote (this is especially useful when copying from markdown files).

[![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1259663150/130b29920474ef5937416348ee03/image.png?expires=1772827200&signature=ce63b7005ed0f8517339cc6a8f7c0a146d7896842cf6daa4e5fe992fc4e39a27&req=dSIiH894noBaWfMW1HO4zYd6wzKBddCWCCVPLgiiCPOgEafjbArzLSTwiKPg%0AXOtfiEkfUhvgCoUYZ4g%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1259663150/130b29920474ef5937416348ee03/image.png?expires=1772827200&signature=ce63b7005ed0f8517339cc6a8f7c0a146d7896842cf6daa4e5fe992fc4e39a27&req=dSIiH894noBaWfMW1HO4zYd6wzKBddCWCCVPLgiiCPOgEafjbArzLSTwiKPg%0AXOtfiEkfUhvgCoUYZ4g%3D%0A)

Nesting between bullet items will also be automatically recognized according to the number of spaces at the beginning of each line. The exact number of spaces used doesn't matter as long as it is consistent for each indentation level RemNote will understand how to interpret each line.

[![Example of how dashes can be used or not to text that has indentation will retain it when pasted on RemNote.](https://downloads.intercomcdn.com/i/o/akxf7g7x/1259670819/ce911ccda2982a8e06054899e35b/image.png?expires=1772827200&signature=3a1e98cdbd422a7f01b9af4121e75000d719ab282dcc1bae8623e1dc473951fd&req=dSIiH895nYleUPMW1HO4zWIzqcvFaNp8R3gyj4f8HojDrDRaWirnx8i0YATY%0A5ywLu83pkw9n59Hs8IM%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1259670819/ce911ccda2982a8e06054899e35b/image.png?expires=1772827200&signature=3a1e98cdbd422a7f01b9af4121e75000d719ab282dcc1bae8623e1dc473951fd&req=dSIiH895nYleUPMW1HO4zWIzqcvFaNp8R3gyj4f8HojDrDRaWirnx8i0YATY%0A5ywLu83pkw9n59Hs8IM%3D%0A)

# Multi-line flashcards

Use `>>>` to signify that the bullet is the front side of a Multi-Line Flashcard. All bullets nested under it will be considered Card Items.

Example:

[![Example of how text that when copied and pasted into RemNote will generate a multi-line flashcard.](https://downloads.intercomcdn.com/i/o/akxf7g7x/1259671313/7b0e12297d843e2f3241d2139c3c/image.png?expires=1772827200&signature=4cb7740fc0bdebc991833bd840c48dd1aae0aabf28ab5ec337705b2ab75761aa&req=dSIiH895nIJeWvMW1HO4zaUz6eFp1HO69Z%2FLa4d7kOxPhU70i8S8LMFOiGpB%0Aero9bGCRScnGPRBGuRc%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1259671313/7b0e12297d843e2f3241d2139c3c/image.png?expires=1772827200&signature=4cb7740fc0bdebc991833bd840c48dd1aae0aabf28ab5ec337705b2ab75761aa&req=dSIiH895nIJeWvMW1HO4zaUz6eFp1HO69Z%2FLa4d7kOxPhU70i8S8LMFOiGpB%0Aero9bGCRScnGPRBGuRc%3D%0A)

You can also use `<<<` to create a backward multi-line flashcard, and `<><` to create a two-way multi-line flashcard.

# List-answer flashcards

Use `>>1.` to signify that the bullet is the front side of a List-Answer Flashcard. The bullets nested under it will be considered List Items.

Example:

[![example of how text that when copied and pasted into RemNote will generate a list-answer flashcard.](https://downloads.intercomcdn.com/i/o/akxf7g7x/1259640312/03a40914299fc0f7514d362e3a3e/image.png?expires=1772827200&signature=efe32266595e9c3701b272264d33304357e94893504333f26b645987a7f5c115&req=dSIiH896nYJeW%2FMW1HO4za7DKAmsU3e7IoJbniEOHrQgA9czMAwb2PRrkUgD%0AsvsKLX61hMB%2B20nMZo4%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1259640312/03a40914299fc0f7514d362e3a3e/image.png?expires=1772827200&signature=efe32266595e9c3701b272264d33304357e94893504333f26b645987a7f5c115&req=dSIiH896nYJeW%2FMW1HO4za7DKAmsU3e7IoJbniEOHrQgA9czMAwb2PRrkUgD%0AsvsKLX61hMB%2B20nMZo4%3D%0A)

**Note:** The listed items will be numbered based on the order they are in the imported text. For instance, the example shown above will look like this after being imported to RemNote:

[![How the example text will look like in RemNote after being imported. A List-Answer Flashcard.](https://downloads.intercomcdn.com/i/o/1034724609/f89f303534bc7d6f729ef691/image.png?expires=1772827200&signature=4b88e083d5b8f67f23268a0582e5ba16ea9dc65160adc13e6689af09985c65ab&req=dSAkEs58mYdfUPMW1HO4zWrH6okOr21bNMnskbsxUnM68%2BKuzlq3FsAKE4BT%0AslmswD1J5uWD2exjJzo%3D%0A)](https://downloads.intercomcdn.com/i/o/1034724609/f89f303534bc7d6f729ef691/image.png?expires=1772827200&signature=4b88e083d5b8f67f23268a0582e5ba16ea9dc65160adc13e6689af09985c65ab&req=dSAkEs58mYdfUPMW1HO4zWrH6okOr21bNMnskbsxUnM68%2BKuzlq3FsAKE4BT%0AslmswD1J5uWD2exjJzo%3D%0A)

You can also use:

-   `<<1.` to create a backward list-answer flashcard
    
-   `<>1.` to create a two-way list-answer flashcard
    
-   `>-1.` To create a disabled list-answer flashcard
    

# Multiple-choice flashcards

Use `>>A)` to signify that the bullet is the front side of a multiple-choice flashcard. The bullets nested under it will be considered multiple-choice items. The first item will be set as the correct choice.

Example:

[![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1259642198/1627c1c91fdbc08c8f333dbd0fb3/image.png?expires=1772827200&signature=809e84960d1b5195736fe49610e4af774d29d1d73c53d060228ee97950bc3888&req=dSIiH896n4BWUfMW1HO4zSl%2B30wsyybrh99W28%2F%2FKUOg6jZ5i7dbMKOe6FkD%0A3cmbkV2BWrThpEAVC6k%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1259642198/1627c1c91fdbc08c8f333dbd0fb3/image.png?expires=1772827200&signature=809e84960d1b5195736fe49610e4af774d29d1d73c53d060228ee97950bc3888&req=dSIiH896n4BWUfMW1HO4zSl%2B30wsyybrh99W28%2F%2FKUOg6jZ5i7dbMKOe6FkD%0A3cmbkV2BWrThpEAVC6k%3D%0A)

**Note:** When importing multiple-choice flashcards, **the first option will always be the one considered the correct answer** (note that RemNote shuffles the order of the options when practicing the flashcard).

For instance, the example shown above will look like this after being imported to RemNote:

[![How the example text will look like in RemNote after being imported. A Multiple-Choice Flashcard.](https://downloads.intercomcdn.com/i/o/1034732502/09015b63fc47264b9f2abd12/image.png?expires=1772827200&signature=a568f45debfa8e93a132661a78b42af0ea02a33c1eac824b72808fba8081502e&req=dSAkEs59n4RfW%2FMW1HO4zevhDPPtcXPOtMs21ekCdIUp4k5Dkqkn1JQ8djCf%0AXhQPsd5aXhOzM8SaRQE%3D%0A)](https://downloads.intercomcdn.com/i/o/1034732502/09015b63fc47264b9f2abd12/image.png?expires=1772827200&signature=a568f45debfa8e93a132661a78b42af0ea02a33c1eac824b72808fba8081502e&req=dSAkEs59n4RfW%2FMW1HO4zevhDPPtcXPOtMs21ekCdIUp4k5Dkqkn1JQ8djCf%0AXhQPsd5aXhOzM8SaRQE%3D%0A)

You can also add extra information about each option in a nested bullet underneath. Multiple-choice flashcards show those nested bullets after answering the card.

Use `>-A)` to create a disabled multiple-choice flashcard.

# Adding the Extra Card Detail powerup

You can also include the **[Extra Card Detail PowerUp](https://help.remnote.com/en/articles/6751966-extra-card-detail-power-up)** in the bullets you are importing. To do this, write `#[[Extra Card Detail]]` in the appropriate bullets.

Example on a Basic Flashcard:

[![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1259643795/95e8faeb27a018df759a7f429400/image.png?expires=1772827200&signature=f7f3e765259ed5c26e9a63c780664dbbae7b71b6bd88d7cc7b706b403a9e5446&req=dSIiH896noZWXPMW1HO4zZ%2BBtgucch5drmm9l5ohGR5%2Bs%2FIBUZEp7lD0recY%0ANbBwMkKSgiC6NBuVNEI%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1259643795/95e8faeb27a018df759a7f429400/image.png?expires=1772827200&signature=f7f3e765259ed5c26e9a63c780664dbbae7b71b6bd88d7cc7b706b403a9e5446&req=dSIiH896noZWXPMW1HO4zZ%2BBtgucch5drmm9l5ohGR5%2Bs%2FIBUZEp7lD0recY%0ANbBwMkKSgiC6NBuVNEI%3D%0A)

Example on a Cloze flashcard:

[![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1259644081/23f004e5d8342eaed40ee809f183/image.png?expires=1772827200&signature=8ed66c816a5d73d3cac6744a26aa142a8e61e7e146fd427d892cd62b9fbeb409&req=dSIiH896mYFXWPMW1HO4zWJekkA6JVXQ%2BPMf4PYzVsxZem%2BCB5Q2I%2F7swXFw%0A00ph8kBTOx831ggsnuo%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1259644081/23f004e5d8342eaed40ee809f183/image.png?expires=1772827200&signature=8ed66c816a5d73d3cac6744a26aa142a8e61e7e146fd427d892cd62b9fbeb409&req=dSIiH896mYFXWPMW1HO4zWJekkA6JVXQ%2BPMf4PYzVsxZem%2BCB5Q2I%2F7swXFw%0A00ph8kBTOx831ggsnuo%3D%0A)

# Concept/Descriptor flashcards

You can also use special characters to import your flashcards using the [Concept-Descriptor Framework](https://help.remnote.com/en/articles/6026154-structuring-knowledge-with-the-concept-descriptor-framework).

As a general rule, Concept cards will use a `:` (colon) and Descriptors will use a `;` (semicolon) as the first character used to create their delimiters.

For **Basic Concept Flashcards** or **Basic Descriptor Flashcards,** use the following combinations of symbol characters:

**Forward Card**

**Backward Card**

**Two way Card**

**Disabled**

**Concept**

:>

:<

::

:-

**Descriptor**

;;

;<

;;<

;-

For **Multi-line Concept or Descriptor Flashcards,** use the following combinations of symbol characters:

**Forward Card**

**Backward Card**

**Concept**

;>>

:<<

**Descriptor**

;;>

;<<

For **List-Answers Concept or Descriptor Flashcards**, use the following combinations of characters:

**Forward Card**

**Backward Card**

**Two way Card**

**Disabled**

**Concept**

;>>1.

:<<1.

::1.

:-1.

**Descriptor**

;;>1.

;<<1.

;;<1.

;-1.

For **Multiple-Choice Concept or Descriptor Flashcards**, use the following combinations of characters:

**Forwards**

**Disabled**

**Concept**

;>>A)

:-A)

**Descriptor**

;;>A)

;-A)

* * *

Related Articles

[

Creating Flashcards

](https://help.remnote.com/en/articles/6025481-creating-flashcards)[

Importing from Anki

](https://help.remnote.com/en/articles/6751471-importing-from-anki)[

Switching from Anki to RemNote

](https://help.remnote.com/en/articles/8664083-switching-from-anki-to-remnote)[

Generating Flashcards with AI

](https://help.remnote.com/en/articles/10102901-generating-flashcards-with-ai)[

Generating Flashcards from Tables

](https://help.remnote.com/en/articles/13869879-generating-flashcards-from-tables)
<!-- source: https://help.remnote.com/en/articles/6751471-importing-from-anki -->
<!-- crawled: 20260306_142324 -->

# Importing from Anki

If you were previously or are currently an Anki user, you can import your flashcards and review history from Anki. You can also grab relevant shared decks from the [AnkiWeb shared decks page](https://ankiweb.net/shared/decks/) or a friend who uses Anki and use them in RemNote.

# Step 1: Export from Anki (if you don't already have an apkg)

1.  In Anki, click the gear icon next to the deck you want to export, then choose _Export_. (Or, to export your entire collection, choose _File > Export_.)
    
2.  _Export format:_ Select `.apkg`.
    
3.  _Include:_ Ensure the deck you'd like to export is selected.
    
4.  Check all of the checkboxes at the bottom: _Include scheduling information, Include deck presets, Include media, and Support Older Anki Versions_.
    
5.  Click _Export_ in the lower-right and save the .apkg file somewhere convenient.
    

[![](https://downloads.intercomcdn.com/i/o/1024308190/f5d215a85a5cec0120f15873/2024-04-17-09-39-42.gif?expires=1772827200&signature=6b2d8d699f2f3619b81fb805e80e54128429aec270c959eafa29c0e5c105b297&req=dSAlEsp%2BlYBWWfMW1HO4zU2MZC41T14xlEIgCGu1oskSKmqh0842AIFW4QBF%0ArfCkVZcZH%2BgdWrJolig%3D%0A)](https://downloads.intercomcdn.com/i/o/1024308190/f5d215a85a5cec0120f15873/2024-04-17-09-39-42.gif?expires=1772827200&signature=6b2d8d699f2f3619b81fb805e80e54128429aec270c959eafa29c0e5c105b297&req=dSAlEsp%2BlYBWWfMW1HO4zU2MZC41T14xlEIgCGu1oskSKmqh0842AIFW4QBF%0ArfCkVZcZH%2BgdWrJolig%3D%0A)

# Step 2: Import to RemNote

1.  In RemNote, click on your username in the upper-left corner and choose _Import_.
    
2.  Click the _Anki_ button, then _Select .apkg files_, and select the .apkg file you exported earlier.
    
3.  Deselect any decks you don’t want to import, if you exported several, and choose _Import Cards._
    

[![](https://downloads.intercomcdn.com/i/o/1020119042/891b4f86d2ccc667d1a0df83/2024-04-12-17-21-22.gif?expires=1772827200&signature=8cc8771ecafdf86602ca6407795cf86fbd5050b6b5a61bdb7ffaedf694b9b1f3&req=dSAlFsh%2FlIFbW%2FMW1HO4zTRhbjBUPlquL%2FOnviiCA4osRwcEOhmJtcPTJULI%0AMNumORAYOwBHq0dlelI%3D%0A)](https://downloads.intercomcdn.com/i/o/1020119042/891b4f86d2ccc667d1a0df83/2024-04-12-17-21-22.gif?expires=1772827200&signature=8cc8771ecafdf86602ca6407795cf86fbd5050b6b5a61bdb7ffaedf694b9b1f3&req=dSAlFsh%2FlIFbW%2FMW1HO4zTRhbjBUPlquL%2FOnviiCA4osRwcEOhmJtcPTJULI%0AMNumORAYOwBHq0dlelI%3D%0A)

If you exported a lot of cards, it may take as long as several minutes to finish importing them and converting them to RemNote format.

# Step 3 (Optional): Integrate your Anki cards into your Knowledge Base

The documents created from imported decks will be tagged _Anki Deck_. As you become more familiar with RemNote, or if you’re already an accomplished RemNote user, you may find that your imported cards could be strengthened by reorganizing them or adding [references](https://help.remnote.com/en/articles/6030714-rem-references) to other cards, taking advantage of the additional features of RemNote. If you have time, you can use this tag to find opportunities for improvement, or simply edit cards as you come across them in review and notice they could be improved.

# Limitations

We can successfully import most note types in Anki, including basic flashcards, cloze flashcards, image occlusion flashcards (both native Anki image occlusions and Image Occlusion Enhanced ones), and most custom note types.

Since RemNote has somewhat different goals than Anki and models flashcards differently, though, it is not 100% perfect. A few important limitations:

-   If you heavily used CSS on a note type in Anki, this isn't imported, and your cards will look different in RemNote. You might be able to use [custom CSS within RemNote](https://help.remnote.com/en/articles/8061994-custom-css) to replicate some of the formatting.
    
-   Custom JavaScript on note types is not supported in RemNote, so cards created from templates that rely on JavaScript may not display correctly in RemNote.
    
-   Cards that use some forms of TTS (those that are generated “on the fly” rather than generating audio files) won't read the text in RemNote.
    
-   Image occlusion note types need to retain their original names and field names to import successfully into RemNote. The vast majority of people will never change these (and you probably know if you've done so), but if you have, you may need to rename them within Anki first.
    
-   No more than 2,000 tags can be shown for selection in the importer due to performance constraints. The vast majority of decks and collections have far fewer, but a couple of well-known decks like the full AnKing have more. We pick the 2,000 most frequently used tags in the deck to show. If you need to limit to a tag that's not shown, you can do it like this:
    
    1.  Search for the notes you want in the Anki browser.
        
    2.  When your search looks right, select all the notes it finds (Ctrl+A, or Cmd+A on a Mac).
        
    3.  Choose _Notes > Export Notes._ Choose _Selected Notes_ for what to export, and create a new apkg as described in [Step 1](#h_46580217df).
        
    4.  Import this apkg into RemNote.
        
    

* * *

Related Articles

[

RemNote vs. Anki, SuperMemo, and Other Spaced-Repetition Tools

](https://help.remnote.com/en/articles/6025618-remnote-vs-anki-supermemo-and-other-spaced-repetition-tools)[

Notes on RemNote Importers

](https://help.remnote.com/en/articles/6330674-notes-on-remnote-importers)[

Importing Notes

](https://help.remnote.com/en/articles/7898005-importing-notes)[

Switching from Anki to RemNote

](https://help.remnote.com/en/articles/8664083-switching-from-anki-to-remnote)[

How to Import Flashcards from Text

](https://help.remnote.com/en/articles/9252072-how-to-import-flashcards-from-text)
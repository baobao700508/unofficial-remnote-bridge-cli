<!-- source: https://help.remnote.com/en/articles/7950982-setting-priorities-and-disabling-flashcards -->
<!-- crawled: 20260306_142324 -->

# Setting Priorities and Disabling Flashcards

RemNote allows you to build a permanent knowledge base that remembers everything perfectly forever, and keep whatever part of that knowledge base you want in your memory as well using flashcards. But practicing flashcards takes time, and studying things you don’t currently find highly relevant is boring and demotivating, so you probably don’t want to practice all of the flashcards in your knowledge base all the time.

Rather, some things you learn will be exciting and valuable throughout your life, while other things are useful only for one short period of time, or at several periods of your life with long stretches of time in between. And things that are currently useful might be either critical and fascinating, or merely nice to have. To help you manage these different kinds of memory goals, RemNote offers a rich set of priority and enablement tools.

# Document Priorities

The broadest way to control which flashcards are important is with _document priorities_. You can configure the priority of a document either within the [Flashcard Home](https://help.remnote.com/en/articles/7925835-the-flashcard-home) or from the _Priority_ option on the _Practice_ drop-down button within any document that has flashcards.

[![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1578455161/dd8c77918d172a544797ccd62093/CleanShot+2025-06-19+at+13_21_04%402x.png?expires=1772827200&signature=1461697d28379abbdebacaef69c317456ffabf5fcdc65b991a405008658f7d5b&req=dSUgHs17mIBZWPMW1HO4zVo0BHF2He3AkWtbNGLuIpYyHSPUnRc%2Bynf3F8Tg%0Am0%2BM9H4%2BhtxpaAurN2o%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1578455161/dd8c77918d172a544797ccd62093/CleanShot+2025-06-19+at+13_21_04%402x.png?expires=1772827200&signature=1461697d28379abbdebacaef69c317456ffabf5fcdc65b991a405008658f7d5b&req=dSUgHs17mIBZWPMW1HO4zVo0BHF2He3AkWtbNGLuIpYyHSPUnRc%2Bynf3F8Tg%0Am0%2BM9H4%2BhtxpaAurN2o%3D%0A)

There are five priority levels, which are applied to all flashcards within the document:

-   **Exam:** Material that will be on an upcoming exam you've told RemNote about. Exam cards are shown before all other cards. Learn more about [preparing for exams with RemNote](https://help.remnote.com/en/articles/9101991-preparing-for-an-exam).
    
-   **Active:** Material that you’re excited about and currently consider most important, but don't currently have an deadline for learning. You should aim to keep the number of exam and active cards due for review on a daily basis less than your [daily learning goal](https://help.remnote.com/en/articles/7950933-the-daily-learning-goal), so that you’ll always be able to give your active cards your full attention. Active cards appear in your global flashcard queue as soon as they become due, before all other types of cards.
    
-   **Maintaining:** Material that you still want to remember if possible, but is “nice to have” rather than critical – if you have more cards due than you can keep up with, it’s OK to let these slide a bit. Maintaining cards appear in your global flashcard queue once you’ve practiced all active cards that are currently due.
    
-   **Paused:** Material that you don’t want to practice currently, but might want to return to some day. Paused cards never appear in any queue (except in the paused document itself, if you specifically choose to practice it even though it's paused). However, the clock on their due schedules continues to run in the background, so RemNote will have an accurate idea of how well you can be expected to remember them if you unpause them later, and can help you effectively relearn them when the time comes.
    
-   **No Priority:** Material you haven’t yet assigned any priority. _No Priority_ cards appear after Maintaining cards in the global flashcard queue.
    

A priority applied to a document also applies to any flashcards that are shown within [portals](https://help.remnote.com/en/articles/6030742-portals) in that document (but not to any flashcards that are collapsed or hidden within the portal – just the ones you can see on-screen when you go to that document). If you need to pause a document without pausing cards within its portals, see _Disabling descendant cards_, below.

Because priorities are applied to documents and a flashcard can be part of more than one document, a single flashcard can have multiple priorities applied to it. In this case, RemNote determines the effective priority of a card using the following rules:

-   **No Priority** **always loses.** No Priority will only be the effective priority if no document the flashcard is in has any other priority.
    
-   **Exam** **always wins** against all other priorities except Paused, even if there is a closer document in the hierarchy with a lower priority (see the next point).
    
-   Otherwise, the status of the **closest document in the hierarchy that has a priority** is considered.
    
    -   If you have a card C in the document hierarchy A > B, and A is Maintaining and B is Active, C will be Active, because B is closer to C than A.
        
        [![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1578496341/42f2bce71090226a96e2d69d7983/CleanShot+2025-06-19+at+13_50_51%402x.png?expires=1772827200&signature=f5c6fbb8a0a00378cbf586e4247e1c3ad8eecc62bee1a3a3904b87fd178b8aa4&req=dSUgHs13m4JbWPMW1HO4zWsGkYqDbT2dELZq3IWg8hT4PrJuyz%2F3gFhrpy8U%0AZZ6a%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1578496341/42f2bce71090226a96e2d69d7983/CleanShot+2025-06-19+at+13_50_51%402x.png?expires=1772827200&signature=f5c6fbb8a0a00378cbf586e4247e1c3ad8eecc62bee1a3a3904b87fd178b8aa4&req=dSUgHs13m4JbWPMW1HO4zWsGkYqDbT2dELZq3IWg8hT4PrJuyz%2F3gFhrpy8U%0AZZ6a%0A)
        
    -   However, if A is Maintaining and B is No Priority, then C is Maintaining, because No Priority is ignored.
        
        [![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1578498769/1d5aa4789db215d0fd80629b0519/CleanShot+2025-06-19+at+13_52_32%402x.png?expires=1772827200&signature=7f796d68bb55d67dd1058f9974b70715857450b236691f89d50798503b039116&req=dSUgHs13lYZZUPMW1HO4zZe07Tp5lLpNQ3CoMgW2bkP7NOshEYTMtbzRaL7j%0ADQb0%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1578498769/1d5aa4789db215d0fd80629b0519/CleanShot+2025-06-19+at+13_52_32%402x.png?expires=1772827200&signature=7f796d68bb55d67dd1058f9974b70715857450b236691f89d50798503b039116&req=dSUgHs13lYZZUPMW1HO4zZe07Tp5lLpNQ3CoMgW2bkP7NOshEYTMtbzRaL7j%0ADQb0%0A)
        
    
-   If a flashcard is in more than one _hierarchy_ because it has been used in portals or as sources, the **highest priority** (Active > Maintaining > Paused) it would get from any of those placements is used.
    
    -   If a card C is Paused in document A and Maintaining in document D, C will be Maintaining.
        
        [![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1578514278/813014b2707bef2d0f9bb582ed0a/CleanShot+2025-06-19+at+14_02_46%402x.png?expires=1772827200&signature=f45461a17ddefcb204fb1c608c848a89ef0e16f45ed095e72846e0b89f21df65&req=dSUgHsx%2FmYNYUfMW1HO4zdLmg53CQRBvxJiC6X04qD5%2BL64RpQtUWectoqOP%0A8FdJ%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1578514278/813014b2707bef2d0f9bb582ed0a/CleanShot+2025-06-19+at+14_02_46%402x.png?expires=1772827200&signature=f45461a17ddefcb204fb1c608c848a89ef0e16f45ed095e72846e0b89f21df65&req=dSUgHsx%2FmYNYUfMW1HO4zdLmg53CQRBvxJiC6X04qD5%2BL64RpQtUWectoqOP%0A8FdJ%0A)
        
    -   If a card C is Active in document A and Maintaining in document D, C will be Active.
        
        [![](https://downloads.intercomcdn.com/i/o/akxf7g7x/1578518651/1a15c5d4acd19188f1d155e440e3/CleanShot+2025-06-19+at+14_06_21%402x.png?expires=1772827200&signature=b91be211839975bb8c04adf99f2bca11a35286217cd347fb501c53fc8f06907c&req=dSUgHsx%2FlYdaWPMW1HO4zQVVPVUFoaKfUMqrBQBgWQNZwh6QFUmpF7JyrTOk%0A1%2BHx%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/1578518651/1a15c5d4acd19188f1d155e440e3/CleanShot+2025-06-19+at+14_06_21%402x.png?expires=1772827200&signature=b91be211839975bb8c04adf99f2bca11a35286217cd347fb501c53fc8f06907c&req=dSUgHsx%2FlYdaWPMW1HO4zQVVPVUFoaKfUMqrBQBgWQNZwh6QFUmpF7JyrTOk%0A1%2BHx%0A)
        
    

# Disabling individual flashcards

You can get more precise control over which facts you want to remember by _disabling_ individual flashcards. A disabled flashcard stays in your notes but will never be shown during any study session – just like a card in a document with the _Paused_ priority.

Here are a few common reasons to disable an individual flashcard:

-   The flashcard is [unusually difficult, or poorly written](https://help.remnote.com/en/articles/7183408-dealing-with-leech-cards), and not worth the time to retain or fix at the moment.
    
-   You’re unsure the information on the card is correct, but don’t have the time to do the research to verify it at the moment.
    
-   You find some information is well expressed in your notes as flashcards (for instance, using the [Concept/Descriptor Framework](https://help.remnote.com/en/articles/6026154-structuring-knowledge-with-the-concept-descriptor-framework)), but have no interest in actually memorizing that information.
    
-   You want to be able to [share the flashcard with others](https://help.remnote.com/en/articles/7322908-how-can-i-create-flashcards-with-someone-else), but do not want to study it yourself.
    

There are three ways to disable a flashcard from the editor:

1.  **From the card preview**: Click on the flashcard's arrow to open its preview menu. Uncheck the _Enable Cards_ box in the bottom-right corner to disable it. The arrow in your notes will change to an em-dash (flat line), indicating the card is disabled. To re-enable it, tick the box again.
    
    [![](https://downloads.intercomcdn.com/i/o/1150431197/1e7c67f100a012c0fbe0783a/CleanShot+2024-08-19+at+12_30_35%402x.png?expires=1772827200&signature=1ebf5870264505b1bd11bd9657f4f822e1f7225c63eddfbf7f20558c37cd9a8a&req=dSEiFs19nIBWXvMW1HO4zc%2BOWArddC7mAfuNIiNr3LIujOZuvigkQ2Ef%2BRpv%0AsCGK%0A)](https://downloads.intercomcdn.com/i/o/1150431197/1e7c67f100a012c0fbe0783a/CleanShot+2024-08-19+at+12_30_35%402x.png?expires=1772827200&signature=1ebf5870264505b1bd11bd9657f4f822e1f7225c63eddfbf7f20558c37cd9a8a&req=dSEiFs19nIBWXvMW1HO4zc%2BOWArddC7mAfuNIiNr3LIujOZuvigkQ2Ef%2BRpv%0AsCGK%0A)
    
2.  **With the keyboard shortcut:** Press Ctrl+Alt+F (Cmd+Opt+F on a Mac) to toggle the flashcard between enabled or disabled.
    
3.  **By pressing a direction key**: Put your cursor immediately after the flashcard arrow and type a hyphen (-). The arrow will change to an em-dash (—). To re-enable the card, type `<`, `>`, or both, depending on what direction you want it to be enabled in.
    
    [![](https://downloads.intercomcdn.com/i/o/705568763/1957c2b0f51fa9d8d46ff658/Peek+2023-04-04+12-32.gif?expires=1772827200&signature=28f6be906f6a358af80dfd488b14a291c366835aefaa5b066839123dd7648a8f&req=cyAiE892modcFb4f3HP0gHfn%2F6V92%2F7R7Rta3yqTB2aSTZPNrYK95Gg7w1Xf%0Azyw%3D%0A)](https://downloads.intercomcdn.com/i/o/705568763/1957c2b0f51fa9d8d46ff658/Peek+2023-04-04+12-32.gif?expires=1772827200&signature=28f6be906f6a358af80dfd488b14a291c366835aefaa5b066839123dd7648a8f&req=cyAiE892modcFb4f3HP0gHfn%2F6V92%2F7R7Rta3yqTB2aSTZPNrYK95Gg7w1Xf%0Azyw%3D%0A)
    

You can also disable a flashcard while reviewing it: choose _Disable this card_ or _Disable all N cards from this Rem_ from the **…** menu, or press `B` or `F`, respectively.

[![](https://downloads.intercomcdn.com/i/o/1150448005/6921f52b1f18abb4ed86cecb/CleanShot+2024-08-19+at+12_49_48%402x.png?expires=1772827200&signature=e7e14ace9972626204acd52e0894ae976a1fb7104d9461acd25f1dda074a21fd&req=dSEiFs16lYFfXPMW1HO4zbEnqVZVp8sbuhQB1LKbq4RDqGIBfvBmvb5DVxwI%0A3nJL3lNP9yhzcbwfx2Q%3D%0A)](https://downloads.intercomcdn.com/i/o/1150448005/6921f52b1f18abb4ed86cecb/CleanShot+2024-08-19+at+12_49_48%402x.png?expires=1772827200&signature=e7e14ace9972626204acd52e0894ae976a1fb7104d9461acd25f1dda074a21fd&req=dSEiFs16lYFfXPMW1HO4zbEnqVZVp8sbuhQB1LKbq4RDqGIBfvBmvb5DVxwI%0A3nJL3lNP9yhzcbwfx2Q%3D%0A)

## Disabling multiple flashcards

To disable all flashcards from multiple Rems at once, highlight all the Rems and type `/practice` or `/fp` (“_f_lashcard _p_ractice”), then select _Practice Flashcard Bidirectionally_ from the omnibar to toggle off practice in both directions. To re-enable them, type `/fp` and select _Practice Flashcard Bidirectionally_ again (this will enable whichever directions the card was enabled in before).

# Disabling descendant cards

Instead of setting a document to a priority of _Paused_, you can temporarily disable all flashcards in a tree of Rems using the _Disable Descendant Cards_ [powerup](https://help.remnote.com/en/articles/7897630-powerups).

In many cases, these two methods of disabling a Rem have exactly the same effect. But there are two subtle differences:

-   _Disable Descendant Cards_ can be applied to any Rem, not just a document, and will not cause that Rem to appear in the Flashcard Home’s list of paused documents when it’s applied. For groups of flashcards smaller than the scope of a typical document, for which the additional overhead of tracking it as a document doesn’t make sense, this may be preferable.  
    ​
    
-   _Disable Descendant Cards_ does not disable flashcards that are in portals, while _Paused_ does. In some cases, you might prefer the disabled status not to be applied to flashcards in portals, so you can use _Disable Descendant Cards_ instead.  
    ​  
    If you’re having trouble understanding why flashcards in portals are normally paused, suppose you’re taking a biology class, and while you’re taking notes on a lecture, you create a top-level Rem called _DNA_ and add it to your lecture notes in a portal. If you later decide to pause your biology class because you don’t expect to think about biology much for a few months, you probably want any flashcards you made on DNA to be paused, too; it would be annoying if you had to go to every top-level concept you created during your biology class and pause it individually.  
    ​  
    Note that if you had also portaled _DNA_ into another document that is Active or Maintaining (say, a document about the process of scientific discovery), the cards in DNA would not be paused but would instead take the Active or Maintaining priority instead, since the highest priority of any document a flashcard is included in is always used.
    

To apply this power-up, click on the document title or the topmost Rem you want to disable flashcards from, then type `/ddc` and select _Disable Descendant Cards_. To re-enable, repeat the same steps, or remove the _Disable Descendant Cards_ power-up tag from the document.

_Note:_ If the Disable Descendant Cards tag is applied to some Rems, you cannot re-enable descendant cards using the method described in _Disabling Individual Flashcards_.

* * *

Related Articles

[

Practicing Specific Flashcards

](https://help.remnote.com/en/articles/6904503-practicing-specific-flashcards)[

Resetting Flashcard Scheduling

](https://help.remnote.com/en/articles/7230389-resetting-flashcard-scheduling)[

Flashcard Basics

](https://help.remnote.com/en/articles/8663109-flashcard-basics)[

How does RemNote decide what flashcards are part of a document?

](https://help.remnote.com/en/articles/8892109-how-does-remnote-decide-what-flashcards-are-part-of-a-document)[

Organizing Your School Notes

](https://help.remnote.com/en/articles/13770762-organizing-your-school-notes)
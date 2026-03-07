<!-- source: https://help.remnote.com/en/articles/9124137-the-fsrs-spaced-repetition-algorithm -->
<!-- crawled: 20260306_142324 -->

# The FSRS Spaced Repetition Algorithm

In addition to the default [Anki SM-2](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm) scheduling algorithm, RemNote supports the new [FSRS](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm) (Free Spaced Repetition Scheduler) algorithm. FSRS was developed by Jarrett Ye, made available for some time as a plugin in RemNote, and has now been incorporated directly into RemNote.

FSRS is somewhat more difficult to understand than Anki SM-2, and is not as customizable, but in return it schedules cards substantially more accurately. In general, you can expect to do **20–30% fewer reviews** to achieve the same level of knowledge retention when using FSRS.

**FSRS is a beta feature.** It may become the default scheduler in the future, but for now you need to manually enable it, and there may be some bugs left, so we'd recommend not using it on critical cards until we've have had more time to verify that it works well.

We're currently using **FSRS version 6**.

# Enabling FSRS

You can switch to scheduling with FSRS for all of your flashcards or for only some of them. Start by going to _Settings > Custom Schedulers_, then:

-   To enable FSRS for **all cards**, click the pencil icon next to the _Global Scheduler_.
    
-   To enable FSRS for **only some cards**, click _Create Scheduler_, then edit that scheduler. After configuring the new scheduler, you'll select the scheduler in certain documents or folders; see [Custom Schedulers](https://help.remnote.com/en/articles/6958056-custom-schedulers) for details.
    

Inside the scheduler settings, select a _Scheduler Type_ of _FSRS (Alpha)_:

[![](https://downloads.intercomcdn.com/i/o/1005759994/07c67489d72d47c3c18ada54/2024-03-28-17-02-07%402x.png?expires=1772827200&signature=59550298cfaba9cf70d472d30a1efadf439cc858fc5f08aed0f9b1f292caccad&req=dSAnE857lIhWXfMW1HO4zZpNqN52nZWvM5bsENepmMH6q3FL4Fn2LK5zhNiy%0AXYaSV2dfEYOCNpMajm8%3D%0A)](https://downloads.intercomcdn.com/i/o/1005759994/07c67489d72d47c3c18ada54/2024-03-28-17-02-07%402x.png?expires=1772827200&signature=59550298cfaba9cf70d472d30a1efadf439cc858fc5f08aed0f9b1f292caccad&req=dSAnE857lIhWXfMW1HO4zZpNqN52nZWvM5bsENepmMH6q3FL4Fn2LK5zhNiy%0AXYaSV2dfEYOCNpMajm8%3D%0A)

You can customize the parameters lower down if you wish. Note that FSRS has many fewer user-customizable parameters than SM-2. This is because, in SM-2, to get optimal retention you have to figure out the ideal values yourself, but in FSRS, the algorithm can figure out the right values by itself based on your past study history (see the following section).

# Optimizing FSRS Parameters

**Note:** Don't fret about using optimization exactly right – it has only a small impact on your study efficiency, and never optimizing at all and just sticking with the default weights would be a perfectly reasonable choice.

The **weights** parameter shown in Custom Schedulers is actually 17 different parameters combined into one, which collectively control the rate at which intervals and difficulties change as you review. They're combined because they are difficult to interpret and should normally not be changed by humans. Instead, you can either use the default parameters (which are trained on a dataset including millions of reviews and should be excellent already right out of the box) or run the _optimizer_ to calculate new weights based on your past reviews.

What does the optimizer do? The details are complex and quite technical, but in a nutshell, FSRS will work through your study history on every card and calculate what values of the parameters would have, collectively, yielded the most efficient results had they been used from the start. Then it will change the weights to actually use these values for future reviews, assuming that the way your memory will behave on those future reviews will be similar to past ones.

To use the optimizer, click the _Auto train weights on your knowledge base_ button in the scheduler settings (see the [Enabling FSRS](#h_7fe8d996f9) section above for where to find these). RemNote will run the optimizer on your review history and replace the values in the Weights textbox accordingly.

Before optimizing, you should do at least 1,000 reviews with the default weights – until you have plenty of data for the optimizer to work with, the default weights will be more effective than ones based on your study history. RemNote will warn you if you try to train with fewer reviews.

# How does FSRS work?

At its heart, FSRS is actually quite similar to SM-2: it uses simple arithmetic to calculate next intervals and difficulties for each card. As such, if you have no background in spaced repetition algorithms, you can get a good idea of the general process involved by [reading about how SM-2 works](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm). However, in FSRS, both the formulas involved and the process used to arrive at the ”magic numbers” and parameters are more complex. Together, they require some mathematical background and some concentrated effort to fully understand. If you're interested in diving into the details, we recommend checking out the following guides:

-   [Spaced Repetition Algorithm: A Three-Day Journal from Novice to Expert](https://github.com/open-spaced-repetition/fsrs4anki/wiki/Spaced-Repetition-Algorithm:-A-Three%E2%80%90Day-Journey-from-Novice-to-Expert) (detailed primer)
    
-   [FSRS: The Algorithm](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm) (quick reference)
    

* * *

Related Articles

[

RemNote vs. Anki, SuperMemo, and Other Spaced-Repetition Tools

](https://help.remnote.com/en/articles/6025618-remnote-vs-anki-supermemo-and-other-spaced-repetition-tools)[

The Anki SM-2 Spaced Repetition Algorithm

](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm)[

Custom Schedulers

](https://help.remnote.com/en/articles/6958056-custom-schedulers)[

Flashcard Statistics

](https://help.remnote.com/en/articles/7970392-flashcard-statistics)[

Understanding Spaced Repetition

](https://help.remnote.com/en/articles/9337171-understanding-spaced-repetition)
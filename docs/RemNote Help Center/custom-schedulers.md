<!-- source: https://help.remnote.com/en/articles/6958056-custom-schedulers -->
<!-- crawled: 20260306_142324 -->

# Custom Schedulers

RemNote schedules flashcards for practice using one of several spaced-repetition algorithms. The default settings are suitable for most users studying most kinds of flashcards, but experienced users may find it helpful to adjust the algorithm used for all cards or certain groups of cards, as well as the parameters of these algorithms.

**We do not recommend configuring custom schedulers until you are familiar with how RemNote works** and have been studying flashcards for several months, and you should under no circumstances change settings you do not fully understand. It's easy to make your performance worse rather than better by configuring custom schedulers!

If you're new to this, start instead by learning the [basics of spaced repetition](https://help.remnote.com/en/articles/6022755-basics-of-spaced-repetition), how to [prioritize what you want to learn](https://help.remnote.com/en/articles/7950982-setting-priorities-and-disabling-flashcards), and how to [set a daily learning goal](https://help.remnote.com/en/articles/7950933-the-daily-learning-goal) to stay on track with efficient study!

## Configuring and assigning schedulers

Each set of scheduling settings (chosen algorithm and parameters) that you define is called a _scheduler_. One special scheduler is called the _Global Default Scheduler_ and will be applied to every flashcard that doesn't have a different scheduler assigned.

In addition, you can create other schedulers which are assigned to specific documents or folders. When deciding which scheduler to use for a particular flashcard, RemNote will check the Rem the card is generated from for a custom scheduler, then its parent, then its parent, and so on until it finds a scheduler, or until it reaches a [top-level Rem](https://help.remnote.com/en/articles/8196578-outlines-and-terminology) that has no scheduler (in which case the Global Default Scheduler will be used).

Schedulers can be created and configured in _Settings > Schedulers_. To update a scheduler, click the pencil icon to its right. You can read more about each scheduler in the [Scheduling algorithms](#h_c6e99513bd) section below.

[![](https://downloads.intercomcdn.com/i/o/akxf7g7x/2081867548/30f5289c5882e1d649730e6c7542/CleanShot+2026-02-19+at+14_09_30%402x.png?expires=1772827200&signature=d255bc1954e800b0974e4e28f576b2bdd5893923f07b80a515c8532d60ca6894&req=diAvF8F4moRbUfMW1HO4zXtl6ipIIs0cRWfNAJgKPJmDwWdcsf%2FgR6TbSIRP%0ALnsc4uN5M9zFh364Wa4%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/2081867548/30f5289c5882e1d649730e6c7542/CleanShot+2026-02-19+at+14_09_30%402x.png?expires=1772827200&signature=d255bc1954e800b0974e4e28f576b2bdd5893923f07b80a515c8532d60ca6894&req=diAvF8F4moRbUfMW1HO4zXtl6ipIIs0cRWfNAJgKPJmDwWdcsf%2FgR6TbSIRP%0ALnsc4uN5M9zFh364Wa4%3D%0A)

To assign a document and its children to a particular custom scheduler, you can use one of the following methods:

-   **`/`\-menu or [omnibar](https://help.remnote.com/en/articles/7852647-using-the-omnibar)**: Click on the document title, then type `/` or press Ctrl+K (Cmd+K on a Mac), and start typing `Scheduler`. Select the _Customize Spaced Repetition Scheduler_ command from the menu and choose the scheduler you'd like to use.
    
-   **Schedulers Page:** Navigate directly to the scheduler's page by going to _Settings > Schedulers_ and selecting the specific scheduler you'd like to use. From there, you can assign it to specific documents or folders by clicking “Add Documents or Folders.”
    

[![](https://downloads.intercomcdn.com/i/o/akxf7g7x/2081886718/56b71712b6cfba15292f91c4edaa/CleanShot+2026-02-19+at+14_18_02%402x.png?expires=1772827200&signature=22b5479f76ea1cb6f21691972eb97602de1a54cbb9008ff63523e7ed4da25820&req=diAvF8F2m4ZeUfMW1HO4za3iuk9imfZaCjN%2BJYx5Bxmt4ip%2F1kN33ZwfFJF0%0ADH3iFUhSFSZ4py3dHxs%3D%0A)](https://downloads.intercomcdn.com/i/o/akxf7g7x/2081886718/56b71712b6cfba15292f91c4edaa/CleanShot+2026-02-19+at+14_18_02%402x.png?expires=1772827200&signature=22b5479f76ea1cb6f21691972eb97602de1a54cbb9008ff63523e7ed4da25820&req=diAvF8F2m4ZeUfMW1HO4za3iuk9imfZaCjN%2BJYx5Bxmt4ip%2F1kN33ZwfFJF0%0ADH3iFUhSFSZ4py3dHxs%3D%0A)

## Scheduling algorithms

RemNote ships with several scheduling algorithms:

-   **Exponential**: A simple proprietary algorithm, used by default in early versions of RemNote. Cards go through a series of fixed, exponentially increasing steps.
    

**Tip:** This scheduler can't be customized, and we no longer recommend using it unless you already have cards scheduled using it and don't want to switch them; the other options are superior in all situations.

-   **Anki SM-2**: An algorithm based on [Anki](https://apps.ankiweb.net)'s default algorithm, which in turn is based on an early version of SuperMemo's default algorithm.
    
    -   Cards have an _interval_ (time between the last two reviews) and an _ease_ (representing how hard you've found the card in the past), and the next study time is calculated based on these values.
        
    -   Anki SM**‑**2 has many parameters and is highly customizable; the settings screen includes an explanation of what each parameter does.
        
    -   You can also read a detailed explanation of how this algorithm works in [this article](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm).
        
    
-   **FSRS**: A machine-learning-based algorithm developed by Jarrett Ye.
    
    -   Cards have a _difficulty_ (similar to ease) and _stability_ (similar to interval), and the next study time is calculated based on these values.
        
    -   FSRS has only one user-customizable parameter, the percentage of cards you want to remember at review time, but this isn't necessarily a disadvantage – rather than having to guess at good parameters, you can automatically optimize it based on your review history.
        
    -   Find more details in the [FSRS article](https://help.remnote.com/en/articles/9124137-the-fsrs-spaced-repetition-algorithm).
        
    

Plugins that add additional scheduling algorithms are available, or you can [write your own](https://plugins.remnote.com).

* * *

Related Articles

[

The Anki SM-2 Spaced Repetition Algorithm

](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm)[

Practicing Specific Flashcards

](https://help.remnote.com/en/articles/6904503-practicing-specific-flashcards)[

Resetting Flashcard Scheduling

](https://help.remnote.com/en/articles/7230389-resetting-flashcard-scheduling)[

Flashcard Statistics

](https://help.remnote.com/en/articles/7970392-flashcard-statistics)[

The FSRS Spaced Repetition Algorithm

](https://help.remnote.com/en/articles/9124137-the-fsrs-spaced-repetition-algorithm)
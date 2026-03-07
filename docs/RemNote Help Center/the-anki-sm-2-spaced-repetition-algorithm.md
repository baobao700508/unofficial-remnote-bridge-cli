<!-- source: https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm -->
<!-- crawled: 20260306_142324 -->

# The Anki SM-2 Spaced Repetition Algorithm

RemNote's default flashcard scheduler is called **Anki SM-2**. As the name suggests, it is based on the scheduling algorithm used by the popular flashcard software [Anki](https://apps.ankiweb.net), with minor changes intended to maximize your long-term learning.

This article explains the technical details of the Anki SM-2 algorithm. Some related articles:

-   For information on how spaced repetition works in general, see [Understanding Spaced Repetition](https://help.remnote.com/en/articles/9337171-understanding-spaced-repetition). **You should read that article before reading this one** – the details here will be difficult to follow if you lack an overall picture of how spaced repetition works.
    
-   For information on how to change the scheduler used for particular flashcards or an entire Knowledge Base, see our article on [Custom Schedulers](https://help.remnote.com/en/articles/6958056-custom-schedulers).
    
-   For a first-principles explanation of why the SM-2 algorithm was built this way, check out [Spaced Repetition from the Ground Up](https://controlaltbackspace.org/spacing-algorithm/) (this post is not written by RemNote and is not specific to RemNote's implementation of SM-2).
    

Throughout the remainder of this article, phrases in _italic type_ refer to scheduler parameters found in the “Custom Schedulers” section of RemNote's settings.

# **Learning Phase**

The initial Learning Phase is designed to help you quickly internalize new ideas. In the Learning Phase, flashcards pass through a series of steps of a fixed length, determined by the _Initial Learning Phase Fixed Steps_ parameter. (An **interval** is the number of days between consecutive reviews of a card.) For example, if you enter `30m,2h,2d` in this field, the card will proceed through steps of 30 minutes, 2 hours, and 2 days.

During this phase:

-   Pressing **Forgot** returns the card to the first step.
    
-   Pressing **Partially recalled** keeps the card on the same step and waits half the time to the next step before showing it again (so if the next step is 2 days, it will be shown again in 1 day, and be considered for advancement to the 2-days step at that time).
    
-   Pressing **Recalled with effort** moves the card to the next step. If the next step is the last one, the card enters the Exponential Phase with a first interval calculated by applying the Exponential Phase rules to the current fixed-step interval.
    
-   Pressing **Easily recalled** immediately sends the card to the Exponential Phase with an initial interval of _Easy Interval on Exiting Learning/Relearning Mode_.
    

**Note:** When you reach the end of your queue, cards in the Learning Phase may be shown for practice slightly before they become due (by default, up to 15 minutes early). To understand why, consider what happens if you finish your queue 5 seconds before a difficult card in the Learning Phase, with a current interval of 10 minutes, becomes due. You likely will not return to your queue for at least several hours, maybe not until the next day, since you expect very few cards to become due within that timeframe.

It is clearly less bad to see a card that you’re only barely remembering 5 seconds early than to see it 1 day late, so RemNote goes ahead and shows it early. You can customize the amount of time RemNote will allow learning cards to be displayed early using the _Learn Ahead Limit_ option in _Settings > Flashcards_.

# **Exponential Phase**

The Exponential Phase is the main study phase where cards spend most of their lives. Intervals in this phase increase exponentially (by multiplying the previous interval by some number). The number multiplied by is called the **Interval Factor**, and it's calculated for each card every time you practice it.

The Interval Factor is determined by two figures: the card's **ease** (a measure of how difficult you've found the card in the past), and the **rating button** you select (Forgot, Partially Recalled, Recalled with Effort, or Easily Recalled). Each card's ease begins at the _Starting Ease_ setting (230% by default) and is updated every time you practice the card. In other flashcard apps, the ease is sometimes called the _E-Factor_.

The ease and Interval Factor are calculated in the Exponential Phase as follows:

-   Pressing **Forgot** uses an Interval Factor of _Lapse Interval Multiplier_ (this is less than 1, since the card's interval should decrease when you forget it; it's 0.1 by default) and decreases the ease by 20 percentage points. In addition, the card is sent to the Relearning Phase (described later).
    
-   Pressing **Partially recalled** uses an Interval Factor of 1.2 and decreases the ease by 15 percentage points.
    
-   Pressing **Recalled with effort** uses an Interval Factor equal to the current ease. The ease is unchanged.
    
-   Pressing **Easily recalled** uses an Interval Factor of (Ease \* _Easy Bonus_) and increases the ease by 15 percentage points. _Easy Bonus_ is 1.3 by default.
    

The Interval Factor is then adjusted further:

-   The Interval Factor is multiplied by _Interval Multiplier_ (the default value of this setting is 1, i.e., no change to the calculated value). You can use this setting to make all intervals somewhat wider or narrower than default.
    
-   A small amount of random noise is added to the interval; that is, the interval will randomly become slightly longer or shorter. This prevents cards that were introduced on the same day from getting “stuck together” and always appearing on the same day, which would make them artificially easy to remember.
    

The Interval Factor is then used to calculate the card's next interval. In most cases, the next interval is simply the current interval times the Interval Factor. However, if the card is being reviewed late (after the date it would optimally be reviewed on), and you answered something other than Forgot, a bonus of (Days Late / Hardness Divider) is added to the card's current interval before multiplying. The Hardness Divider is 4 for Partially Recalled, 2 for Recalled with Effort, and 1 for Easily Recalled.

Why include this bonus? Suppose RemNote thinks you needed to review the card on some particular day, but actually you don't review it until 10 days later, and you still remember the answer. This means you likely know the card better than RemNote originally thought you did (see also the explanation of [stability](https://help.remnote.com/en/articles/9337171-understanding-spaced-repetition#h_686314f7a1)), and the better you know a card, the longer you can wait between reviews, so the interval should grow somewhat more than it would have otherwise (or a lot more, if it's been a very long time). The Hardness Divider adjusts this amount of increase for how well you believe you still remembered the card; if you really struggled to still remember it, it makes sense for the increase to be less than if you still found it trivially easy.

A card's ease can in no circumstances be reduced to less than 130%; if the calculations discussed above would reduce it to less than 130%, the ease is set to 130% instead. Experience has shown that if a card would naturally require an ease of less than 130% to remember reliably, it is [too difficult for effective spaced-repetition study](https://help.remnote.com/en/articles/7183408-dealing-with-leech-cards) and should instead be improved in some way (by writing it more clearly, developing a mnemonic, or some similar approach). Showing the card more often merely leads to frustration, with little to no benefit to memory.

# **Relearning Phase**

When you forget a card during the Exponential Phase, it enters the Relearning Phase. This phase works very similarly to the initial [Learning Phase](#h_0986c928e1); cards proceed through a series of fixed steps and return to the Exponential Phase when these fixed steps are complete, or when you press Easy.

The main difference in the Relearning Phase is that, rather than calculating the card's initial interval in the Exponential Phase based on the last review of learning/relearning, the card's last interval during its previous sojourn in the Exponential Phase is used. The new interval will be equal to this last interval times the _Lapse Interval Multiplier_ (by default 0.1, so that the new interval will be a tenth of the old one).

* * *

Related Articles

[

Getting Started with Spaced Repetition

](https://help.remnote.com/en/articles/6022755-getting-started-with-spaced-repetition)[

Custom Schedulers

](https://help.remnote.com/en/articles/6958056-custom-schedulers)[

Flashcard Statistics

](https://help.remnote.com/en/articles/7970392-flashcard-statistics)[

The FSRS Spaced Repetition Algorithm

](https://help.remnote.com/en/articles/9124137-the-fsrs-spaced-repetition-algorithm)[

Understanding Spaced Repetition

](https://help.remnote.com/en/articles/9337171-understanding-spaced-repetition)
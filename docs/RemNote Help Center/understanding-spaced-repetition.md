<!-- source: https://help.remnote.com/en/articles/9337171-understanding-spaced-repetition -->
<!-- crawled: 20260306_142324 -->

# Understanding Spaced Repetition

RemNote's flashcards rely on **spaced repetition** and the [spacing effect](https://en.wikipedia.org/wiki/Spacing_effect) underlying it. We know that spaced-repetition flashcards consistently outperform almost every other learning technique. But why is that? And how exactly does a spaced-repetition tool decide when to show you cards?

This article explains the principles and theory of spaced repetition. While you may get more out of RemNote if you understand them, you don't need to read this article to get started. Feel free to skip to [Getting Started with Spaced Repetition](https://help.remnote.com/en/articles/6022755-basics-of-spaced-repetition) to start making spaced repetition work for you in RemNote!

# Why flashcards?

For effective spaced-repetition study, we need to be able to split the information we want to learn into small chunks, so our spaced-repetition tool can ask us to review each chunk at an ideal time. If we make the chunks too big (say, an entire chapter of a book), we won’t be able to provide precise feedback about what we forgot or remembered, so homing in on the perfect time to review each fact will become impossible.

In RemNote, we solve this problem by breaking down what we want to learn into **flashcards** – maybe by [writing question-answer pairs](https://help.remnote.com/en/articles/8663109-flashcard-basics) directly into a document, or using the [Concept/Descriptor Framework](https://help.remnote.com/en/articles/6026154-structuring-knowledge-with-the-concept-descriptor-framework), or copying them from a PDF or PowerPoint displayed in the [RemNote Reader](https://help.remnote.com/en/articles/6690975-annotating-files-with-the-remnote-reader), or AI-generating them. Whatever method you use, you’ll end up with a series of flashcards you want to remember the answers to. They might look something like this on the front and the back:

[![](https://downloads.intercomcdn.com/i/o/1070491609/2de112a9f0ad9ecce6bfa39e/2024-06-03-16-15-32%402x.png?expires=1772827200&signature=38227fee04c84222e76cf593f2a3c3a2bfbb799d2b3b468525801028b8a87c60&req=dSAgFs13nIdfUPMW1HO4zU6gi7hbOMcHm0lxsrMWnmxxJ0rpWsra0stSjlLs%0AxLZW9uLSG8BWTNPzg5Q%3D%0A)](https://downloads.intercomcdn.com/i/o/1070491609/2de112a9f0ad9ecce6bfa39e/2024-06-03-16-15-32%402x.png?expires=1772827200&signature=38227fee04c84222e76cf593f2a3c3a2bfbb799d2b3b468525801028b8a87c60&req=dSAgFs13nIdfUPMW1HO4zU6gi7hbOMcHm0lxsrMWnmxxJ0rpWsra0stSjlLs%0AxLZW9uLSG8BWTNPzg5Q%3D%0A)

[![](https://downloads.intercomcdn.com/i/o/1070490990/4840da77eadf7530e9587ad4/2024-06-03-16-14-44%402x.png?expires=1772827200&signature=d1970f80fdf289b8d8a1c2885f0ada03b4ea52116aacf69114e0a88696a466f6&req=dSAgFs13nYhWWfMW1HO4zVnsVT5yQmI4Tk8qDppnNM6ihEIubY%2Fi3igMvpso%0AO77pQ1V4sDk%2Bz5Y1VYI%3D%0A)](https://downloads.intercomcdn.com/i/o/1070490990/4840da77eadf7530e9587ad4/2024-06-03-16-14-44%402x.png?expires=1772827200&signature=d1970f80fdf289b8d8a1c2885f0ada03b4ea52116aacf69114e0a88696a466f6&req=dSAgFs13nYhWWfMW1HO4zVnsVT5yQmI4Tk8qDppnNM6ihEIubY%2Fi3igMvpso%0AO77pQ1V4sDk%2Bz5Y1VYI%3D%0A)

# The forgetting curve

Now we’ve understood our material and expressed the things we want to remember as flashcards. That’s already a great help to learning. But if we want to keep remembering those things until our exams, or better yet, months or years later when they’d be useful in real life, when and how often should we review them?

To answer this question, cognitive psychologists have measured how quickly people forget what they've learned. When we plot the likelihood that someone successfully recalls something (y-axis) against the amount of time since they last recalled it (x-axis), we get a **forgetting curve** that looks something like the red (leftmost) line below.

[![](https://remnote.intercom-attachments-1.com/i/o/473735671/4b13b5e12b7b835b57b1110e/2000px-ForgettingCurve.svg.png?expires=1772827200&signature=e28c5a3dcf79581a920798ad73fb89d38345ec8208a4ac2f3cee4b34e0665d4a&req=cCckEcp7m4ZeFb4f3HP0gA0bgzPBQTzytGKVZKRDNtQvSrxgMsX4U%2F7G0oSj%0AbtxeFgrfCJd9vuTDDw%3D%3D%0A)](https://remnote.intercom-attachments-1.com/i/o/473735671/4b13b5e12b7b835b57b1110e/2000px-ForgettingCurve.svg.png?expires=1772827200&signature=e28c5a3dcf79581a920798ad73fb89d38345ec8208a4ac2f3cee4b34e0665d4a&req=cCckEcp7m4ZeFb4f3HP0gA0bgzPBQTzytGKVZKRDNtQvSrxgMsX4U%2F7G0oSj%0AbtxeFgrfCJd9vuTDDw%3D%3D%0A)

The forgetting curve has two key properties you should remember:

1.  After you learn a fact, your memory of it **decays exponentially**. That is, the chance that you remember it drops off steeply at first, then more slowly later. Because the initial drop is steep, you must review fairly soon after initially learning something to have a good chance of holding onto it.  
    ​
    
2.  Reviewing a fact at the right time not only prevents you from forgetting it soon after, but also **decreases the future rate of exponential decay** – the curve becomes shallower, and on average, you’ll now remember the information for longer than you would have if you’d never seen it before. On the graph of the forgetting curve above, the three green lines represent progressively shallower curves you might encounter after reviewing one or more times.
    

# The right time to review

Let’s explore property (2) further. What exactly is “the right time” to review some information?

To start with, you can probably recognize intuitively that practicing will only extend the amount of time you can remember when you **wait some time between reviews**. To take an extreme example, suppose someone offers you $100 if you remember some fact 10 years from today, but you can only review it 10 times between now and then. Which schedule would you pick – reviewing 10 times in a row on day 1, and then never seeing it again for the rest of the 10 years, or reviewing once on January 1 of each year?

You probably thought that reviewing over a long period of time would be more effective and chose to review on the first day of every year – and scientific research agrees. But the “once every year” schedule, while more effective than the “ten times at the beginning” schedule, isn’t nearly as effective as it could be either, because of point (1) above. Since memory decays exponentially, you’ll likely forget the fact very quickly after your first review, and you won’t have a chance to reinforce it for another year. As a result, you’ll keep relearning and forgetting the fact.

Fortunately, we can easily solve this problem by spacing those ten reviews, not evenly, but using **another** **exponential curve** – only this time, it’s one that benefits your memory instead of hurting it.

We’ll start out by waiting a nice short period between reviews, since that drop-off in your chance of remembering is steep when you’ve just learned something. Let’s say 3 days. After those 3 days, if you still remember the fact, we’ll wait 6 days before the next review. After that, we’ll wait 12 days, 24 days, 48 days (1.6 months), and so on and so forth. You can see that, because the delay doubles every time, it grows quickly and we’ll soon be able to wait years in between reviews. In fact, it turns out that we can **cover an entire human lifetime by reviewing just 16 times**, if you remember the fact each time you see it (which is not guaranteed, but is quite likely if the fact isn’t unusually difficult to remember).

The visualization in RemNote's flashcard queue when you finish a practice session neatly demonstrates how the intervals between sessions grow exponentially over time:

[![](https://downloads.intercomcdn.com/i/o/1053412039/c3fc243ad7340f837b5dd667/image.png?expires=1772827200&signature=97586dcd5ac8c3fe576682196ba7e506f3e44876df356aad9f47b2ad540bf8ae&req=dSAiFc1%2Fn4FcUPMW1HO4zRHpgIvgIv%2B63Z8Te1NlQ1Xt32I%2FpvQzR9XFCuVg%0AWPWEw2XNLgHTEnKQrng%3D%0A)](https://downloads.intercomcdn.com/i/o/1053412039/c3fc243ad7340f837b5dd667/image.png?expires=1772827200&signature=97586dcd5ac8c3fe576682196ba7e506f3e44876df356aad9f47b2ad540bf8ae&req=dSAiFc1%2Fn4FcUPMW1HO4zRHpgIvgIv%2B63Z8Te1NlQ1Xt32I%2FpvQzR9XFCuVg%0AWPWEw2XNLgHTEnKQrng%3D%0A)

# Spaced-repetition algorithms

In the example above, we used an extremely simple algorithm in which we waited 3 days for the first review, then doubled the amount of time we waited at each subsequent review. This algorithm actually works pretty well for how simple it is, but real spaced-repetition algorithms are more complicated. That’s partly because more nuanced algorithms are more efficient, but it’s also because there are additional factors to consider when we move from toy examples to the real world. For instance:

-   Some facts are much **harder to remember** than others. To maximize our efficiency, we should review the hard ones more often and the easy ones less often.
    
-   Sometimes we want to learn a very large number of facts in as little time as possible, but we don’t **care too much which specific ones stick**, and we’d be happy remembering 80% of them. (For example, most foreign-language vocabulary fits in this category.) Other times we want to remember as close to 100% of some set of facts as possible, and we don’t mind doing lots of extra work to ensure that.​
    
-   If we have exams coming up, we want to maximize how much we know **on** **exam day**, not on some arbitrary date in the far future. (Maybe after the exam, we’ll want to think about long-term retention, but until we’ve passed the exam that’s unlikely to be our top concern.)
    

To better understand how spaced-repetition algorithms achieve these goals, let’s explore three properties of any fact we’re trying to remember: _retrievability_, _stability_, and _difficulty_. In spaced-repetition systems, we model each fact we’re trying to remember as a flashcard, so we’ll consider each of the properties in a flashcard context.

## Retrievability

A card’s **retrievability** is the probability you’ll be able to successfully recall the answer within a short amount of time, if the card is presented to you in a practice session. Retrievability decreases steadily as you go about your life without thinking about the fact, then jumps up to near 100% again when you recall the answer.

  
In spaced repetition practice, we aim to always keep the retrievability of our cards higher than some threshold (often called the **desired retention** or **target retention**), so that we always have a good chance of remembering them when we need them. We achieve this by placing each card in the practice queue as soon as its estimated retrievability drops below the desired retention threshold. If you successfully recall the answer when you practice the card, its retrievability becomes 100% again.

As we increase our desired retention towards 100%, the amount of practice required to achieve that retention increases exponentially – that is, each additional minute we spend practicing improves our memory less than the minute before did, with a theoretical maximum of infinite time spent practicing – so we have to find a balance between reliability of memory and efficiency of study. Reasonable values are between 70% and 97%; most spaced repetition systems aim for a desired retention of 90%, which is a good balance for most situations. (Decreasing desired retention below 70% is unreasonable because at that point you start to spend more time relearning cards you've forgotten than you save by reviewing them less often.)

In RemNote, if you use the [FSRS](https://help.remnote.com/en/articles/9124137-the-fsrs-spaced-repetition-algorithm) algorithm, you can directly customize the desired retention in the scheduler settings. It's also possible to change the desired retention in [Anki SM-2](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm), but only by changing other parameters that have no clearly defined relationship to desired retention and seeing if that changes your performance to about the right amount.

**Note:** At first glance, it might seem like a 90% desired retention means you’ll never be able to score higher than 90% on your exams. Fortunately, this isn't true, for two reasons.

First, your chance of successfully recalling a random card at a random time, like when you need it in real life, is actually quite a bit higher than the desired retention, as long as you stay more or less up to date on practicing your cards. That’s because **the moment the scheduler puts a card in your practice queue is the moment you know it worst**: cards enter the queue when your predicted memory has become as bad as the algorithm will let it get. A randomly selected card at a random time will, on average, still be some time away from its next review, and thus have a higher retrievability. The math of actual moment-in-time retrievability is too complex to fit here, but a good rule of thumb is that if your target retrievability is 90%, your actual retrievability on a random card at a random time is 95%.

Second, it's easy to boost your retrievability to a higher level temporarily by doing extra practice. If you use the [exam scheduler](https://help.remnote.com/en/articles/9101991-preparing-for-an-exam) to tell RemNote when your exam is coming up, you'll get extra practice just before exam day [to achieve exactly that](https://help.remnote.com/en/articles/9102040-understanding-the-exam-scheduler).

**Tip**: If you do more reading on spaced repetition, you might run into some algorithms that express the desired retention as the percentage of cards you want to have _forgotten_ at practice time. This is called a **forgetting index**. A desired retention of 90% is equivalent to a forgetting index of 10.

## Stability

A card’s **stability** is how firmly the idea is stored in your memory – the higher a card’s stability, the slower its retrievability decreases over time. The more times you’ve practiced and successfully recalled a card, the higher its stability. Stability is expressed as the number of days before the [retrievability](#h_9f30c80c83) drops below the [desired retention](#h_9f30c80c83).

Stability has two interesting properties.

First, it only increases significantly when you **wait some time between reviews**. You can probably intuitively recognize that if you review something 10 times in a row with no break in between, you'll remember it for only a little bit longer than if you review it 5 times in a row.

Second, stability **increases more when you successfully recall a card with difficulty** than when you recall it easily. This means that practicing too often can actually make your memory _worse_ by many measures: while frequent practice might keep the retrievability high, the stability will remain low, so when you end up taking a slightly longer break from using the information, you'll suddenly forget it, even though you would have remembered it had you followed a more spread-out practice schedule. So for both the most efficient study **and** the strongest memories, keep your desired retention at a reasonable level and practice cards early only if you have a strong reason to temporarily boost your retrievability, like an upcoming exam.

(If you're surprised that stability increases more when you recall a card with difficulty, consider this. Forgetting is, overall, adaptive: remembering things that aren't useful clutters up your mind and makes it harder to think. So your memories should ideally be strong enough that you usually still remember them whenever they're useful, but weak enough that you usually forget them when they aren't. In this context, bringing something useful back from the brink of forgetting is a strong signal that the memory was too weak – your brain thought you probably didn't need it anymore, but you actually did. In comparison, recalling something that was trivially easy to remember says almost nothing about whether the memory was the right strength – your brain thought you needed it and you did – so there's no reason to strengthen it much.)

To account for these two properties of stability, spaced-repetition algorithms pay attention to the last time you practiced a card. The longer it's been between scheduled reviews, the more the card's stability will increase when you remember the answer. And if you practice a card earlier than the ideal scheduled time, the card's stability will increase less than it otherwise would have. Conversely, if you practice a card later than scheduled and still remember it, the stability will increase somewhat more than it otherwise would have.

## Difficulty

Finally, a card’s **difficulty** is, well, how difficult it is to learn. Some flashcards are easier than others – perhaps because you have a better understanding of the topic, because they are written more clearly, or because the topic is inherently less complex.

The stability of easy cards can be increased much more rapidly than the stability of difficult cards, while holding retrievability constant. If a card has a low difficulty, reviewing the card means you can wait much longer than last time before seeing it again. If a card has a high difficulty, reviewing the card means you can wait only a little longer than last time before seeing it again.

Different spaced-repetition algorithms express the difficulty numerically in different ways. For instance, in FSRS, the difficulty is a number from 1 to 10; in Anki SM-2, the scale is backwards, so that a low difficulty is called a _high ease_, and the ease is a number between 1.3 and roughly 4_._ But the basic idea is the same everywhere. (Some very simple spaced-repetition algorithms, such as the [Leitner system](https://en.wikipedia.org/wiki/Leitner_system), don't model difficulty at all and pretend all cards are of equal difficulty.)

Spaced-repetition algorithms infer the difficulty of each card based on your feedback at review time. The details depend on the algorithm, but in general, if you forget or struggle to recall a card, they increase the difficulty; if you remember it easily, they lower it. Some algorithms use your performance on similar material you're studying to better guess the difficulty of newly added cards.

Very difficult cards are called [leeches](https://help.remnote.com/en/articles/7183408-dealing-with-leech-cards), and the best way to handle them is usually by removing or rewriting them, rather than practicing them over and over again.

## From theory to algorithms

In reality, we never know the precise retrievability, stability, or difficulty of any card, because forgetting is a random process, but we can estimate them accurately enough to be very useful. RemNote offers two popular spaced-repetition algorithms to do the estimating, Anki SM-2 and FSRS.

FSRS directly estimates retrievability, stability, and difficulty, and uses those to select the next review time. Anki SM-2 uses an interval (stability) and ease (difficulty), and uses other parameters to create a forgetting curve that maintains roughly a 90% retrievability.

With the information in this article, you're ready to understand more details about these specific algorithms. Check out the pages on [Anki SM-2](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm) and [FSRS](https://help.remnote.com/en/articles/9124137-the-fsrs-spaced-repetition-algorithm). Or, if you haven't done so already, learn how to [get started using spaced repetition in RemNote](https://help.remnote.com/en/articles/6022755-basics-of-spaced-repetition).

* * *

Related Articles

[

Getting Started with Spaced Repetition

](https://help.remnote.com/en/articles/6022755-getting-started-with-spaced-repetition)[

RemNote vs. Anki, SuperMemo, and Other Spaced-Repetition Tools

](https://help.remnote.com/en/articles/6025618-remnote-vs-anki-supermemo-and-other-spaced-repetition-tools)[

The Anki SM-2 Spaced Repetition Algorithm

](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm)[

Understanding the Exam Scheduler

](https://help.remnote.com/en/articles/9102040-understanding-the-exam-scheduler)[

The FSRS Spaced Repetition Algorithm

](https://help.remnote.com/en/articles/9124137-the-fsrs-spaced-repetition-algorithm)
---
title: "Ten rounds on a rounded corner"
description: "An agent can write the CSS. It cannot look at the screen. That one asymmetry decides which parts of interface work go fast and which turn into a loop you have to break yourself."
heroImageCredit: "mume"
heroImage: "/content/images/hero-ten-rounds-on-a-rounded-corner.webp"
pubDate: 2026-02-18
tags: ["design", "ai-agents", "frontend", "mume"]
---
I spent an evening in February on the chat interface for my web app, and one problem in it took more than ten rounds to solve.

The problem: the message list scrolls behind the composer at the bottom. The composer has rounded corners. I wanted the scrolling content to be clipped by that curve, so text slides out of view along the radius instead of hitting a hard rectangular edge.

That is a small, ordinary piece of interface polish. Here is roughly what the evening sounded like:

> *"the scroll holder is visibly going behind it, it should be the same radius of the composer"*

> *"still not working correctly — the A of the All should be partially visible at the curve"*

> *"just make the container behind the composer completely transparent"*

> *"it works, just some weird effect going on"*

> *"still not clipping with the radius of the composer. Please explore and fix properly, it's not so easy — do research. We have been to and fro like 10 times now without a solution."*

We got there. But ten rounds on a border radius, in a session where much harder things had gone in first try, is worth understanding rather than laughing at.

---

## The asymmetry

Everything that went fast that evening had one thing in common: **it could be verified in the code.**

Restructuring a settings panel into three tabs. Adding syntax highlighting to file previews. Making an edit-in-place mode so a separate edit tab could be deleted. Fixing a build error. Those are all statements about structure, and structure is legible in text. An agent can read the file and know whether it did the thing.

Everything that was slow had the opposite property: **the only way to know if it worked was to look at it.**

Is the curve right? Is the padding "off"? Does the gradient read as a border or as a glow? Is the effect nice? None of that is inspectable in the source. The code can be exactly what you asked for and still look wrong, and no amount of re-reading the CSS reveals it.

So the loop degrades into something quite dumb: it changes the code, I look at the screen, I describe what I see in a sentence, it changes the code again. **I am the render step.** My description is the only channel through which the visual result gets back into the process, and a sentence is a very low-bandwidth way to describe a wrong curve.

Ten rounds is what that costs when the target is a few pixels of geometry that I can recognise instantly and describe only badly.

---

## What actually shortened it

Screenshots. Once I started pasting the result back rather than describing it, the loop tightened immediately.

That is obvious in hindsight and I did not do it for the first several rounds, because describing felt faster than capturing. It is not. A sentence about a wrong border radius is a lossy encoding of an image; the image is right there and costs nothing to send.

The general rule I took from it, which now applies to anything visual:

> **If the verification step is your eyes, put the image in the loop. Do not narrate it.**

The corollary is that "explore and fix properly, do research" — which is what I eventually said out of frustration — is a much weaker instruction than one screenshot. It sounds like I gave more direction. I gave less.

---

## The part that stayed mine

Reading the session back, what strikes me is how much of it is **taste**, expressed in sentences no tool could have generated:

- *"it looks too cluttered — strip it down, make tabs if needed, remove the icons and the category filters"*
- *"I liked the earlier font size"*
- *"remove the cards and rounded corners from the staged items, and instead of a badge saying 'modified' just use the icon that's already on the left"*
- *"this is much cleaner and should be app-wide"*

Every one of those is a judgement about what to remove. Almost none of them are about what to add.

That is the whole division of labour, and it turned out identical to the one I found [debugging a robot with a multimeter](/writing/multimeter-and-an-agent/) — the agent runs the loop, I own the physical reality and the call on whether it is right. There the reality was a voltage. Here it is a screen. Neither is available to the thing writing the code, and pretending otherwise is exactly where evenings go.

---

## One thing that came out better than I planned

Late in the session I asked for an animated gradient border on the composer when it has focus. Then, once it worked, something better occurred to me: use the same border to indicate **streaming**, in a different colour.

So the interface ended up with one visual element carrying two states — it is your turn, and it is thinking — with the colour distinguishing them. Then a few more rounds on the details: no animation while the user is scrolling, because motion in the corner of your eye while you are trying to read is hostile.

That progression is the argument for iterating this way, and it is the honest other half of the ten-round story. I did not design the streaming indicator up front. I got the focus animation cheaply enough that I was still curious when it landed, and the better idea arrived *because* the first one was already on screen.

Which is worth weighing against the slow parts. The evening had one problem that took ten rounds and half a dozen ideas that only existed because everything else took one.

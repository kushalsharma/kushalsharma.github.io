---
title: "The flicker was the radar"
description: "A desk instrument started flickering on every screen. The cause was a sensor that had nothing to do with drawing, running on a schedule that had everything to do with it."
heroImageCredit: "mume"
heroImage: "/content/images/hero-the-flicker-was-the-radar.webp"
pubDate: 2026-07-13
tags: ["esp32", "hardware", "debugging", "firmware"]
---
I built a small desk instrument on an ESP32 — a screen that shows power draw and a few other live readings, with a menu you click through using the boot button. A presence radar wakes the display when I sit down and dims it when I leave.

It worked. Then every screen started flickering, several times a second, and it got worse the moment I scrolled the menu.

---

## The wrong instinct, which I had first

Flicker on an embedded display looks like a rendering problem. That is the whole point of the symptom: it is *visibly* about drawing, so you go and read the drawing code.

I looked at partial redraws. I looked at whether the menu was clearing and repainting the full frame instead of just the changed row. I looked at the refresh rate. All plausible, all wrong, and I found nothing because there was nothing there to find.

The thing that broke it open was not looking harder at the renderer. It was asking a different question:

> *"is it because of the radar? running in background? if so please optimise so that UI interrupts don't happen — list down all the tasks running, the ones in background all the time, and the ones on periodic intervals."*

Listing every periodic task is a dull, mechanical question. It is also the one that found it, because the flicker was never in the drawing code. It was in **when** the drawing code got interrupted.

---

## What was actually happening

The radar sensor polls. The display draws. Neither knows about the other, and on a microcontroller with no preemptive isolation between them, a poll that lands mid-frame leaves you looking at a half-drawn screen for a few milliseconds.

Do that a few times a second and you get flicker. Scroll the menu — which drives the redraw rate up, and so multiplies the number of chances to collide — and it gets dramatically worse. That last detail was the confirmation. **The bug got worse in proportion to how often I drew**, which points at a collision, not at bad drawing.

This is the same shape as [the two heartbeats that killed my WebSocket](/writing/two-heartbeats/), which I ran into a couple of days later on a different device. Two periodic things, each individually correct, each unaware of the other, interfering on a schedule. The symptom appears in whichever component is more visible — the socket, or the screen — and the cause is in the timing relationship between them, which lives in neither.

I now treat "it's periodic and it got worse when I did more of X" as a strong signal to stop reading the component that hurts and go enumerate the clocks.

---

## The fix, and the better fix

The immediate fix is to stop the two from overlapping: make the sensor read cheap and predictable, and keep it away from the window where a frame is being pushed out.

The structural fix is the one I actually wanted, and it is the same answer as on every other display I have built since — **draw the whole frame into a buffer, then push the buffer**. If the panel only ever receives complete frames, an interruption during composition costs you a little latency instead of a visible tear. It cannot flicker, because a partial frame never reaches the glass.

That costs memory, which on an ESP32 is the resource you are always short of. It is worth it. Nearly every display problem I have had since has been solved or prevented by that one decision.

---

## The bit worth keeping

Two things I would tell myself before starting.

**The component where a bug appears is not usually the component that causes it.** A flickering screen is evidence about drawing only in the sense that drawing is the thing being interrupted. The question "what else runs on a timer" is nearly free to ask and I asked it far too late.

**When you are stuck, enumerate instead of investigating.** Not *why is this flickering*, which invites a theory — but *what are all the periodic tasks, background and interval*. Boring, exhaustive, and it turns a hunt into a list you can read. Half the hard bugs I have found in firmware came from writing down everything in a category rather than reasoning about the one thing I suspected.

The radar was doing its job perfectly. That was the problem.

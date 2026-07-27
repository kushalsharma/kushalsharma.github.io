---
title: "Thirty thousand moving objects and one main thread"
description: "A long weekend spent putting every satellite and every aircraft on a 3D globe in a browser. The globe was the easy part. Everything after it was a fight for the main thread."
heroImageCredit: "mume"
heroImage: "/content/images/hero-thirty-thousand-moving-objects.webp"
pubDate: 2026-03-04
tags: ["frontend", "performance", "webgl", "dataviz"]
---
Over a long weekend in March I built a thing called [Panopticon](https://panopticon-mm.web.app/): a photorealistic 3D globe in a browser with live satellites and live aircraft on it, a timeline you can scrub backwards and play at speed, and a weather layer.

It is still running. Months later it holds **16,114 satellites at around 75 frames a second**, with layers for aircraft, military traffic, marine traffic, sea state, wildfire and weather behind it. It is MIT licensed, and it has CRT, night-vision and thermal shader modes, because I wanted it to feel like a terminal.

Getting the planet on screen took an afternoon. There is a mature library for the globe, Google's photorealistic tiles drop straight into it, and you can be flying around a rendered Earth before you have finished your coffee.

Then I added the moving things, and spent the rest of the weekend on a single problem in several disguises: **there is one main thread, and everything wants it.**

---

## The symptom, escalating

The complaints in my own notes, in order, tell the story better than I can:

> *"the page is getting unresponsive, very laggy and chrome wants to kill the page, our hardware temps are very high too"*

> *"a little better but not anywhere near usable — are we doing a lot of work on the main thread somewhere?"*

> *"still not usable in flights mode. There are more satellites than flights, and there's no such problem there. Why?"*

That last one is the good question, and it is the one that actually cracked it.

There were **more** satellites than aircraft — sixteen thousand of them against a few thousand planes. Satellites were fine. Aircraft killed the page. If raw object count were the problem, that is backwards — so the problem was not the count. It was what I was doing per object, and when.

---

## Why satellites are easy and aircraft are not

A satellite's position is a *function*. Given orbital elements and a timestamp, you compute where it is. That has two consequences that turn out to matter enormously:

- You can compute any moment, past or future, without waiting for anything.
- You can compute **ahead of time**, in bulk, off the main thread, and hand the renderer a finished table of positions.

An aircraft is not a function. It is a stream of observations from an API, arriving on its own schedule, with gaps. You cannot ask where a plane will be — you can only be told where it was. So the data arrives in chunks, at unpredictable times, and every arrival wants to touch the same structures the renderer is reading.

That is the whole difference. The satellite layer was fast because it had been quietly restructured into *precompute, then play back*. The flight layer was slow because it was still *receive, then react*, on the thread that also has to draw sixty frames a second.

Once I saw it that way the fix was obvious, and it is the thing I would keep:

> **Turn streams into timelines before they reach the renderer.** Precompute, downsample, store. Then the UI only ever reads a prepared structure, at a rate it chooses.

Downsampling is what makes scrubbing viable at all. At 30× playback speed nobody can perceive per-second aircraft positions, and computing them is pure waste — so you build coarser tracks for faster playback and pick the one that matches the current rate.

---

## The cost problem, which is also an architecture problem

There is a second constraint that shaped this more than I expected, and it is not a technical one.

Photorealistic 3D tiles are billed per request. A globe that people can spin freely is, from a billing perspective, a machine for generating requests. My note about it at the start of the weekend was blunt — add the tiles, *"but let's make sure we cache things to not get an insane bill."*

So there is a service worker in front of the tile requests, and an IndexedDB layer holding satellite and flight history so a page refresh does not re-fetch everything. The flight API rate-limits too — I ran into 429s and backed the polling off, first to thirty seconds, then to five minutes.

Which produces a satisfying convergence: **the caching I needed for cost is the same caching I needed for performance.** Data already on the device does not need fetching, does not need parsing on arrival, and can be pre-shaped into the timeline the renderer wants. One mechanism, two problems, and I would not have built it as carefully if only one of them had existed.

---

## Two bugs worth keeping

**Clicking selected the wrong thing.** With a 3D globe you pick by casting a ray, and a ray does not stop at the horizon. Click a spot to see its weather and you might select a satellite on the *far side of the planet*, because it was also under the cursor in screen space and happened to be first in the pick list. Depth is not the same as intent, and picking needs to know which layer you meant.

**It worked locally and broke on staging.** My service worker tried to cache tile responses; some of those requests are POSTs; the Cache API refuses to store a POST and throws. Locally the service worker was not in play, so the bug did not exist until deploy — the most tiresome category there is.

---

## Was it worth a weekend

There is no product here. It is a globe with things moving on it, and I built it because I wanted to see whether I could.

What I did not expect is that it would still be up months later, holding sixteen thousand objects at a steady frame rate on an ordinary laptop. The performance work is the reason. A version of this that ran at eight frames a second would have been closed and forgotten by April.

But almost everything in it turned out to be a rehearsal of the same idea I keep meeting elsewhere. Precompute the expensive part and keep it away from the thing that must stay responsive. Cache at the boundary where cost and latency are the same problem. Let the fast path read prepared data and never compute.

That is the same instinct as [moving the thinking off a microcontroller](/writing/microcontroller-is-a-terminal/) and letting the device just render. Different scale, same shape: figure out which work can be done ahead of time and somewhere else, and the thing in front of the user gets simpler and faster at once.

The globe was the afternoon. The rest of the weekend was learning that lesson again, in a browser, with tens of thousands of things moving at once — and it is [still running](https://panopticon-mm.web.app/), which is the only benchmark I really trust.

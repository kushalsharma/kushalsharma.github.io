---
title: "Nine weeks from first commit to taking money"
description: "The commit log of an LLM gateway going from nothing to production, and what the order of it says about which parts are actually hard."
heroImageCredit: "mume"
heroImage: "/content/images/hero-gateway-nine-weeks-to-production.webp"
pubDate: 2026-02-13
tags: ["llm", "infrastructure", "mume", "solo"]
---
I like reading commit logs backwards. Not for nostalgia — because the *order* things got built in is an honest record of what turned out to be hard, and it disagrees with the plan almost every time.

Here is my LLM gateway's, compressed. First commit to serving paying users.

| | |
|---|---|
| **8 Dec** | Gateway exists. Requests go in, model responses come out. |
| **22 Dec** | CORS. Logging. Then better logging. |
| **27 Dec** | A second provider — images. |
| **10 Jan** | Free daily allowance for new users. |
| **3 Feb** | Cleanup. |
| **6 Feb** | Dashboard, analytics, signup. |
| **8 Feb** | Billing and analytics. |
| **9 Feb** | Rate limiting. Hashed API keys. Plans. Production. |
| **22 Feb** | Token caching. Credits. |

Nine weeks. One person, evenings and weekends around everything else.

The interesting thing is not the speed. It is where the weeks went.

---

## The part everyone thinks is the product took two weeks

Proxying to a model provider and streaming the answer back — the thing that would be in the demo, the thing the landing page describes — is the 8 December commit. It works almost immediately, because it is fundamentally a well-behaved piece of plumbing. Take a request, add a header, forward it, relay the chunks.

By 27 December there was a second provider behind the same endpoint. That is the "500+ models, one API" claim, and it took about three weeks of spare evenings.

I am not being falsely modest. It is genuinely not that hard, and pretending otherwise is one of the more tiresome habits in this space. Routing is a solved shape. There are good open source projects that do only that, and they do it well.

If routing were the product, I would have been finished before Christmas.

---

## Then seven weeks of everything else

Look at what fills January and February: free allowances, signup, dashboards, analytics, billing, rate limits, key hashing, plans, credits.

Not one of those is about talking to a model. Every one is about **the fact that other people are going to use this and it costs real money when they do.**

That ratio has stayed roughly true ever since, and it is the single most useful thing I know about this category:

> The model call is the demo. Everything around the model call is the product.

Which is a slightly annoying thing to learn, because the model call is the fun part and everything around it is user accounting.

---

## The order tells you something too

Notice that billing arrived on 8 February and credits on 22 February — *after* production. And the free daily allowance arrived on 10 January, well before either.

That is not sloppiness, it is sequencing under real constraints. You need people using the thing before the shape of the money problem is visible. Giving away a bounded daily allowance first is cheap and it produces the usage patterns that tell you what to build next. I would not have designed the credit ledger correctly in December, because in December I had no idea what the traffic looked like.

The corollary is uncomfortable and I think it is right: **there was a window where the gateway was live and my cost controls were thinner than they should have been.** That window is where the [infinite loop post](/writing/one-user-infinite-loop/) comes from. It is also where "metering is the actual product" stopped being a theory I found interesting and became a thing I had opinions about.

---

## What "9 Feb" actually means

Four commits in one day: rate limiting, hashed API keys, plans, and one labelled *plan to production*.

That is what going live looks like when you are solo. Not a launch. A Sunday where you finally do the four things standing between the thing working and the thing being allowed to face the public, and then you point DNS at it.

It has been serving traffic since. The next substantial change to that code landed in July, five months later, which is the number I am proudest of on this whole list — not because nothing needed doing, but because the parts that carry money have been boring for five months.

Boring is the goal. Nobody puts it on a landing page.

---

## If you are building one

Two things I would tell someone starting today.

**Build the ledger earlier than feels necessary.** Not the full billing system — the record. Every call, who made it, what it cost, from the provider's own numbers. You can add pricing and plans on top later, but you cannot reconstruct usage you never wrote down, and the day you need it is the day it is already too late.

**Do not spend your differentiation budget on routing.** It is the part with the most existing solutions and the least room to be better. Whatever makes your thing worth using is almost certainly in the seven weeks, not the two.

I have been building [the same shape of thing for ten years](/writing/same-thing-for-ten-years/) — a layer between an application and the volatile thing it depends on, so the expensive part can change without the application changing. The gateway is the current one. Nine weeks to production, and the interesting part started in week three.

---
title: "The gap between the answer and the bill"
description: "You cannot price an LLM call until after it has finished. That one fact decides the shape of every metering system you will ever build on top of one."
heroImageCredit: "mume"
heroImage: "/content/images/hero-billing-after-the-answer.webp"
pubDate: 2026-02-27
tags: ["llm", "billing", "infrastructure", "mume"]
---
There is a line in my gateway's billing code that I have thought about more than almost anything else I have written:

```ts
await new Promise((resolve) => setTimeout(resolve, 750));
// slight delay to allow the provider backend to finalize
```

Three quarters of a second of doing nothing, on purpose, before I ask the provider what the request I just served actually cost.

It looks like the kind of thing you find in a codebase and quietly delete. It is not. It is the honest expression of a fact that took me a while to accept: **in an LLM gateway, the answer and the bill do not arrive at the same time.**

---

## Every other API you have metered was easier than this

Meter a normal API and the cost is known before you do the work. A request is a request. A gigabyte is a gigabyte. You can check the balance, decide, and charge, all in one pass, all before you commit to anything expensive.

Now try it with a model call:

- The **input** cost you can estimate, but only after tokenising with that specific model's tokeniser, which is not the one next door.
- The **output** cost depends on how long the reply turns out to be. Nobody knows that in advance. Not you, not the user, not the model.
- The **rate** depends on which model actually served it, which — if you route, cache, or fall back — may not be the one that was asked for.
- Cache hits, batching discounts and reasoning tokens all land after the fact.

So the sequence is not *check, charge, serve*. It is **check, serve, then find out, then charge.** You commit to spending money before you know how much money it is.

Everything awkward about metering AI comes out of that reordering.

---

## Which means you are always billing in the past

My gateway bills post-hoc. When a request finishes I have a generation ID, and I go back to the provider and ask what it cost. The provider's own number, not my estimate.

That is a deliberate choice and it is worth being precise about why. I could compute the cost myself from token counts and a price table. Plenty of systems do. But then I own a copy of every provider's pricing for every model, and my copy is wrong the day any of them changes it — silently, in my favour or against me, and I find out from a user or from a monthly invoice that does not reconcile. Asking the provider what it charged me means my ledger and their invoice are describing the same event.

The cost of that choice is the 750 milliseconds. The provider's accounting is not final the instant my stream ends. Ask too early and you get an answer that is not there yet.

So there is a sleep. It is not elegant. It is correct, and elegance loses that argument.

---

## The user is not waiting for this

The thing that makes the sleep acceptable is that it happens **after the user has their answer.**

The response is already streamed, complete, closed. The billing runs behind it. Nobody is sitting there watching a spinner for an extra three quarters of a second while I reconcile my books — the tokens were on their screen well before that.

This is the general shape and it took me longer than it should have to see it: **money settles more slowly than experience, and that is allowed.** Card networks have known this forever. Your payment authorises now and settles days later; you walk out of the shop with the thing. What I built is a small version of the same trick. Serve first, settle after, and make sure the settlement is reliable rather than instant.

Once you accept the split, a lot of design pressure disappears. You stop trying to make the expensive, uncertain, third-party-dependent part of the system fast. It does not need to be fast. It needs to be *right*, and it needs to not lose events.

---

## What actually keeps you safe is the thing before the call

If billing is post-hoc, then billing is not your protection against a user who runs up a bill. It cannot be. By the time it runs, the money is spent.

The protection is the gate in front: a credit balance, checked before the request goes upstream, that refuses the call outright when it is empty. Cheap, synchronous, and it happens while refusing is still free.

That gate is a much blunter instrument than it looks. It answers *do you have anything left*, not *do you have enough for this specific call* — because, again, nobody knows what this specific call costs until it is over. Which means a user standing at the edge of their balance can still go over it on one request.

That is a real hole, it is bounded by how expensive one call can be, and it is the honest reason I care about per-key limits and quotas as much as I do about the ledger itself. I wrote about the case where it goes badly in [what it costs you when one user writes an infinite loop](/writing/one-user-infinite-loop/) — it is the same problem viewed from the other end.

---

## Why I keep coming back to this

Routing between providers is the part people demo. It is also the part that is nearly finished as a problem — several projects do it well and it gets commoditised a little more every month.

The part that decides whether a product has a business rather than a demo is this one: knowing, per user and per key, what was spent, being able to prove it, and being able to stop it. That work is unglamorous, it is mostly about accepting that costs arrive late, and it is where I spend my time.

It also explains the sleep. Someone reading that line cold sees a hack. What it actually is, is the system admitting where the truth lives — and going to fetch it rather than guessing.

I would rather be 750 milliseconds late and right.

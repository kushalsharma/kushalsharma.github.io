---
title: "Your LLM gateway routes. Mine bills."
description: "Routing between model providers is the commoditised half of the problem. The half nobody wants to build is knowing whose money you just spent — and it is the half that decides whether your AI product has a business model."
heroImageCredit: "mume"
pubDate: 2026-08-01
heroImage: "/content/images/hero-gateways-route-mine-bills.webp"
tags: ["llm", "infrastructure", "billing", "gateway"]
---
Every LLM gateway on the market solves routing.

One endpoint, many providers, automatic failover, a retry policy, maybe a cache. LiteLLM does it. Portkey does it. OpenRouter does it. The Vercel AI SDK does a version of it. It is a genuinely useful thing to have and it took the industry about eighteen months to make it a commodity.

I built one too. It was the easy part, and it is not what the product is.

The part that took the real work is the part that answers a different question. Not *which provider should serve this request* but **whose money am I about to spend, do they have any left, and what do I charge them for it.**

---

## The moment the problem changes shape

While you are the only user, cost is an operational concern. You watch a dashboard, you get a bill at the end of the month, you wince, you move on.

The moment you have paying users, cost becomes a *product* concern, and it changes shape completely:

- A user on your free tier and a user on your top tier hit the same endpoint. The request is identical. The economics are not.
- Someone builds an integration against your API and loops it. You find out when the provider invoices you.
- You want to launch a cheaper plan on a cheaper model. That is now a pricing decision, a routing decision, and a quota decision, and they have to agree with each other.
- A provider raises prices mid-month. Your margin moves on plans you already sold.

None of that is routing. All of it is accounting.

To be fair to the field: several gateways *do* have budgets and virtual keys — LiteLLM in particular. But that machinery is generally built for controlling what your own teams and services spend. It is a cost-control tool pointed inward.

What I needed was pointed outward: metering **my end users**, on plans they bought, with a payment provider attached, in a currency and tax regime that actually applies to me. That is a different system with a different centre of gravity, and I could not find it, so I wrote it.

---

## What that actually means in code

The gateway I run has, roughly in order of how much trouble each one caused:

**A credit ledger.** Not a counter. A ledger — append-only, every debit traceable to a request id, because the first time a user says "I did not use that many tokens," a number in a column is not an answer. You need to be able to show them the row.

**API keys with scopes.** Users issue their own keys. Keys carry limits. A leaked key should be a bounded loss, not an open tap into your provider account.

**Plans.** Which models, what rate, what monthly allowance, what happens at the ceiling — soft-throttle or hard-stop. Every one of those is a lever the business needs and the code has to expose as data.

**Rate limiting that counts the right unit.** More on this below, because it is the one that surprised me most.

**Usage analytics.** Per user, per model, per key, per day. Both for the customer's dashboard and for the far less glamorous job of finding out why last Thursday cost forty percent more than the Thursday before.

**Payments.** Razorpay, because I am in India and the answer to "just use Stripe" is often "I cannot."

**Tests on the parts that touch money.** Auth, API keys, credits, rate limiting. If billing logic is wrong, you do not get an exception. You get a slow, silent, compounding loss that shows up as a bad month.

---

## The bit I got wrong first

I built rate limiting the way you build it for a REST API. Requests per minute, token bucket, done. I had done this a dozen times.

It is the wrong unit.

For a normal API, requests are a decent proxy for cost, because every request costs you roughly the same nothing. For an LLM API this falls apart immediately. One request can be forty tokens or forty thousand. A hundred requests per minute is meaningless as a limit — it could be trivial or it could be your worst day of the month.

Worse: **you do not know the cost until after you have already paid it.** The response has to be generated before you can count its tokens. By the time you can enforce, the money is spent.

So the limit has to be on tokens, the budget has to be checked *before* the call against an estimate, reconciled *after* against the real usage, and the gap between those two has to be small enough that a determined user cannot live inside it. That is a fundamentally different design from a token bucket on requests, and none of my prior experience prepared me for it.

---

## Why this is the whole product

There is a version of an AI company that works like this: usage goes up, revenue goes up, costs go up faster, and everyone talks about gross margin in a tone of voice usually reserved for the weather.

That happens when the thing you sell and the thing you buy are metered by different people. You buy tokens. You sell seats, or a flat monthly fee, or "unlimited." Then you spend the rest of the company's life hoping the average user stays average.

If the meter is yours, that stops being a hope and becomes an input. You know what every user costs. You know what every plan earns. You can price a tier at a margin instead of at a guess, and when a provider's price moves you can see, that day, which of your customers just became unprofitable.

That is not a feature of the gateway. That *is* the gateway. The routing is table stakes underneath it.

---

## The proof I care about

[Mume AI](https://mume.ai) — my own consumer app, on iOS, Android and web, taking real payments — runs entirely on this. It has been in production for six months without a deploy, because everything anybody has wanted to change so far was already data: models, pricing, plans, limits.

I am my own most demanding customer, which is the only reference I fully trust.

---

*I build this at [Muse Mesh](https://mume.ai). If you are putting an AI feature in front of paying users and you have not yet decided what happens when one of them costs you fifty times what they pay, I would genuinely like to hear how you are thinking about it.*

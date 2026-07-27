---
title: "What it costs you when one user writes an infinite loop"
description: "Nobody has to be malicious. A retry policy, an agent that does not know when to stop, and a for-loop over a spreadsheet are enough. Here is the arithmetic, and what actually stops it."
heroImageCredit: "mume"
pubDate: 2026-07-22
heroImage: "/content/images/hero-one-user-infinite-loop.webp"
tags: ["llm", "infrastructure", "billing", "reliability"]
---
Nobody has to be malicious for this to happen to you. That is the part people underestimate.

Everything below is something a well-intentioned engineer does on a normal Tuesday.

---

## The arithmetic

Pick your own numbers, but let us say a call costs you **$3 per million input tokens and $15 per million output**, and a typical request in your product is 2,000 in and 800 out.

That is about **1.8 cents** per call. Fine. You priced around it.

Now a customer integrates your API and wraps it in a retry. Their retry policy is the sensible one everyone writes: three attempts, exponential backoff. Their code has a bug that makes every response look like a failure, so every call retries to exhaustion.

Your cost per useful request just tripled. Still survivable.

Now the loop is not a retry, it is a `while` that never exits, running on their server at maybe five requests a second because that is as fast as your API answers.

- 5 req/s × 1.8 cents = **9 cents a second**
- **$5.40 a minute**
- **$324 an hour**
- **$7,776 a day**

Over a long weekend, from one customer, on one plan, with nobody doing anything wrong on purpose: **north of twenty thousand dollars.**

If that customer pays you $99 a month, you did not have a bad week. You had a bad quarter, caused by a single `while` loop in somebody else's codebase, which you will never see.

---

## Why your instincts do not help here

I built APIs for ten years before I built this one. Almost every reflex I had transferred badly.

**Retries are good practice.** In every other system you have worked on, a retry is how you survive a flaky network. It costs you a few milliseconds and some log noise. Here, retries multiply your marginal cost directly, and the client that is retrying is not the one paying.

**Rate limits feel solved.** Requests per minute is the unit everyone reaches for, and it is close to meaningless here. One request can be forty tokens or forty thousand. A limit of 100 req/min bounds nothing you actually care about, because cost per request varies by three orders of magnitude.

**You cannot price the call before you make it.** This is the one with no good analogue. You do not know what a request costs until the response exists — which is to say, until you have already spent the money. Every enforcement mechanism you build has to work with an estimate up front and a reconciliation afterwards, and a determined loop will live in the gap between the two.

**Your dashboard is too slow.** Provider usage reporting lags. Your own aggregation lags. Alert thresholds get tuned to normal traffic, and this is not slightly-above-normal traffic, it is a step function at 3am on a Saturday. By the time a human looks, the money is gone. It was gone within the first hour.

---

## The four ways this actually arrives

Not hypotheticals — these are the shapes it takes.

1. **The retry storm.** A client treats a slow response, or a `finish_reason` it does not recognise, as a failure. Perfectly reasonable code, wrong assumption.
2. **The agent that will not stop.** An agent loop with a tool that keeps returning something almost-but-not-quite satisfying. No step ceiling. It will happily keep going until something external stops it, and *you* are the something external.
3. **The spreadsheet.** Somebody points a `for` loop at a 200,000-row CSV to "just enrich this quickly." They meant to test on ten rows. They ran the whole file.
4. **The cron nobody remembers.** A scheduled job set up eight months ago by someone who has since left, quietly running against a prompt that got longer every quarter.

Three of those four are your best customers being enthusiastic.

---

## What actually stops it

**A budget check before the call, not after.** Estimate the cost from the input and the max output, check it against remaining credit, and refuse if it does not fit. Reconcile against actual usage when the response lands. The estimate does not need to be perfect. It needs to be an upper bound you are willing to lose.

**Hard stops, not soft warnings.** An email at 80 percent is not a control. If a key is out of budget, the call fails with a clear error. The instinct to keep serving a paying customer through an overage is exactly how the $20,000 weekend happens.

**Limits on the key, not just the account.** Keys leak, and keys get embedded in clients you do not control. A key should carry its own ceiling so the blast radius is one integration, not one customer's entire balance.

**Token-denominated limits.** Rate-limit on the unit you are billed in. Anything else is measuring the wrong thing precisely.

**Velocity anomaly detection.** Not clever ML. A simple rule: this key is running at forty times its own trailing average, so throttle it and tell somebody. Most runaway loops look nothing like the thing they were doing yesterday.

---

## The part that is not technical

Here is the real reason this matters, and it has nothing to do with reliability engineering.

If your product lets users trigger model calls and you do not meter them per user, you have sold something with an unlimited liability attached. You may not have written it that way in the contract, but that is the shape of the thing.

Every "unlimited" AI plan is a bet that no individual customer will be unusual. That bet is fine right up until you succeed, because scale is exactly what produces unusual customers. The users who cost you fifty times what they pay are not a rounding error to be absorbed — at any real volume they are a structural feature, and they arrive precisely when things are going well.

Metering is not a billing feature you add later, once there is revenue to justify it. It is the thing that decides whether revenue means anything.

I would rather find that out from a spreadsheet than from an invoice.

---

*I build [Muse Mesh](https://mume.ai) — an LLM gateway with per-user credits, quotas, token-denominated rate limiting and billing, so this is a config value instead of a war story. If you are running an AI product without a per-user meter, the cheapest hour you will spend this month is working out what your worst customer could cost you.*

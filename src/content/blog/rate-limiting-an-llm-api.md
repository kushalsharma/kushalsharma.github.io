---
title: "Rate limiting an LLM API is not rate limiting a REST API"
description: "Requests are the wrong unit and everyone uses them anyway, including me. Here is why the right unit is so hard to enforce, and what to do until you can."
heroImageCredit: "mume"
heroImage: "/content/images/hero-rate-limiting-an-llm-api.webp"
pubDate: 2026-02-10
tags: ["llm", "api", "infrastructure", "mume"]
---
Rate limiting a normal API is a solved problem with a shape everyone knows. Count requests per user per window, reject over the line, set a `Retry-After`, go home.

That design rests on an assumption so quiet you never notice you are making it: **requests are roughly interchangeable.** A hundred of them cost about a hundred times one of them. Once that is true, counting requests is a decent proxy for counting load, and everything downstream works.

For a model API it is not remotely true.

One request is `"hi"`. The next is a 60,000-token document with a long reply and reasoning turned on. Same endpoint, same method, same one increment on the counter, and a cost difference of several orders of magnitude. A limiter that treats those as equal is not measuring the thing it exists to measure.

The unit that actually correlates with cost is **tokens**. Everyone who has thought about this for ten minutes knows that.

Almost nobody enforces it. My gateway does not either. It is worth being clear about why, because the reason is more interesting than the admission.

---

## You cannot count the thing until after you have spent it

Here is the problem in one sentence: **a limiter has to decide before the request, and the token count does not exist until after it.**

Input tokens you can approximate — but only by tokenising with that model's tokeniser, which differs per family, which means either shipping several tokenisers and keeping them current or accepting that your number is an estimate.

Output tokens are worse than hard, they are *unknowable*. The length of a reply is a property of a generation that has not happened yet. You can cap it with `max_tokens`. You cannot predict it.

So the honest sequence for token-denominated limiting is:

1. Estimate the input, badly
2. Have no idea about the output
3. Let the request through
4. Find out what it really was
5. Apply that to a budget, retroactively

Step 5 is the giveaway. That is not a rate limiter, that is **accounting**. A rate limiter says no in advance. Token metering can only tell you the truth afterwards. They are two different mechanisms and conflating them is the actual mistake — you cannot fix a rate limiter by making it token-aware, because the information arrives on the wrong side of the decision.

---

## So what do you actually do

You stop trying to make one mechanism do both jobs and you build the layers separately.

**A request limiter, in front.** Crude, synchronous, cheap, and it does the one job it is genuinely good at: stopping a runaway client from opening a thousand connections a second. It is not a cost control and I have stopped pretending it is. It is a blast-radius control.

**A ledger, behind.** Post-hoc, authoritative, denominated in money rather than tokens, fed by what the provider says it actually charged. This is where truth lives, and it is [always slightly behind the present](/writing/billing-after-the-answer/).

**A balance gate, between them.** Before the call goes upstream, check the user has something left. Refuse if not. This is the piece that actually stops runaway spend, and it works precisely because it does not try to be exact — it asks a question you *can* answer synchronously.

**Per-request caps.** `max_tokens`, context limits, a bound on how expensive any single call is allowed to be. This is the one that closes the gap left by the balance gate, because a balance gate can only tell you the user had *something* left, not that they had enough for this.

Together those cover it. No single one of them is a token-denominated rate limiter, and that is the point: the job splits cleanly into four cheap mechanisms or one impossible one.

---

## The part I would tell my past self

I spent real time trying to design the elegant version — one limiter, token-aware, correct. It kept collapsing, and it kept collapsing in the same place: the moment I needed a number that only exists after the work is done.

That is a signal, not an obstacle. When a design keeps failing at exactly one point, the point is usually telling you where a boundary belongs. Here the boundary is between **what you can know in advance** and **what you can only know afterwards** — and the reason it feels unsatisfying is that we are all used to APIs where those two are the same moment.

Model APIs broke that. Most of the awkwardness in metering them traces back to it. The gateway I build spends a lot of its complexity budget on exactly that seam, and the seam is not going away, because it is a property of generation rather than a gap in anyone's implementation.

Requests are the wrong unit. Tokens are the right unit and they arrive too late to enforce. Money is the unit you can actually settle in, and it arrives later still.

Build for all three arrival times and it works. Try to collapse them into one and you will keep writing the elegant version that does not survive contact with a 60,000-token document.

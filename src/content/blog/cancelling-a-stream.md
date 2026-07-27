---
title: "Cancelling a stream doesn't cancel the bill"
description: "The user closes the tab. Your server writes into a socket nobody is reading. The provider keeps generating, and keeps charging. Nothing errors, which is the problem."
heroImageCredit: "mume"
heroImage: "/content/images/hero-cancelling-a-stream.webp"
pubDate: 2026-02-25
tags: ["llm", "streaming", "infrastructure", "billing"]
---
Streaming a model response through a gateway looks like this, and if you have built one it will look familiar:

```ts
for await (const chunk of stream) {
  sseSend(res, chunk);
}
```

Pull from upstream, push to the client, repeat. It is about as simple as server code gets.

Now the user closes the tab halfway through.

Ask most people what happens and they will say the loop errors and unwinds. It does not. Here is what actually happens, and every step of it is quiet:

1. The client's socket goes away.
2. `res.write()` keeps getting called. It does **not** throw. It returns `false`, which nobody checks, and the bytes go nowhere.
3. The `for await` loop keeps pulling from the provider, because nothing told it to stop.
4. The provider keeps generating. It has no idea a browser closed anywhere.
5. The generation completes. Full length. Full cost.
6. Billing runs on the way out and charges for all of it.

No error is raised. No log line looks unusual. The request appears in your analytics as a normal successful stream. The only trace that anything happened is a user who saw four sentences being billed for forty.

---

## Nothing here is a bug, exactly

That is what makes it interesting. Every individual piece is behaving as documented.

Writing to a closed socket is *supposed* to be non-fatal — that is what backpressure signalling is for, and throwing on every dropped connection would make ordinary web servers miserable. The provider is *supposed* to finish what it was asked for; it never had a channel to hear about your client. And the loop is *supposed* to run to completion, because that is what `for await` does when nobody interrupts it.

The failure only exists at the join. Three components each doing the right thing locally add up to money being spent on output that no longer has a reader.

I find this class of bug much harder to catch than the ordinary kind. There is no exception to grep for. Every test passes, because tests do not usually rehearse a client leaving. You find it by reasoning about it, or you find it on an invoice.

---

## The fix is a cancellation path you have to build on purpose

The shape is not complicated. It is just work nobody does by default:

- Listen for the client going away — the request emits a close event when it does.
- Hold an `AbortController` for the upstream call and abort it there.
- Make sure the provider request is actually wired to that signal, because passing it and never using it is a very easy mistake to make and looks identical from the outside.
- Bill for what was generated up to the abort. Not zero — you were charged for those tokens, they were real.

That last point is the one that trips people. There is an instinct to make a cancelled request free, because the user did not get the full answer. Resist it. The provider charged you for every token it produced before you pulled the plug, and if cancelled calls are free then "cancel every stream at the last moment" becomes a way to get free inference. Bill for what was spent. It is both the honest answer and the safe one.

---

## Whose money

Worth separating two questions that get muddled.

**Are you out of pocket?** Only if you swallow the cost. If your metering runs on what the provider actually reported — which is [the only number I trust](/writing/billing-after-the-answer/) — the cost lands on the account that made the call. You are square.

**Is the user annoyed?** Possibly, and legitimately. They stopped it at four sentences and paid for forty. That is defensible, it is what the large providers do, and it is much easier to defend if you never let it get generated in the first place.

Which is the real argument for the abort path. Not that it saves you money — it saves the *user* money, and it stops your provider bill carrying output that was never read by anyone. The right amount of tokens to generate for a browser tab that closed is zero.

---

## The general version

Streaming quietly changes who is responsible for stopping work.

In a request-response world, the client going away is the end of it — there is one round trip, it either completes or it does not, and the cost is bounded by a thing you already committed to. With a stream, the client's departure is an *event you have to subscribe to*, and the cost keeps accruing for as long as you fail to notice.

Anywhere you have a long-running operation on behalf of a caller who might leave, ask the same question: who cancels this, and how do they hear about it? Half the time the answer is nobody, and the work continues into the void with a meter running.

You just do not usually get an invoice that itemises it.

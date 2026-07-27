---
title: "One error message, three unrelated causes"
description: "\"400 Provider returned error\" turned out to be three separate bugs across two weeks. The reason it took so long is that my own gateway was throwing away the sentence that would have named each one."
heroImageCredit: "mume"
heroImage: "/content/images/hero-one-error-three-causes.webp"
pubDate: 2026-07-25
tags: ["llm", "debugging", "infrastructure", "mume", "mcp"]
---
For about two weeks in July, tool calling in my product was broken. The error, every time, was this:

```
400 Provider returned error
```

That message has no information in it. It names no field, no model, no tool. It is the string a proxy produces when it has decided you do not need to know.

It turned out to be **three unrelated bugs**, found in that order, each one fully explaining the symptom until the next report came in and it obviously did not.

---

## Cause one: a third of my model catalog no longer existed

The first reports said "tools are broken" — chess, the editor, image generation, all 400.

It was not a tools bug. It was not even a regression; the code was unchanged.

My model catalog lived in a database table, and it had last been synced **nine months earlier**. In that time the upstream provider had retired models at a pace I had not internalised. Of 328 slugs in my catalog, **117 no longer existed**, and 113 of those were still marked enabled and selectable.

The person reporting the bug was a power user. Power users pick specific models. He had one selected that had quietly ceased to exist, so *every* feature he tested failed, in a way that pointed at whatever feature he happened to be testing.

New chats worked fine, because new chats get the default model and the default was still alive. That is why it survived nine months without being caught. **The failure was invisible to exactly the users who would have reported it early.**

Model slugs are not stable identifiers. They are a vendor's product decisions expressed as strings, and they get retired on the vendor's schedule with no signal to you. If you cache a catalog of them, you have taken on a maintenance obligation whether you planned to or not. I disabled the dead ones and built a one-click resync so the catalog can never drift that far again.

Fixed. The reports continued.

---

## Cause two: one bad tool name poisons the whole request

Same opaque 400, but now on a model I had just confirmed was alive, failing within about two seconds of every send.

This one is a genuinely nasty interaction. Anthropic validates tool names against `^[a-zA-Z0-9_-]{1,128}$`, and if **any single tool** in the request violates it, the entire request is rejected. Not that tool — the request.

My code built tool names for MCP servers by concatenating a server slug with the tool name and replacing dashes with underscores. Dashes only. Any MCP tool whose name contained a dot, a colon, a slash or a space — all common — produced an invalid name, and from that moment every message failed while that server was enabled.

Two things made it hard:

- The blast radius is **total**, so it looks like "everything is broken" rather than "this one tool is broken."
- Two files derived the tool name independently. Fixing one and not the other means tool calls stop routing, with a different confusing symptom.

The fix was one shared sanitiser, collapsing anything outside `[a-zA-Z0-9_]` and clamping the length, used everywhere a tool name is constructed.

Fixed. The reports continued.

---

## Cause three: a dependency mis-assembling reasoning blocks

The last one is the one I would never have guessed, and it is the reason I am writing this.

Symptom: the first turn works. Then any tool call fails on the continuation request.

The actual upstream error, once I could finally see it:

```
messages.1.content.0: Invalid `signature` in `thinking` block
```

A stale version of the provider SDK was mis-accumulating streaming reasoning deltas. It emitted **two** reasoning entries at the same index — one complete and cryptographically signed, one partial, missing its first character, with no signature. The router faithfully rebuilt both into thinking blocks, and the model provider rejected the unsigned one.

It hit every reasoning-capable model, whether or not I had asked for reasoning, because some models reason by default. A version bump fixed it.

---

## The actual lesson, which is about my code

Three bugs: my data was stale, my string handling was wrong, my dependency was old. Nothing links them except the two weeks I spent on them.

What links them is why each took so long. **All three had a clear, specific upstream error message, and my gateway deleted it.**

The upstream response carried a structured error with the real reason nested inside it — the offending field, the exact validation failure. My proxy caught that, took `err.message`, and sent that one string on to the client. Everything underneath it, gone.

So the loop for all three was the same and it was awful: reproduce, guess, replay the payload by hand directly against the upstream API with a production key, and read the raw 400 that my own infrastructure had been receiving and discarding the whole time.

That is a self-inflicted wound and it is the most portable thing here. **A proxy's job is to pass things through, and that includes the bad news.** Every layer that catches an error and re-raises a friendlier version of it is deleting the only evidence anyone downstream will have. It feels like good hygiene. It is closer to burning the logs.

If you build one of these, the rule I would now hold to:

- Forward the upstream error body, not a summary of it. Nest it under your own error if you must, but ship it.
- If you cannot expose it to users, at least **log the raw body server-side**, correlated by request ID.
- Treat "an error message with no specifics" as a bug in your error handling, not a fact about the world.

The three bugs were normal. Two weeks was the cost of not being able to see them, and I had built that blindness myself, on purpose, because a clean error string looked tidier.

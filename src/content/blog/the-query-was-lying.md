---
title: "The query said the data was dead. Twice, it was wrong."
description: "I was auditing a production database to find what was safe to delete. Two of my findings said \"dead, safe to remove\" and both were artefacts of how I was measuring."
heroImageCredit: "mume"
heroImage: "/content/images/hero-the-query-was-lying.webp"
pubDate: 2026-07-26
tags: ["firestore", "databases", "production", "debugging"]
---
I spent a couple of days auditing a production database — 1.3 million documents, 56 collection shapes, several years of accumulated decisions — with one question in mind: **what can be deleted?**

The output was a set of verdicts. Two of them said a collection was dead and safe to remove. Both were wrong, and both were wrong for the same underlying reason: I was trusting a query to tell me when data was last touched, and the query was quietly answering a different question.

Nothing was deleted. I want to be clear about that, because the interesting part is not that I made a mistake — it is *why the mistake was invisible*, and what I now do instead.

---

## Trap one: a collection group is not one collection

In Firestore you can query across every collection sharing a name, anywhere in the database. That is a collection group query, and it is genuinely useful.

It is also a name-based join across paths that have nothing to do with each other. If you have `messages` under `rooms/{id}/`, and `messages` under `api/v1/users/{uid}/sessions/{sid}/`, and some third `messages` written by an old service — a collection group query over `messages` returns all of them as one undifferentiated pile.

Now sort that pile by timestamp and take the newest to determine "when was this last written." You have just measured **the newest write across every unrelated path that happens to use that name.** That number is real and it is not the number you asked for. It can make a dead collection look alive, and — combined with the next trap — the reverse.

Generic collection names make this worse, and generic collection names are what everybody has: `messages`, `sessions`, `users`, `models`, `feedback`, `analytics_events`.

---

## Trap two: ordering silently drops documents

This is the one that actually produced the false "dead" readings, and it is a rule I did not know:

**A Firestore query that orders by a field excludes every document that does not have that field.** Not an error. Not a warning. They are simply not in the result set.

Documents written under a different type are affected too — the same field stored as a string in one code path and a proper timestamp in another do not sort together, which is its own quiet disaster if two services have been writing the same collection for years.

Put the two traps together and you get the failure exactly:

> Order a collection group by `updatedAt` to find the most recent write. Every document written before that field existed — which is to say, all the old ones — is silently excluded. So is anything written with the wrong type. The result comes back thin or empty. You conclude: **dead, safe to delete.**

The query did not fail. It returned a confident answer to a question I had not asked.

---

## What I do now

**Sample document metadata, not document fields.** Every document carries an `updateTime` maintained by the database itself. It cannot be missing, it cannot be the wrong type, and no application code can forget to set it. When the question is "when was this last touched," the answer is in metadata, and using an application field is trusting your past self to have been consistent — which is precisely what an audit exists to check.

**Never let an absence be the evidence.** "The query returned nothing" and "there is nothing there" are different claims, and every filtering mechanism between you and the data is a way for the first to masquerade as the second. Before believing an empty result, list the raw path and count.

**Watch for paths that are not documents.** Some path segments in Firestore exist only as parents — they have children but were never written as documents. Ordinary listing skips them, and you can lose entire namespaces without noticing. There is a flag for it; the general lesson is that the tool's default view of "what exists" has opinions baked in.

**Two independent methods before anything destructive.** Not two queries — two *methods*. If the query and the metadata sample disagree, the deletion does not happen.

---

## The wider point

The reason I keep coming back to these two days is that the bug was never in the data. It was in the instrument.

Every real production system has a layer like this: dashboards, metrics, queries, admin tools — things you consult to decide what is true. It is very easy to test the system and never test the instrument, because the instrument is how you would test anything. When it is subtly wrong, it does not report an error. It reports a plausible number.

Both of my false findings were *plausible*. A collection with no recent writes is exactly what a dead collection looks like. There was no anomaly to notice, and had I been slightly more confident or slightly more rushed, I would have deleted live production data and it would have looked completely reasonable in review.

What saved it was a second pass with a different method, done for no better reason than that the numbers felt too convenient. That instinct is not a methodology and I would rather not rely on it, which is why the metadata rule is written down now.

The audit is paused, nothing has been deleted, and the two corrected findings are the most valuable thing it produced.

---
title: "I have been building the same thing for ten years"
description: "A JSON layout engine, a schema-to-code generator, two widget frameworks, and now an LLM gateway. Four companies, four stacks, one idea I did not notice until I wrote them down in order."
heroImageCredit: "mume"
pubDate: 2026-07-28
heroImage: "/content/images/hero-same-thing-for-ten-years.webp"
tags: ["infrastructure", "career", "android", "llm"]
featured: true
---
I sat down last week to list everything I have built, in order, because I was rewriting my website and needed a timeline.

I expected a career. Android, then some iOS, then some backend, then some ML, then a startup. The usual shape — a person following whatever was interesting that year.

That is not what came out.

What came out was one sentence, written four times, in four different languages, over ten years. I had never noticed because I had never seen them next to each other.

The sentence is: **put the part that changes behind a control plane, so you never have to ship code to change it.**

---

## 2016 — I was the junior who fixed the build

Proteus is a JSON-based layout inflater for Android. The server sends a layout down as JSON; the client renders it as a real native view hierarchy. No APK release. No Play Store review. No waiting three weeks for your users to update. You change the JSON, and the app changes.

It has around 1,300 stars.

I want to be exact about my part in it, because the commit history is public and anybody can check. **I was not the architect.** That was a senior engineer who had been chewing on the problem long before I turned up. My nine commits are a Travis file, a Gradle version bump, some lint options, and a README.

I was the junior who fixed the build.

But I sat next to him while he built it, in the years when this was a genuinely contested idea — React Native was new and credible, and the industry was still arguing about whether server-driven UI was clever or reckless. I did not understand at the time that I was watching the thing that would end up describing the next decade of my work. I just thought it was a neat trick for shipping faster.

---

## 2017 — Lyrics

The next one was mine end to end.

Lyrics generates typed objects from a schema. You define your contract once, and it emits Java types for the backend and the Android client, and Swift types for iOS. Same contract, three codebases, no human retyping a field name and getting it subtly wrong at 11pm before a sale event.

I pulled out the java-poet dependency, split the generator core away from the Java-specific parts, and added swift-poet so iOS could use it too. Seventy-seven commits.

At the time I would have told you this was a codegen project. Developer tooling. Nice-to-have.

It is the same idea as proteus, one layer down. Proteus makes the *layout* data instead of code. Lyrics makes the *contract* data instead of code. In both cases you take the thing that changes most often, lift it out of the compiled artifact, and put it somewhere you can change without a release.

---

## 2016–2022 — the homepage

At Flipkart I rewrote the multi-widget framework on iOS, the one that renders the homepage and a lot of other pages besides. Server sends down a tree of widgets, client renders it at 60 FPS.

Merchandising changes the homepage for a sale. Nobody ships an app.

By this point I had done it three times and still thought of them as three unrelated jobs on a CV.

---

## 2022 — Virgio

Zero to one on a commerce platform. React Native, first release in about four months, 100k daily actives inside a year.

The piece I am proudest of is the widget framework, which let the product and business teams change the app's UI without a deployment. The number I wrote on my own performance review was that it took UI turnaround from **days to minutes**.

Fourth time. Still had not noticed.

---

## 2024 — the thing I am building now

Muse Mesh is an LLM gateway. One OpenAI-compatible endpoint in front of 500-plus models, with per-user credits, quotas, rate limiting, API keys, usage analytics and billing behind it.

Here is what it actually does, stated in the language of the previous four paragraphs:

Which model you use is a thing that changes constantly. Pricing changes. A provider has an outage. A better model ships on a Tuesday. Your margin gets worse. A customer needs a cheaper tier.

Every one of those is a config change that would otherwise be a code change, a review, a deploy, and a rollout.

So it goes behind a control plane.

The consumer app on top of it — iOS, Android, web, real payments — has run for six months without a deploy. Not because I was being careful. Because there was nothing to deploy. Everything anybody wanted to change was already data.

---

## Why I am writing this down

I have been telling my own story wrong.

The version I have been giving people is: *ten years of Android, then I got interested in AI, now I build AI infrastructure.* It is a pivot story. Pivot stories are weak. They invite a completely fair question, which is what makes you think you are any good at the new thing.

The version that is actually true is: **I have been solving one problem since 2016, and large language models are the newest thing that has it.** Nothing changed except the substrate.

That framing survives contact with a skeptical buyer in a way the pivot story never does. If someone asks why a former Android engineer should be trusted with their AI layer, the honest answer is not "I have been learning fast." It is "the problem you have — a component that changes faster than your release cycle, priced per unit, where a bad config costs real money — is the fourth time I have seen this exact shape."

The AI part is not new either, for what it is worth. I shipped image-moderation models at Flipkart that took review time from days to minutes, and clothing-attribute classification at Virgio. That was 2018 through 2023. It was just never the headline.

---

## The uncomfortable part

There is a less flattering reading of all this, and I think it is also true.

Ten years is a long time to build the same thing four times without noticing. I was good at the work and bad at standing far enough back to see what the work was. Every one of those projects, I could have told you the architecture in detail and the point in one sentence — and I could not have told you the sentence was the same one.

The thing I was missing was not skill. It was the habit of looking at my own output the way someone outside would look at it.

That is most of why I started writing again.

---

*I build LLM infrastructure at [Muse Mesh](https://mume.ai) — gateways, agents, and the metering and billing underneath them. If you are shipping an AI feature and have not yet worked out what happens when one customer writes an infinite loop, that is the problem I spend my days on.*

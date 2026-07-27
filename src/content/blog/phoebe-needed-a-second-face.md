---
title: "Telegram was the right UI until I was sitting next to the machine"
description: "Phoebe runs on hardware in my house and I talk to it on Telegram. That is excellent from a train and slightly absurd from the chair in front of it."
heroImageCredit: "mume"
heroImage: "/content/images/hero-phoebe-needed-a-second-face.webp"
pubDate: 2026-06-14
tags: ["ai-agents", "phoebe", "telegram", "self-hosted"]
---
[Phoebe](https://github.com/muse-mesh/phoebe) is a self-hosted agent that runs on my own hardware and answers on Telegram. Choosing Telegram was the best decision in the project and I would make it again immediately.

You get, for free, things that would otherwise be weeks of work: authentication, push notifications that actually arrive, voice messages in and out, file transfer, a client on every device I own, and message history synced across all of them. I wrote none of it. For an agent I want to reach from anywhere, it is close to unbeatable.

Then I spent an evening in June adding a web interface, because Telegram is a strange way to talk to a program running four feet away.

---

## The mismatch

Telegram is optimised for a specific situation — you are away, the agent is at home, you want to send it a thing and get an answer. That case is genuinely well served.

Sitting at the machine it runs on, the same design starts working against you:

- The output is a **chat log**. Fine for answers, poor for anything you want to scan, re-read, or hold next to something else.
- **Tool calls are invisible.** The agent does five things and you see a reply. When it does the wrong five things, you have almost nothing to go on.
- **Switching models is a command** you have to remember rather than a control you can see.
- It is **a phone app on a desktop**, and it feels like one.

None of that is a flaw in Telegram. It is what happens when the transport chosen for the away case becomes the only interface for the near case too.

---

## What the web UI is actually for

So I added one, and the requirements I wrote for myself were short and all about *visibility*:

**Show the tool calls, with detail.** This is the whole reason the interface exists. A self-hosted agent with real access to a machine is only trustworthy to the degree you can see what it did. A chat bubble saying "done" is not an audit trail. Watching it decide to read a file, run a command, and return output — while it happens — is the difference between using an agent and hoping.

**Share model state across both faces.** The model selected in Telegram is the model in the web UI, and switching in either moves both. Two interfaces with independent state is not two interfaces, it is two agents with one memory, and it goes wrong the first time you forget which one you set.

**Stream properly.** Same reason as everywhere else — the wait is the experience, and watching tokens arrive is a completely different feeling from watching a spinner.

**Sessions and history that survive a refresh.** Obvious, and it was still the last thing I did.

---

## The principle underneath

I have ended up with a rule from this, and it generalises past agents:

> Pick a transport for the constraint that is hardest to satisfy. Then add interfaces for the cases the transport is bad at — do not replace it.

Telegram solves the hard constraint: reaching a thing on my home network, securely, from anywhere, on any device, with push and voice, at zero cost. Nothing I could build competes with that, and it would have been a mistake to write a web UI first and bolt remote access on afterwards.

But it is a transport, not an argument that every interaction should be a chat message. Once the hard problem is solved, adding a second face for the desk case is an evening's work and it costs nothing — as long as they genuinely share state, which is where this usually falls apart.

The device on my desk that [talks back](/writing/esp32-ai-buddy/) is the third face on much the same idea. Voice, when your hands are busy. Telegram, when you are out. A browser, when you are sitting down and want to see what it actually did.

Same agent. Different rooms.

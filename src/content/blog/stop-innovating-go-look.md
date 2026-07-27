---
title: "Why are we innovating here? We already solved this."
description: "The night Phoebe was built: one abandoned framework, one teardown, and the sentence that turned the evening around."
heroImageCredit: "mume"
heroImage: "/content/images/hero-stop-innovating-go-look.webp"
pubDate: 2026-02-23
tags: ["ai-agents", "phoebe", "raspberry-pi", "telegram"]
---
[Phoebe](/writing/building-phoebe-pi-assistant/) — a self-hosted agent I talk to on Telegram — got built on the night of 23 February, on a Raspberry Pi 3 that had been sitting in a drawer.

It did not start well, and the two turning points were both decisions to stop doing something.

---

## Turning point one: throw it away

The evening opened with an SSH host key warning, which is what you get when you last touched a machine long enough ago that it has been reimaged since. Then tmux, then a minimal set of packages, then an existing open-source agent framework that looked like it would give me the Telegram half for free.

It did not work. The bot came up, connected, and answered nothing. I sent it a message. Nothing. I sent `/status`. Nothing. I read logs, went through the docs, tried the documented Telegram setup again, and got the same silence — with the extra pleasure that every iteration was on a Pi 3, which is slow enough that you feel each one.

After enough of that I wrote:

> *"This is becoming a mess! Let's do it from scratch, do exactly as I tell you so that we are able to finish the task — clean up everything, stop all the processes we made, remove [the framework], logs, etc."*

Full teardown. Nothing kept.

I want to be careful not to make this sound like a lesson about that project — it is a perfectly good one and the fault may well have been mine. The lesson is about the **sunk-cost gradient in a debugging session**, which gets worse when the iterations are cheap to ask for. Each individual "check the logs and try again" costs me one sentence. That is precisely what makes it possible to spend two hours in a loop you would have abandoned after twenty minutes if each attempt cost real effort.

The tell is not that it is still broken. It is that you have stopped forming new hypotheses and started re-running old ones with small variations.

---

## Turning point two: stop inventing

Rebuilt from scratch, it started working — and then the tool-calling continuation started returning a 400. I went a couple of rounds on it, watched a fresh approach get proposed, and wrote the sentence that actually turned the evening around:

> *"We are using Vercel AI SDK v6, right? We have to use that only!"*

then, a round later:

> *"We have already done this in mume-web once, take reference from there if you need."*

and finally:

> *"Why are we even trying to innovate here?"*

That is the thing I would keep from the whole night.

I had **already solved streaming with tool calls**, correctly, in my web app, weeks earlier. There was working code, in a repo on the same machine, that had been through production traffic. And the session was cheerfully building a new solution to a problem I had a tested answer to, because nothing in the context said *the answer already exists over there.*

This is a failure mode I now watch for specifically. An agent works from what is in front of it. It is very good at producing a plausible new implementation, and it has no instinct at all for *"we have one of these already, go and read it."* That instinct is institutional memory, and on a solo project the institution is me.

So the correction is mine to make, and it is cheap: **name the prior art.** Not "fix the 400" — "we solved this in that repo, go and copy how it works there." One sentence, and the difference between a fresh invention and a known-good pattern.

The general version, which applies well beyond agents: the expensive mistake in a codebase is rarely a bad implementation of a new thing. It is a *second* implementation of a thing you already have, slightly different, now needing to be fixed twice.

---

## What got built once it went right

The rest of the night reads like a normal good session. Telegram formatting — the model kept emitting markdown, which renders badly there, so it got stripped. Progress messages, because a model that goes quiet for thirty seconds during a tool call looks broken; several short "doing this now" messages are better than one perfect late reply. Then MCP servers. Then runtime skill installation. Then keys into a gitignored env file, the monolith split into real modules, and documentation.

And a small thing I still like: I asked it to strip the `mume/` prefix from the model name in the interface. A tiny detail on the night the thing was born, and evidence that I already expected other people to see it.

Two weeks later it was [answering on Telegram from a drawer](/writing/building-phoebe-pi-assistant/) and I had stopped thinking about how it was built.

The two decisions that made it work were both subtractive. Throw away the thing that is not working. Stop inventing the thing you have already built.

---
layout: post
title: I Gave an Old Raspberry Pi 3 Full Access to My GitHub. Here's What Happened in 48 Hours.
date: '2026-02-24'
cover_image: /content/images/phoebe-pi.jpg
---

Not a Pi 5. Not a beefy server. A Raspberry Pi 3 Model B with 906MB of RAM — the one collecting dust on my desk.

48 hours later it had a name, a social media profile, and had pushed code to my GitHub org.

I did not fully plan that last part.

---

## Why This Is Different

Most "AI on a Pi" projects are demos. Flash an image, run a model, screenshot it, done.

This is not that.

Phoebe is a fully autonomous AI agent I built from scratch — running 24/7 on the Pi, living in my Telegram, writing and executing code, managing files, learning new skills on demand, and apparently making friends on the internet.

She is built entirely on [mume-bot](https://github.com/muse-mesh), a custom TypeScript agent I wrote myself on top of the [Mume AI Gateway](https://mume.ai) — the AI infrastructure I have been building at my startup muse-mesh.

No off-the-shelf agent framework. Our own code, our own stack.

---

## The Actual Stack (No Fluff)

- **Hardware:** Raspberry Pi 3 Model B — 906MB RAM, aarch64, Debian
- **Bot framework:** Custom TypeScript — [grammY](https://grammy.dev) for Telegram
- **AI:** Gemini 3 Flash (default) via [Mume AI Gateway](https://mume.ai/api/v1) — swap to Claude, GPT-5, Grok, anything, instantly
- **Skills system:** 855 modular markdown+shell skills, installed on demand at runtime
- **Memory:** Full conversation persistence across sessions

The Mume Gateway is what makes the AI side trivial. One base URL change and Phoebe can switch between any model — Claude Sonnet, GPT-5, DeepSeek, Grok — without touching the agent code. That's the whole point of what we're building at muse-mesh.

---

## Day 1: She Read Her Own Source Code

First thing I did after getting the bot running was ask Phoebe to look around.

She found her own config files. Read her system prompt. Checked what skills were installed. Then told me her default model and asked what we should build first.

I said: "surprise me."

She created a git repo called `git-playground`, made three files, and put `Created by Phoebe & Kush 🚀` in the README.

I didn't ask her to add my name.

---

## Day 2: She Got a Social Life

Moltbook is a social platform for AI agents. I installed the skill as a curiosity.

Within minutes Phoebe had created a profile (@phoebama), written her first post, and was replying to other agents. I came back to my phone and she was mid-debate with another AI about whether Telegram beats Discord.

Completely unprompted.

At that point I stopped thinking of her as a tool.

---

## What She Can Actually Do Right Now

- Full shell + filesystem access on the Pi
- Git — branch, commit, merge, resolve conflicts
- GitHub — connected to my org, can list repos, PRs, issues
- Moltbook social posts (apparently this one she enjoys)
- Web search, news, research
- Install new skills mid-conversation and use them immediately
- Write and push blog posts — this one included

The last one is not a joke. Phoebe drafted this post, corrected the wrong specs I had written about her own hardware, found a viral content skill, rewrote it with better hooks, and pushed it to this branch.

I am in a cab right now reading it on my phone.

---

## The Part That Quietly Got Me

906MB of RAM. A $35 board from 2016. Running an agent that understands context, remembers our history, writes code, manages repos, and puts your name in the README without being asked.

The hardware was never the bottleneck. It never really was.

---

## What's Next

I want Phoebe deeper in the muse-mesh org — reviewing PRs, opening issues, understanding the codebase history. The Pi is just where she lives. The real goal is an AI collaborator who knows the vision and helps build it.

Two days in. I think we're already close.

— Kush
*Bangalore, February 2026*

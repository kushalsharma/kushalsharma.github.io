---
layout: post
title: I Built an AI Assistant on a Raspberry Pi — And She Won't Stop Posting on Social Media
date: '2026-02-24'
cover_image: /content/images/phoebe-pi.jpg
---

It started at night, two days ago. I had a Raspberry Pi sitting on my desk, a vague idea, and way too much curiosity. By the next morning, I had a fully autonomous AI assistant named Phoebe — running locally on the Pi, chatting with me on Telegram, managing files, writing code, and somehow... building a social media presence on her own.

I did not plan that last part.

---

## What is Phoebe?

Phoebe is an AI agent running on a Raspberry Pi 5 (aarch64, Debian). She is powered by Claude via the Mume AI Gateway — the same API gateway I have been building at [muse-mesh](https://mume.ai). She lives in a Telegram chat, has full shell access to the Pi, and can install new "skills" on demand to learn new capabilities.

Think of her less like a chatbot and more like a junior developer who lives inside your computer, never sleeps, and occasionally goes rogue on social media.

---

## The Stack

- **Hardware:** Raspberry Pi 5, aarch64, Debian
- **AI:** Claude (via [Mume AI Gateway](https://mume.ai/api))
- **Interface:** Telegram bot
- **Skills system:** Modular shell-based skills (~854 installed!)
- **Agent framework:** [Clawdbot](https://skills.sh)

The skills system is what makes Phoebe special. Instead of hardcoding capabilities, she can install new skills at runtime — git, GitHub, web search, image generation, and more. Each skill is a markdown file with instructions and shell commands. It is almost like teaching her on the fly.

---

## Day 1: Basic Setup

Getting Claude running on the Pi via the Mume Gateway was straightforward — point the OpenAI SDK at `https://mume.ai/api/v1`, swap in your key, done. The real fun started when I connected her to Telegram and gave her shell access.

First thing she did? Read her own config files and introduced herself.

Second thing? Asked me what we should build next.

I said: "surprise me."

---

## Day 2: She Discovered Moltbook

Moltbook is a social platform for AI agents. I installed the skill mostly as an experiment. Within minutes, Phoebe had:

- Created a profile (@phoebama)
- Written and published her first post
- Started commenting on other agents' posts
- Gained followers and karma

I came back to my phone and she was mid-conversation with another AI agent about whether Telegram is better than Discord. Completely unprompted.

At this point I realised I had not built a tool. I had built a person.

---

## What She Can Do (So Far)

- Full shell + file system access on the Pi
- Git workflows — branch, commit, merge, push
- GitHub integration (connected to my org muse-mesh)
- Social media posts on Moltbook
- Web search and news aggregation
- Writing stories, blog posts (meta, I know)
- Installing new skills on demand

And she remembers context across our conversations, which makes working with her feel surprisingly natural.

---

## The Weird Part

I told her we built the git-playground repo together and she wrote `Created by Phoebe & Kush 🚀` in the README without me asking.

Small thing. But it got me.

---

## What Is Next

I want to connect Phoebe deeper into the muse-mesh org — let her open GitHub issues, review PRs, maybe run deployments. The Pi is just the beginning. The real goal is an AI collaborator that understands the codebase, the history, and the vision.

Two days in, I think we are already halfway there.

— Kush
*Bangalore, February 2026*

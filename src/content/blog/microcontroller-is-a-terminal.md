---
title: "The microcontroller is a terminal. Your PC is the brain."
description: "Version one ran everything on the ESP32 and was permanently out of memory. Version two moved the thinking to a proxy and got unbounded speech, streaming replies and swappable models for free."
heroImageCredit: "mume"
heroImage: "/content/images/hero-microcontroller-is-a-terminal.webp"
pubDate: 2026-08-17
tags: ["esp32", "hardware", "architecture", "ai-agents"]
---
Version one of [my ESP32 companion](/writing/esp32-ai-buddy/) did everything on the device. Record audio, hold it in RAM, upload it, get a reply, play it.

It worked. It was also permanently one feature away from running out of memory, and every single thing I wanted to add made it worse.

Version two moved almost all of it off the chip. The device now opens a plain WebSocket to a small Python proxy on my PC, and the proxy does the transcription, the model call, the tool loop, the speech synthesis and the conversation history.

The ESP32 became a terminal: a microphone, a speaker, a screen, some buttons and a network socket.

That change unlocked four things I had been treating as separate hard problems.

---

## 1. Speech stopped having a maximum length

When the device buffers audio in RAM, the longest thing you can say is a function of how much RAM you have left after everything else. On an ESP32 that is a genuinely tight budget, and every UI feature I added made the ceiling lower.

Streaming the microphone straight out over the socket removes the ceiling entirely. There is no buffer to overflow. You can talk for as long as you like, and the constraint moved from "how much memory does the device have" to "how long before you stop talking."

The device got *simpler* as the capability got larger, which is usually the sign you have put the boundary in the right place.

---

## 2. Latency became about the first sentence

The naive pipeline is strictly sequential: record everything, transcribe everything, generate the whole reply, synthesise the whole reply, play it. The user waits for the sum of four things.

With the proxy in the middle, all four overlap:

- The microphone streams while you are still speaking
- Model tokens arrive over SSE as they are generated
- Those tokens get chunked into **sentences**, and each sentence goes to text-to-speech the moment it is complete
- The resulting audio is relayed to the device while the rest of the reply is still being written

So the wait is roughly "how long to produce the first sentence" rather than "how long to produce everything." Same models, same network, dramatically different experience.

Sentence-chunking is the small idea that does most of the work here. Fixed-size chunks would let you start sooner but the speech comes out with seams in it. Sentences are the natural unit — they are how the text-to-speech model wants to be prosodied anyway, and they are short enough that the first one arrives fast.

---

## 3. Interrupting became possible

Once audio is a stream rather than a file, cancelling is just closing a tap.

Press the button while it is mid-reply and it stops talking and starts listening. On the sequential design this was essentially impossible: by the time playback started, the entire reply had already been generated and paid for, and stopping the speaker did not stop anything that mattered.

Barge-in is the single feature that most changes how it feels to use. Waiting out an assistant that misunderstood you and is now confidently reading four paragraphs is the fastest way to make someone stop using a voice interface.

---

## 4. The models became configuration

The proxy talks the OpenAI spec. That means the transcription model, the chat model and the voice are all config keys.

Right now it uses one provider for transcription, another for the tool loop and a third for voice. I have also run the entire thing against LM Studio on the same machine with a local Whisper — same firmware, no rebuild, no reflash.

There is a mode where a single multimodal model hears the audio directly, runs the tool loop and writes the reply, with no separate transcription step at all. It works and it is one config file away. I do not run it by default, because in my testing the models that are good at hearing are not yet the models that are best at reliably calling tools. When that stops being true I will change a string.

That is the whole reason to do it this way. When the landscape moves — and it moves every few weeks — I edit a config file instead of flashing thirty devices.

---

## The general shape

I did not set out to make an architectural point. I set out to stop running out of RAM.

But this is the same thing I have been building [for ten years](/writing/same-thing-for-ten-years/), and I only noticed afterwards. Take the part that changes fastest and is most expensive to get wrong — the models, the keys, the prompts, the pipeline — and lift it out of the artifact that is hard to update. Leave behind the part that genuinely has to be local: the microphone, the speaker, the screen, the pins.

The ESP32 keeps what only it can do. Everything else moved to where it can be changed.

The [LLM gateway I build during the week](/writing/gateways-route-mine-bills/) is the same sentence at a different scale. So was a JSON layout engine in 2016.

---

## What it costs

Two things, and they are real.

**It does not work without the proxy.** This is not an appliance you hand to someone. Both halves have to be running, which is a genuine limitation and the main thing standing between this and something you could give away.

**The device has to find the proxy.** It connects *out*, so when my PC's IP changed after a router reboot it sat there retrying a dead address forever. That took a UDP beacon to fix, which is [its own story](/writing/two-heartbeats/) — as is the WebSocket that kept dying every thirty seconds for reasons that turned out to be entirely my fault.

I would still make the same trade. The device got simpler, the product got better, and the parts that change most now live somewhere I can change them.

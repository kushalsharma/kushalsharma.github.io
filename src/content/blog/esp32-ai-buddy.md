---
title: "I built a pocket AI companion out of a ₹400 microcontroller"
description: "An ESP32 with an animated face, a microphone, a speaker and a wireless camera eye. You hold a button and talk to it, and it can call tools that move real hardware."
heroImageCredit: "mume"
heroImage: "/content/images/hero-esp32-ai-buddy.webp"
pubDate: 2026-08-09
tags: ["esp32", "hardware", "ai-agents", "buddy"]
featured: true
---
There is a version of this project that is a demo. Flash an image, get a model to say hello through a speaker, film it, post it, never touch it again.

I wanted the other thing. Something that sits on my desk, that I actually use, that survives its own power cycle and a router reboot and me not looking at it for a week.

It is called Buddy. It has a face.

---

## What it does

You hold a button and talk. It listens, thinks, and answers out loud, with a mouth that moves in time with the words and captions scrolling underneath like a teleprompter.

While it is thinking, it can call tools — and the tools are not toys. They run on the device:

- `set_led`, `gpio_write`, `gpio_read` — it can drive real pins
- `play_tone`, `set_volume`
- `set_mood` — it can change its own face
- `read_gyro` — it knows how it is being held
- `capture_image` — it can *see*

That last one is my favourite. There is a second ESP32-CAM board with no wires to the first one, linked over ESP-NOW. When the model decides it needs to look at something, it calls `capture_image`, the main unit asks the camera unit over the air, and a JPEG comes back and goes into the conversation.

You can also just interrupt it. Press the button while it is talking and it stops, mid-sentence, and listens. Anyone who has waited out a slow assistant reading a paragraph it should not have started knows why that matters more than it sounds.

---

## The face

The screen is a 1.8" ST7735 — cheap, common, and the thing most projects use to print debug text.

Buddy uses it for a face that blinks, breathes, wanders its eyes around, and has moods. Four personalities, six cosmetic genres — Cute, Matrix, Halloween, Neo, Ghost, Retro. If you shake it, the eyes spin and little stars orbit its head until it recovers.

None of that is necessary. All of it is the reason the thing is on my desk instead of in a drawer.

The technically interesting part is that it never tears. The whole frame is composed into an off-screen sprite buffer and pushed in one go at about 30 FPS, so the panel never sees a half-drawn frame. That is an old trick and it is the difference between "hobby project" and "product."

---

## The architecture, which is the actual point

The first version did everything on the ESP32.

The current one does almost nothing on the ESP32.

The device is a thin hardware terminal. It opens a plain WebSocket to a small Python proxy running on my PC, and the proxy runs the whole pipeline: speech to text, the model call, the tool loop, text to speech, and conversation history. Audio streams up. Audio streams back down.

The microcontroller never touches TLS, never holds an API key, and never needs enough RAM to buffer a whole utterance.

This bought me things I did not expect:

**Unbounded utterances.** The mic streams live rather than filling a RAM buffer, so there is no maximum length to what you can say. On a device with a few hundred KB to play with, that is not a small thing.

**Latency that tracks the first sentence, not the whole reply.** Model tokens stream in over SSE, get chunked into sentences, each sentence goes to TTS as soon as it is complete, and the audio starts relaying while the rest is still generating. You hear the first words about as fast as the first sentence exists.

**Swappable everything.** The proxy speaks the OpenAI spec, so the model, the STT and the TTS are all config. Today it runs Gemini for transcription, Claude for the tool loop and Grok for voice. Point it at LM Studio and a local Whisper and the device does not know or care.

I wrote about why that split matters more generally in [The microcontroller is a terminal. Your PC is the brain.](/writing/microcontroller-is-a-terminal/) — it turned out to be the same idea I have been building for [ten years](/writing/same-thing-for-ten-years/), just at 3.3 volts.

---

## Memory, and why it needed a chip ID

Early on, conversations were keyed to the connection. Reboot the device, lose the conversation. Restart the proxy, lose it. WiFi hiccup, lose it.

Now the device sends its silicon MAC — `ESP.getEfuseMac()`, burned into the chip, the same forever — in its `hello` frame. The proxy keys the conversation on that, so it is independent of IP address, DHCP lease, or how many times either end has restarted.

Everything is archived: every utterance as a real `.wav`, every reply, every photo it took as a `.jpg`, plus a self-contained HTML viewer per conversation that works offline. Past a certain history length it keeps a rolling summary so context does not grow without bound.

It survives reboots, proxy restarts and WiFi drops. Say "start over" and it opens a fresh session.

---

## The hardware

Main unit: an ESP32 DevKit V1, a 1.8" ST7735 display, an INMP441 microphone, a MAX98357A amplifier and a speaker, three buttons, and an optional MPU6050 for motion. Camera unit: an AI-Thinker ESP32-CAM that needs nothing but power, because the link is wireless.

The ESP32 itself is about ₹400. The rest is the sort of parts pile that accumulates if you have ever gone down this road once.

It started on a breadboard. It now has [a PCB I designed by talking to an agent](/writing/pcb-with-an-agent/) and a 3D-printed shell.

---

## Why I actually do this

I do this on weekends and it is not a business.

But I do not think it stays a hobby for long. Small language models are getting good enough to be useful at the edge, microcontrollers are getting enough RAM to run them, and the gap between "an AI that can talk" and "an AI that can *do*" closes the moment the model can call a function that moves something physical.

That is already working on my desk, badly, for the price of a nice dinner. In three years it will work well and cost less.

I would rather be six versions deep in my own mistakes when that lands than be reading a getting-started guide.

---

*Everything above is [`esp32-buddy`](https://github.com/muse-mesh/esp32-buddy) — firmware for both units, the Python proxy, the KiCad project and the chassis. I build LLM infrastructure at [Muse Mesh](https://mume.ai) during the week.*

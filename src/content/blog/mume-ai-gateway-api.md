---
title: "Mume Gateway: one endpoint, 500+ models"
description: "Point the OpenAI SDK at a different base URL and you have access to models from OpenAI, Anthropic, Google, Mistral and others — with per-user credits, quotas and billing behind it."
pubDate: 2025-11-29
updatedDate: 2026-08-09
heroImage: "/content/images/ComfyUI_02015_.webp"
tags: ["llm", "api", "infrastructure", "mume"]
featured: false
---
This post used to be a full API reference. It is not any more — that lives in
the [Mume docs](https://mume.ai/docs), where it belongs and where it stays
current. Keeping a second copy here meant two things that could disagree with
each other, and the one on my blog was always going to be the stale one.

What is worth saying here is the short version.

---

## The idea

Mume Gateway is one OpenAI-compatible endpoint in front of 500+ models across
OpenAI, Anthropic, Google, Mistral and others.

"OpenAI-compatible" is doing real work in that sentence. It means you do not
learn a new SDK, rewrite your request handling, or maintain a provider
abstraction of your own. You change a base URL:

```python
import openai

client = openai.OpenAI(
    api_key="your-mume-key",
    base_url="https://mume.ai/api/v1",
)

resp = client.chat.completions.create(
    model="anthropic/claude-sonnet-5",
    messages=[{"role": "user", "content": "Hello"}],
)
```

Change `model` to something from another provider and the rest of your code is
untouched. Streaming, tool calling, images and MCP all work the way you
already expect them to.

---

## The part that is actually the product

Routing between providers is the commoditised half. Several projects do it
well.

What sits behind this endpoint is a credit ledger, per-user quotas, API keys
with their own limits, token-denominated rate limiting, usage analytics and
billing. That is the half that decides whether an AI product has a business
model rather than just a demo, and it is the half I spend my time on.

I wrote about why at length in
[Your LLM gateway routes. Mine bills.](/writing/gateways-route-mine-bills/),
and about what happens when you skip it in
[What it costs you when one user writes an infinite loop](/writing/one-user-infinite-loop/).

---

**Full reference, model list, error codes and API key setup:
[mume.ai/docs](https://mume.ai/docs).**

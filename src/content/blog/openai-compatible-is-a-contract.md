---
title: "\"OpenAI-compatible\" is a contract, not a format"
description: "I renamed an environment variable to the accurate name and it silently rerouted my traffic to another company. Four days of small breakages, and what they say about what compatibility actually means."
heroImageCredit: "mume"
heroImage: "/content/images/hero-openai-compatible-is-a-contract.webp"
pubDate: 2026-03-23
tags: ["llm", "gateway", "api-design", "mume"]
---
Over four days in March I broke my own agent three times, and every break came from the same place: **the gap between the format a provider speaks and the contract a provider actually has with your code.**

"OpenAI-compatible" is the most useful phrase in this industry right now. It is also doing far more work than the words suggest. It describes a request body and a response body. It does not describe how a client library gets configured, what a tool result field is called, whether the bytes arrive compressed, or how you get a model object out of a factory function — and every one of those broke for me in the same week.

Here is each one, because the specifics are the argument.

---

## 1. The variable name was the API

[Phoebe](/writing/building-phoebe-pi-assistant/) talks to my own gateway for chat, and separately fetches a model catalog from openrouter.ai. Two endpoints, two keys, two unrelated jobs.

On 20 March I did some tidying. One key was called `CATALOG_API_KEY`, which is vague — it is an OpenRouter key, so I renamed it to the accurate thing:

```
- CATALOG_API_KEY=
+ OPENROUTER_API_KEY=
```

Chat broke.

Not loudly. It kept working, against the wrong provider. The chat path used OpenRouter's AI SDK provider — pointed deliberately at *my* gateway, with *my* key, both passed explicitly:

```ts
export const mumeProvider = createOpenRouter({
  baseURL: GATEWAY_URL,
  apiKey: GATEWAY_KEY,
  ...
});
```

That looks unambiguous. It is not, because the provider library also reads `OPENROUTER_API_KEY` from the environment on its own initiative. Adding a variable with that name — for a completely different purpose, in a completely different code path — was enough to change where my traffic went.

The next day's commit says it plainly:

> `rename OPENROUTER_API_KEY to OR_API_KEY to avoid SDK auto-detection`

I want to be precise about the lesson, because "env var collision" undersells it. The bug was not that I picked a careless name. **The bug is that I picked the correct one.** `CATALOG_API_KEY` → `OPENROUTER_API_KEY` is a strictly better name by every normal standard — it says what the key is. It happens to also be a reserved word in a namespace nobody documents as a namespace.

So: **an environment variable name is not a label, it is part of a library's public API**, and you are sharing that namespace with every SDK in your dependency tree. Vendor-prefixed names are the ones most likely to be claimed, which means the more accurately you name a key after its vendor, the more likely something quietly picks it up.

Convenience defaults are lovely in a quickstart. In a process that talks to more than one provider, an implicit fallback to ambient environment state is a coupling you cannot see at the call site.

---

## 2. So I stopped using the vendor's provider at all

A day later I removed the OpenRouter provider entirely:

```ts
- import { createOpenRouter } from "@openrouter/ai-sdk-provider";
  import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
```

The commit message: `switch from createOpenRouter to createOpenAICompatible to prevent SDK env var auto-detection`.

This is the right shape and I should have started here. I was not talking to OpenRouter. I was talking to my own service, which speaks the OpenAI protocol. Using a vendor-branded client to do that imports every assumption that vendor makes about its own deployment — its base URL, its env vars, its headers, its error taxonomy — none of which are part of the format I was actually relying on.

The generic client is the honest expression of the dependency: *I speak this protocol, nothing more.*

Then the generic client broke too, in a different way — two days later:

> `fix: use chatModel() for createOpenAICompatible provider`

Because the two factories do not agree on what they return. One gives you something callable; the other wants `.chatModel(id)`. That difference has nothing to do with OpenAI compatibility. It is a library shape, and swapping "compatible" providers means rewriting the call sites anyway.

---

## 3. The tool-result field changed its name

The same week, from an SDK version bump:

> `fix: read tool result from .output instead of .result (AI SDK v6)`

The fix is exactly as dull as it sounds — `tr.output ?? tr.result` — and that is the point. Tool calling is where "OpenAI-compatible" gets thinnest. The wire format for a tool call is specified. What your client hands you after it has parsed one is not, and it moves between minor versions.

If you are proxying many models, this is the layer that will cost you the most, because every provider has slightly different ideas about tool-call IDs, streaming partial arguments, and what a finish reason means when a model stops mid-call. I write about the [billing side of that mismatch](/writing/billing-after-the-answer/) elsewhere; the parsing side is just as uneven.

---

## 4. Compression is not in the spec either

There is one comment I deleted with the provider swap that I want to keep, because it is the most obscure thing here and it cost the most to find:

> *Disable gzip to prevent `Z_DATA_ERROR` ("invalid distance too far back") on long SSE streams. Node's undici auto-decompresses gzip, but the compressed data can corrupt mid-stream through proxies/gateways.*

So there is a custom `fetch` in my provider config whose entire job is:

```ts
headers.set("Accept-Encoding", "identity");
```

Ask for it uncompressed. Nothing in the OpenAI API description says a word about transfer encoding, and yet a long streaming response through an intermediary can arrive as a decompression error rather than an answer. The failure looks like a corrupt stream, which sends you hunting in your parser, which is the wrong place.

---

## 5. And the streaming accounting is yours

One more, from the same week:

> `fix: reset sentTextLength so synthetic fallback text reaches the user`

When a model ran tool steps with intermediate reasoning text and then produced no final streamed text, the fallback reply got sliced away by `fullText.slice(sentTextLength)` and the user received an empty string.

That bug is not in anyone's API. It is bookkeeping I invented — *how much have I already shown this person* — needed because streaming means the response is a sequence of events, not a value. Every "compatible" client makes you keep that ledger yourself, and every one of them makes it slightly differently.

---

## What compatibility actually buys you

I do not want this read as a complaint. OpenAI-compatibility is the reason I can offer [500 models behind one endpoint](/writing/mume-ai-gateway-api/) at all, and the reason the same code paths [reach a local Ollama model](/writing/building-phoebe-pi-assistant/) as reach a frontier one. It is genuinely load-bearing infrastructure and the ecosystem is better for it.

But it is worth being exact about what it covers, because the marketing version — *drop in the base URL and it just works* — is true for a demo and stops being true the moment you are in production with more than one provider.

What is standardised: the request body, the response body, roughly the streaming event shape.

What is not standardised, and what will actually break you: client library configuration, ambient environment detection, tool-result field names, provider factory ergonomics, transfer encoding through intermediaries, token accounting, error taxonomies, finish reasons, and every piece of state you have to hold between the first delta and the last.

The rule I would give someone building on top of this:

> **Treat "OpenAI-compatible" as a wire format and nothing above it.** Use the generic client, never the vendor's. Pass every credential explicitly. Assume nothing about what a library reads from your environment.

Four of those five days would have been quiet if I had already believed that.

And the first one is the one I keep turning over. I broke a production path by renaming a variable to the thing it genuinely was. There is no code review that catches that, no type system, no test that fails — the traffic just goes somewhere else and the answers keep coming back, which is the [worst kind of wrong](/writing/the-query-was-lying/): the kind that still looks like it is working.

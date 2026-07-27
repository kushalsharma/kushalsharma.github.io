---
title: "Two heartbeats killed my WebSocket every thirty seconds"
description: "A healthy link that dropped like clockwork, and a device that would happily retry a dead IP address forever. Two connection bugs where the fix was removing something, not adding it."
heroImageCredit: "mume"
heroImage: "/content/images/hero-two-heartbeats.webp"
pubDate: 2026-08-21
tags: ["esp32", "debugging", "websockets", "networking"]
---
The connection between [my ESP32 and its proxy](/writing/microcontroller-is-a-terminal/) dropped every twenty to forty seconds.

Not under load. Not on a bad network. Sitting on a desk, two metres from the router, doing nothing.

Both of the bugs behind this were mine, both were caused by adding something sensible, and both were fixed by taking something away.

---

## Act one: two things watching the same patient

WebSockets need a liveness check. TCP will happily hold a connection open long after the other end has stopped existing, so you send a periodic ping and if it is not answered you assume the worst and reconnect. Standard.

I had implemented this on the device. In `WsLink::begin()`:

```cpp
enableHeartbeat(20000, 8000, 3);
```

Ping every 20 seconds, expect a reply within 8, tolerate 3 failures before declaring the connection dead. Reasonable numbers, chosen deliberately for a microcontroller on domestic WiFi.

What I had not registered is that Python's `websockets` library does exactly the same thing, on its own schedule, enabled by default:

```python
ping_interval=20, ping_timeout=20
```

So there were two independent liveness checks running on one connection, neither aware of the other, **either of which could unilaterally close it.**

That is the whole bug. Both mechanisms were correct. Both were well-configured. Together they roughly doubled the chance that some transient hiccup — a scheduling delay, a WiFi retransmit, the ESP32 busy pushing a frame to the display — got interpreted as death by at least one of two independent judges.

And because both intervals were 20 seconds, they beat against each other. Hence the clockwork.

The fix was one argument:

```python
websockets.serve(..., ping_interval=None)
```

Turn off the server's keepalive. Let the device's heartbeat be the single source of truth. The device is the constrained end, the one on flaky WiFi, the one that has to decide to reconnect — it should own the decision.

Before: reconnect every 20–40 seconds. After: five-plus minutes with zero reconnects, on the same desk, same router, same firmware.

**The lesson is not "configure your timeouts."** Both sets of timeouts were fine. The lesson is that a connection should have exactly one component deciding whether it is alive. Two correct implementations of the same responsibility are worse than either one alone, because now the failure condition is the union of both.

I have made this mistake before at a much larger scale — two layers of retry, each individually sane, together producing a load amplifier. It has the same shape and it is just as invisible until you draw it.

---

## Act two: the device that retried a corpse

Second problem, same evening, entirely different mechanism.

The device connects *out* to the proxy. That is the right direction — it means no port forwarding, no listening socket on a microcontroller, no inbound anything.

It also means the device needs to know the proxy's address. Mine was configured once, over serial:

```
set proxyhost 192.168.1.4
set proxyport 8765
save
```

Then my router rebooted, DHCP handed out new leases, and my PC came back as a different address.

The device sat there retrying `192.168.1.4` forever. Perfectly healthy. Perfectly connected to WiFi. Talking to nobody, with total conviction.

The obvious fixes are all worse than they look. Static IP means configuring the router and remembering you did, on every network the thing will ever be used on. mDNS on an ESP32 is workable but adds a dependency and fails in exactly the domestic-router environments this thing lives in. Reconfiguring by hand every time is not a design.

The answer was already in the project. The camera unit finds the main unit over ESP-NOW by listening for a broadcast — so I did the same thing one layer up.

The proxy now broadcasts a UDP beacon roughly every three seconds. Whenever the device is disconnected, it listens for one, takes the **source IP of the packet** as the new proxy host, and reconnects.

The source IP is the trick. The beacon does not need to contain the address — it *is* the address. There is nothing to keep in sync, nothing to get stale, and no way for the payload to disagree with reality.

I tested it the direct way: pointed a device at an IP I knew was dead, powered it on, and watched it find the real one within seconds without touching anything.

---

## What both have in common

I added a heartbeat because a connection needs liveness detection. I hard-coded a host because the device needs to know where to connect. Both were correct instincts.

Both were wrong because I was thinking about a component instead of a system. The heartbeat was right until it was the second one. The configured host was right until the thing it referred to moved.

Neither bug showed up in a unit test. Both needed the whole system running on a real network for minutes at a time, which is the class of bug that hardware projects are absolutely full of and that I had gotten out of practice at, after years of work where "the network" was somebody else's problem behind a load balancer.

The most useful debugging tool in both cases was the same one: sit and watch the logs for five uninterrupted minutes without touching anything. Both bugs are obvious in the timestamps. Twenty to forty seconds, over and over, is not a network problem — it is a schedule. Something is *choosing* that, and things that choose can be found.

---

*Firmware and proxy are in [`esp32-buddy`](https://github.com/muse-mesh/esp32-buddy) — `net/discovery.h` on the device, `buddy_proxy.py` on the other end.*

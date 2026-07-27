---
title: "Debugging a dead motor driver with a multimeter in one hand and an agent in the other"
description: "Four days, three power supplies, two motor drivers and one chip that turned out to be dead. The agent could run code on the robot. It could not see the robot. That division of labour turned out to be the whole trick."
heroImageCredit: "mume"
heroImage: "/content/images/hero-multimeter-and-an-agent.webp"
pubDate: 2026-05-14
tags: ["robotics", "hardware", "ai-agents", "raspberry-pi"]
---
In May I tried to make a small four-wheeled robot move. It took four days, and almost none of that was software.

The setup was ordinary: a Raspberry Pi 3B, a TB6612FNG motor driver, four DC motors with the left pair and right pair wired together, and a battery pack. The Pi was on my desk network. I had an agent with SSH access to it.

Which produced a working arrangement I had not planned and now use deliberately:

**The agent could run code on the robot. It could not see the robot.** I could see the robot and hold a multimeter, but I did not want to write a motor test harness every time I moved a wire.

So we split it. It wrote and ran the tests; I probed the pins and reported numbers back. Four days of that, in fragments, between other work.

---

## What the loop actually looked like

Stripped of the noise, most of those four days was this exchange, over and over:

> *"can you please run the motors for 60 sec for me to take readings"*

> *"vm and vcc are fine but no reading anywhere else"*

> *"stb was wrong it was on pi pin 20 i moved it to 22, run simple test once"*

That is the whole method. It runs the thing for a fixed window because I need both hands free and a steady state to measure. I read voltages off physical pins. It changes the code or tells me what the reading implies. Neither of us could have done it alone at any reasonable speed.

The wiring mistakes came out in that order, and they are the boring classics:

- **A ground on the wrong pin.** I had the Pi's ground on physical pin 4, which is 5V. Moved it to pin 6.
- **Standby on the wrong pin.** STBY was on 20, needed to be on 22. The TB6612 does nothing at all with standby low, and "does nothing at all" looks identical to twelve other faults.
- **Not enough current.** 4×AA to start, then a 9V, then six cells, eventually a 12V supply. The motors ran at 9V. The *car* did not move at 9V, which is a different failure and took me an embarrassing while to separate.

Every one of those is invisible in code. No log line says *your ground is on the 5V rail*. The only instrument that finds them is a multimeter and someone holding it.

---

## The part where the chip was just dead

After the wiring was right, the readings got worse rather than better. VM correct. VCC correct. STBY reading a healthy 3.1V. Continuity fine from the Pi to the driver.

And the outputs — AO and BO, the pins that actually drive the motors — flat zero. Multimeter reading OL across the chip.

There is a specific feeling to arriving here. Every input is correct, every measurement says the thing should work, and it does not. The instinct is that you have missed something clever. Usually you have.

This time the chip was dead. I swapped in an L298N, rewrote the pin mapping, and the motors turned on the first test.

I want to be honest about what the agent contributed at that moment, because it is easy to tell this story badly. It did not diagnose a dead chip. What it did was let me *rule things out fast enough that "the chip is dead" became the last option standing* — regenerate the test, change one pin, run it again, ten times an hour instead of twice. The diagnosis was elimination, and the value was cycle time.

That is most of what these tools are worth in hardware work. Not insight. Iteration speed on the boring half, so you reach the interesting question while you still care.

---

## Then the motors worked and the car still didn't

The most instructive failure came last. All four motors spinning, freely, on the bench. Put the car down and it sat there.

Motors spinning is not the same as a car moving, and the gap between them is torque. At 9V and 0.6A the wheels turned with nothing on them and stalled the moment they carried weight. Twelve volts fixed most of it; running all four together still stuttered, which is a current-supply problem I did not fully solve before the project turned into something else.

I keep coming back to this one, because in software the equivalent mistake is everywhere. **The unit test passes and the product does not work.** The motor spins under no load, the function returns correct output for the input you imagined, and the thing you actually built still fails on contact with the world. Bench conditions lie in a very specific direction: they remove exactly the load that the real case has.

---

## What I actually took from it

I did not end up with a robot. I ended up with a method, and the method turned out to matter more — everything I have built with hardware since has run on the same split.

**The agent owns the code and the repeatable actions.** Run this for sixty seconds. Change that pin. Rewrite the test. Do it again. It is tireless at the part where I get sloppy.

**I own the physical world and the judgement.** What the multimeter says, whether a wire is actually seated, whether the smell is normal. It has no access to any of that, and pretending otherwise is how you spend four days on a dead chip.

The failure mode is forgetting which half you are in — accepting a confident explanation about a physical system that neither of you has measured. Every real bug in those four days was found by a probe on a pin, and every one of them was found faster because something else was writing the test.

A month later I was [designing enclosures](/writing/pcb-with-an-agent/) the same way, and a month after that the same split was [driving a device that talks back](/writing/esp32-ai-buddy/). Same division of labour, better hardware.

The robot never did drive properly. I count it as one of the more useful things I built.

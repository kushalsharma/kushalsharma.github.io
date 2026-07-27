---
title: "I gave an agent a CAD program and asked for LED panels"
description: "Modular WS2812B panels, designed by describing constraints instead of drawing them. The interesting part is which half of the design work actually transferred."
heroImageCredit: "mume"
heroImage: "/content/images/hero-cad-by-conversation.webp"
pubDate: 2026-06-20
tags: ["hardware", "cad", "ai-agents", "3d-printing", "mcp"]
---
In June I wanted modular LED panels — WS2812B strips cut and laid in an S pattern inside a 3D-printed grid, so that 2×2, 4×4 and 8×8 tiles could bolt together into a bigger display.

I cannot use CAD. I have tried, several times, over years. I understand what it is doing and I have never got fast enough at it for the tool to disappear, which means every design idea dies somewhere between my head and the screen.

So I did not draw it. I described it, to an agent driving Fusion 360 through an MCP server.

---

## The brief was constraints, not shapes

What I gave it was closer to a spec than a sketch, and writing it out is the part I would repeat:

- PLA, printed — transparent, white and black variants
- Maximum 16mm thick
- A groove for the strip; the strip is 7mm wide
- Square pixels visible from above — **not** open holes, a diffuser over each
- A funnel per pixel so light doesn't bleed into its neighbours
- Assembled with M3 bolts, 16 or 20mm
- **Border exactly half the width of the interior dividers**, so two panels butted together produce an even grid
- A notch at each row end for the wire to pass behind and re-enter on the next row
- Magnets and solder pads on the back

That list is the actual design. Everything after it is execution.

The border rule is the one I am pleased with, and it is a good example of what this kind of work is really made of. If the border is a full divider wide, joining two panels gives you one seam that is twice as thick as every other gridline, and the whole illusion of a continuous display dies at the join. Half-width borders on both panels add up to exactly one divider. You can only spot that by thinking about the assembled result rather than the part — and it is a *sentence*, not a drawing. Which is precisely why it survives the translation into a conversation intact.

---

## Where it went well and where it did not

The honest split, because "I described it and got a perfect part" is not what happened.

**It transferred well:** parametric structure. Grid dimensions, wall thicknesses, bolt hole positions, the repeated cell — all of it is arithmetic on constraints I had already stated, and the agent is good at arithmetic that follows rules. Changing "4×4" to "8×8" and getting a consistent result is the thing CAD is for and the thing I had never been able to reach unaided.

**It transferred badly:** anything requiring a look at the result. Whether the diffuser sits proud of the frame in a way that catches the light wrong. Whether a funnel wall is thin enough to print without stringing. Whether the thing is *nice*. Those need eyes on the render, and then eyes on a printed part, and the loop back from that is slow and mine to run.

I started in OpenSCAD, which is the obvious choice — it is already text, so an agent writing it is barely a stretch. I moved to Fusion via MCP because the models get unwieldy in OpenSCAD faster than you expect, and because I wanted the constraint solver and the export path rather than my own accumulated pile of transforms.

---

## The general thing

I got a design tool back that I had effectively lost.

Not because the agent is a better designer than me — it is not, and on questions of taste it is noticeably worse. Because the barrier was never design judgement. The barrier was the twenty hours of tool fluency standing between having an idea about panel geometry and seeing a panel.

This is what I think most of the current tooling actually does, and it is a much less exciting claim than the one people usually make: it does not replace the expert, it deletes the *entry cost* for the non-expert. The half of the work that is knowing what you want survives. The half that is knowing which menu it lives under evaporates.

Which reorders what is scarce. Once producing the artifact is cheap, the bottleneck moves entirely to knowing what artifact to produce — and being able to say it precisely enough that it can be built. That list of nine constraints up there took longer to think through than everything after it.

---

## Where it went

The LED panels are still unfinished — the design exists, and the printing and soldering keep losing to other things. But the setup outlived the project by a wide margin.

Three weeks later I used the same Fusion-through-an-agent workflow to script an enclosure for a device, and a month after that the same idea moved one layer down the stack when I [designed a PCB by talking to an agent](/writing/pcb-with-an-agent/) instead.

Each time, the reusable part is not the model. It is the discovery that a physical design brief written as constraints — thicknesses, tolerances, "this must be half of that so the seam disappears" — is a *program*, and always was. It just used to have to be compiled by hand, by someone who had spent twenty hours learning the compiler.

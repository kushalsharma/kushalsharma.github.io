---
title: "The ESP32 pinout cheat sheet I actually wanted"
description: "Every pinout diagram tells you what each pin can do. Almost none of them lead with what will stop your board booting, or which pins go dead the moment you turn on Wi-Fi. This is the reference I ended up writing for myself."
heroImageCredit: "mume"
heroImage: "/content/images/hero-esp32-pinout-cheat-sheet.webp"
pubDate: 2026-07-30
tags: ["esp32", "hardware", "reference", "embedded"]
---
There are a hundred ESP32 pinout diagrams online and most of them are laid out the same way: a picture of the board with every function of every pin fanned out around it. ADC, touch, PWM, SPI, UART, all of it.

That is a *capability* map, and capability is not the question you have when you are wiring something. The question you have is the opposite one:

> **Which of these pins will hurt me?**

Because a good number of them will. Six are soldered to the flash chip. Five change what the chip does at reset depending on what you hung off them. Two are your serial console. Four cannot output at all. Nine stop working as analog inputs the moment Wi-Fi comes up. That is eleven of the twenty-five pins on the header carrying a caveat, and none of it is obvious from a fan diagram, and all of it is the difference between a board that works and a board that boots into flash mode every third power cycle for reasons you cannot see.

So this is the reference the wrong way round: constraints first, capabilities second. It is the 30-pin DOIT DevKit V1, the common one, and it is what I keep open while building [the buddy](/writing/esp32-ai-buddy/).

---

## Start here: the pins to not use

**Never — GPIO 6, 7, 8, 9, 10, 11.** Wired to the internal SPI flash. Using one does not give you a warning, it gives you a board that does not come up.

**Never in normal use — GPIO 1 (TX0) and GPIO 3 (RX0).** This is the USB serial port. It is how you flash the board and how you read `Serial.println`. You can technically reclaim them; you will regret it the first time you need to debug.

**Input only — GPIO 34, 35, 36 (VP), 39 (VN).** These can read. They cannot write, cannot do PWM, and have **no internal pull-up or pull-down**. If you put a button on GPIO34 without an external resistor, it will float and read as noise.

That last constraint is also a feature, which I will come back to.

---

## The five pins that decide whether your board boots

These are the strapping pins. The chip samples them at reset to decide how to start, and *then* they become normal GPIOs. So whatever you attach is read as a boot instruction for the first few milliseconds of its life.

| GPIO | It must be… | What that means for you |
|---|---|---|
| 0 | HIGH at boot | LOW puts the chip in flash mode. Also the BOOT button. |
| 2 | LOW at boot | Also the on-board LED — so an external pull-up here is a boot problem. |
| 5 | HIGH at boot | Also VSPI CS, so SPI chip-selects land here by default. |
| 12 | LOW at boot | Pulling this HIGH can stop the board coming up entirely. |
| 15 | HIGH at boot | Pull it LOW and you lose the startup log — quiet, and very confusing. |

The failure mode worth internalising: **a peripheral that pulls a strapping pin the wrong way produces an intermittent boot failure, not a compile error.** It will often work when powered from USB and fail on battery, or work when the sensor is unplugged, which is exactly the kind of bug that eats an evening.

GPIO 12 and GPIO 15 are the two that get people. Both are perfectly good pins after boot. Both are on the HSPI bus, so an SPI display wired to HSPI defaults straight onto them.

---

## ADC2 does not work with Wi-Fi

This is the single most useful thing on the page, and it is usually a footnote.

The ESP32 has two ADCs. **ADC2 is used by the Wi-Fi radio.** When Wi-Fi is running, ADC2 reads fail. Not degrade — fail.

That knocks out GPIO 4, 2, 15, 13, 12, 14, 27, 25 and 26 for analog input on any connected device. Which, if you are building anything that talks to a network, is most of the board.

| Use these for analog | GPIO |
|---|---|
| ADC1_CH0 | 36 (VP) |
| ADC1_CH3 | 39 (VN) |
| ADC1_CH4 | 32 |
| ADC1_CH5 | 33 |
| ADC1_CH6 | 34 |
| ADC1_CH7 | 35 |

Six pins. That is your entire analog budget on a Wi-Fi project, and four of them are the input-only ones.

Which is why those input-only pins turn out to be well matched to their job. When I needed to read battery voltage through a divider, GPIO34 was the obvious home: it is ADC1 so Wi-Fi does not touch it, it is input-only so there is no chance of accidentally driving it, and it has no internal pull resistors to skew a divider you have carefully picked resistor values for. The constraint that makes it useless for a button makes it ideal for a measurement.

**Input range**, set in software:

| Attenuation | Range |
|---|---|
| 0 dB | 0 – 1.0 V |
| 2.5 dB | 0 – 1.4 V |
| 6 dB | 0 – 2.0 V |
| 11 dB | 0 – 3.3 V *(default)* |

---

## The board, physically

Held with the USB connector pointing down. Worth having in this shape rather than as a list, because when you are planning which peripheral sits on which side of a breadboard, adjacency is the thing you need.

```
                              ╔═══════════════════╗
                              ║    ESP32-WROOM    ║
                              ║   (antenna up)    ║
              EN ─────────────╢●                 ●╟───────────── GPIO23  · VSPI MOSI
  SensVP  ADC1_0  GPIO36 ─────╢●                 ●╟───────────── GPIO22  · I2C SCL
  SensVN  ADC1_3  GPIO39 ─────╢●                 ●╟───────────── GPIO1   · TX0 ⚠️
          ADC1_6  GPIO34 ─────╢●                 ●╟───────────── GPIO3   · RX0 ⚠️
          ADC1_7  GPIO35 ─────╢●                 ●╟───────────── GPIO21  · I2C SDA
  Touch9  ADC1_4  GPIO32 ─────╢●                 ●╟───────────── GPIO19  · VSPI MISO
  Touch8  ADC1_5  GPIO33 ─────╢●                 ●╟───────────── GPIO18  · VSPI CLK
    DAC1  ADC2_8  GPIO25 ─────╢●                 ●╟───────────── GPIO5   · VSPI CS ⚠️
    DAC2  ADC2_9  GPIO26 ─────╢●                 ●╟───────────── GPIO17  · TX2
  Touch7  ADC2_7  GPIO27 ─────╢●                 ●╟───────────── GPIO16  · RX2
  Touch6  ADC2_6  GPIO14 ─────╢●                 ●╟───────────── GPIO4   · ADC2_0 · Touch0
  Touch5  ADC2_5  GPIO12 ─────╢●                 ●╟───────────── GPIO2   · Touch2 · LED ⚠️
  Touch4  ADC2_4  GPIO13 ─────╢●                 ●╟───────────── GPIO15  · Touch3 ⚠️
             GND ─────────────╢●                 ●╟───────────── GND
             VIN ─────────────╢●                 ●╟───────────── 3V3
                              ║   [ USB micro ]   ║
                              ╚═══════════════════╝

  ⚠️ = strapping or flashing pin
  Input-only, no pull resistors: 34, 35, 36 (VP), 39 (VN)
  Not on the header at all: 6–11 (flash)
```

Note that the input-only ADC1 pins are all together on the upper left. Convenient, since they are the ones you want for sensors on a Wi-Fi board.

---

## Full safety table

| Label | GPIO | | Notes |
|---|---|---|---|
| D0 | 0 | ⚠️ | HIGH at boot; LOW = flash mode. BOOT button. |
| TX0 | 1 | ❌ | USB serial TX |
| D2 | 2 | ⚠️ | LOW at boot; on-board LED |
| RX0 | 3 | ❌ | USB serial RX |
| D4 | 4 | ✅ | ADC2_CH0, Touch0 |
| D5 | 5 | ⚠️ | HIGH at boot; VSPI CS |
| D6–D11 | 6–11 | ❌ | Internal flash — do not touch |
| D12 | 12 | ⚠️ | LOW at boot; HSPI MISO |
| D13 | 13 | ✅ | HSPI MOSI, ADC2_CH4, Touch4 |
| D14 | 14 | ✅ | HSPI CLK, ADC2_CH6, Touch6 |
| D15 | 15 | ⚠️ | HIGH at boot; HSPI CS |
| RX2 | 16 | ✅ | UART2 RX |
| TX2 | 17 | ✅ | UART2 TX |
| D18 | 18 | ✅ | VSPI CLK |
| D19 | 19 | ✅ | VSPI MISO |
| D21 | 21 | ✅ | Default I2C SDA |
| D22 | 22 | ✅ | Default I2C SCL |
| D23 | 23 | ✅ | VSPI MOSI |
| D25 | 25 | ✅ | DAC1, ADC2_CH8 |
| D26 | 26 | ✅ | DAC2, ADC2_CH9 |
| D27 | 27 | ✅ | ADC2_CH7, Touch7 |
| D32 | 32 | ✅ | ADC1_CH4, Touch9 |
| D33 | 33 | ✅ | ADC1_CH5, Touch8 |
| D34 | 34 | ⚠️ | **Input only**, no pulls — ADC1_CH6 |
| D35 | 35 | ⚠️ | **Input only**, no pulls — ADC1_CH7 |
| VP | 36 | ⚠️ | **Input only**, no pulls — ADC1_CH0 |
| VN | 39 | ⚠️ | **Input only**, no pulls — ADC1_CH3 |

✅ safe · ⚠️ works, but read the note · ❌ avoid

---

## Buses, quickly

**I2C** — default SDA 21, SCL 22. Any GPIO can be remapped, and on this chip that is genuinely true rather than technically true.

**SPI** — two usable buses. They are functionally identical; the third is the flash.

| Bus | MOSI | MISO | CLK | CS |
|---|---|---|---|---|
| VSPI *(prefer this)* | 23 | 19 | 18 | 5 |
| HSPI | 13 | 12 | 14 | 15 |

Prefer VSPI. Look at HSPI's row and then at the strapping table: 12 and 15 are both on it. VSPI's only strapping pin is CS, and chip-select is easy to move.

**UART** — UART0 is the USB serial, UART1 is on the flash. **You have exactly one free hardware UART: UART2, TX 17 / RX 16.** Anything else is software serial.

**I2S** — two interfaces, and the pins are genuinely flexible; assign whatever you like in `i2s_driver_install()`. This is what carries a digital mic like the INMP441 in and a MAX98357A amplifier out, which is the whole audio path on my buddy.

**DAC** — real analog out, 8-bit, on GPIO 25 and 26 only. Everything else calling itself "analog out" is PWM.

**PWM** — 21 channels, any pin except the input-only four.

**Touch** — ten capacitive channels: T0–T9 on GPIO 4, 0, 2, 15, 13, 12, 14, 27, 33, 32. Nine are usable here, since T1 is GPIO0 and GPIO0 is the BOOT button on this board. They can wake the chip from deep sleep, which makes a touch pad a decent power button.

**Deep sleep wake** — only RTC GPIOs: 0, 2, 4, 12, 13, 14, 15, 25, 26, 27, 32, 33, 34, 35, 36, 39.

**Power** — VIN is 5V in, 3V3 is out from the regulator and will give you about 600mA before it sags, EN is reset. If you are running servos or a strip of LEDs off 3V3, you are already past the budget; give them their own supply.

---

## The seven rules

If you remember nothing else:

1. **6–11 are the flash.** Never.
2. **1 and 3 are your serial console.** Leave them.
3. **ADC2 dies when Wi-Fi lives.** Analog goes on 32–39.
4. **34, 35, 36, 39 are input only** and have no pull resistors.
5. **0, 2, 5, 12, 15 are strapping pins** — what you attach changes how the board boots.
6. **Prefer VSPI** (23/19/18/5) over HSPI, because HSPI sits on two strapping pins.
7. **You get one spare hardware UART**: TX 17, RX 16.

Most of what I have gotten wrong on this chip has been rule 3 or rule 5, both times as an intermittent fault rather than an error — which is the argument for having the constraints on one page instead of inferring them from a diagram of everything the pin *could* do.

/**
 * Generate hero images for posts through the Mume Gateway.
 *
 *   node scripts/generate-hero.mjs --list
 *   node scripts/generate-hero.mjs --slug two-heartbeats
 *   node scripts/generate-hero.mjs --all
 *   node scripts/generate-hero.mjs --slug two-heartbeats --model <id> --dry-run
 *
 * The API key is read from .env.local (gitignored) or the MUME_API_KEY
 * environment variable. It is never printed, never logged, and never written
 * into any file the build can see.
 *
 * Output: public/content/images/hero-<slug>.webp, and the post's frontmatter
 * is updated in place with heroImage / heroImageAlt / heroImageCredit.
 */
import { readFile, writeFile, readdir, access } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const BASE_URL = process.env.MUME_BASE_URL || "https://mume.ai/api/v1";
const BLOG_DIR = "src/content/blog";
const IMG_DIR = "public/content/images";
const DEFAULT_MODEL = process.env.MUME_IMAGE_MODEL || "google/gemini-3-pro-image";

// A shared visual language, so the set reads as one publication rather than
// seven unrelated pictures. Edit here, not per-prompt.
//
// Pixel art + abstract minimalism: one bold subject built from chunky visible
// pixels, dispersing into scattered blocks at one edge. Works at thumbnail
// size, survives any crop, and reads as a set regardless of subject matter.
const STYLE = [
  "Pixel art illustration in an abstract minimalist style.",
  "Built from chunky visible square pixels and mosaic blocks with deliberate",
  "low-resolution dithering and crisp hard edges — no soft blur, no gradients.",
  "One single bold subject, centred, dissolving and dispersing into scattered",
  "loose pixel blocks toward one edge.",
  "Bold saturated flat colour fields, strong contrast, limited palette of three",
  "or four colours only. Large areas of clean flat background.",
  "Generous negative space. Confident, graphic, poster-like.",
  "No text, no letters, no numbers, no logos, no watermarks, no UI elements.",
  "Wide 16:9 composition.",
].join(" ");

// Subjects are drawn from each post's own keywords, so the image carries a
// hint of the content without being a literal diagram.
const PROMPTS = {
  // keywords: repetition, layers, one continuous line, ten years
  "same-thing-for-ten-years":
    "Five identical pixel-art arch shapes standing in a row across the frame, each " +
    "one larger than the last, evenly spaced. One single bright horizontal line runs " +
    "straight through all five arches, connecting them end to end. Palette: deep " +
    "indigo background, electric cyan line, warm amber arches. The largest arch on " +
    "the right breaks apart into loose scattered pixel blocks.",

  // keywords: meter, credits, tokens, routing, billing
  "gateways-route-mine-bills":
    "A bold pixel-art gauge or meter dial as the central subject, its needle sharp " +
    "and confident. Many thin pixel lines converge into it from the left and fan out " +
    "to the right. Palette: deep teal background, hot magenta needle, cream and " +
    "cyan lines. The fanning lines break into scattered pixel blocks at the right edge.",

  // keywords: runaway loop, spiral, cost, one bad actor
  "one-user-infinite-loop":
    "A tight spiral of pixel blocks coiling inward, growing hotter and denser toward " +
    "the centre — burning orange and red at the core. Around it, calm orderly rows of " +
    "flat blue pixel squares, completely unaffected. Palette: pale blue background, " +
    "orange-red spiral, deep navy. Sharp contrast between chaos and order.",

  // keywords: robot face, two eyes, small device, friendly
  "esp32-ai-buddy":
    "A small friendly pixel-art robot head, square, with two large simple glowing " +
    "square eyes. Retro game sprite energy, blocky and charming. Palette: warm cream " +
    "background, mint green robot, hot coral eyes, charcoal outline. The bottom edge " +
    "of the robot dissolves into loose falling pixel blocks.",

  // keywords: circuit board, traces, sockets, copper
  "pcb-with-an-agent":
    "Abstract pixel-art circuit board traces — bold right-angled pathways branching " +
    "across the frame with square pads at the junctions. Palette: deep forest green " +
    "background, bright gold traces, one accent of electric blue. The traces fragment " +
    "and scatter into loose pixel blocks toward the upper right.",

  // keywords: small device, big cloud, thin link between them
  "microcontroller-is-a-terminal":
    "Left: one small solid pixel-art square, minimal, almost empty. Right: a large " +
    "dense billowing pixel cloud of many blocks. Between them a single thin bright " +
    "horizontal line. Palette: charcoal background, pale cyan small square, violet " +
    "and magenta cloud. Obvious imbalance of visual weight, left to right.",

  // keywords: two waveforms, out of phase, collision, break
  "two-heartbeats":
    "Two bold pixel-art pulse waveforms running horizontally, slightly out of phase " +
    "with each other, one cyan and one hot pink. Where their peaks overlap the line " +
    "shatters into a burst of scattered pixel blocks. Palette: near-black background, " +
    "electric cyan, hot pink, one small warning-yellow accent at the collision.",

  // keywords: delay, lag between event and record, settling, hourglass
  "billing-after-the-answer":
    "Two bold pixel-art squares side by side, identical in size. The left one is solid " +
    "and complete; the right one is still assembling itself from loose pixel blocks " +
    "drifting in from below, clearly lagging behind. A narrow gap of empty space " +
    "between them. Palette: deep plum background, bright amber left square, pale " +
    "gold assembling right square, one thin cyan line marking the gap.",

  // keywords: wrong unit, mismatched sizes, counting, buckets
  "rate-limiting-an-llm-api":
    "A row of five pixel-art buckets or containers of wildly different sizes — one " +
    "tiny, one enormous, the rest in between — but each marked with exactly one " +
    "identical small tally mark above it. The absurd mismatch is the subject. " +
    "Palette: dark slate background, warm orange containers, bright cyan tally " +
    "marks. The largest container overflows into scattered pixel blocks.",

  // keywords: severed connection, output into the void, meter still running
  "cancelling-a-stream":
    "A bold horizontal pixel-art stream of blocks flowing left to right, which is " +
    "cleanly severed partway across — the right-hand portion continues flowing on " +
    "into empty darkness, disconnected from anything. Palette: near-black background, " +
    "bright lime stream on the left, the disconnected right portion fading to dim " +
    "grey-green, one red pixel marking the cut.",

  // keywords: timeline, weeks, small start large middle, calendar
  "gateway-nine-weeks-to-production":
    "Nine bold pixel-art vertical bars in a row of increasing then settling height, " +
    "like a compressed timeline. The first two bars are small and bright; the middle " +
    "five are tall and dense; the last two are flat and calm. Palette: deep navy " +
    "background, electric cyan short bars, warm amber tall bars, muted grey flat " +
    "bars. The tall middle bars fray into loose pixel blocks at their tops.",

  // keywords: probe, voltage, dead chip, two hands on one problem
  "multimeter-and-an-agent":
    "A bold pixel-art square chip with pins along both sides as the central subject. " +
    "One sharp pixel probe tip touches a pin from above; a thin bright line enters " +
    "the chip from the other side. The chip's interior is dark and dead. Palette: " +
    "deep charcoal background, warm amber chip outline, one hot red probe tip, " +
    "electric cyan line. The chip's lower edge crumbles into scattered pixel blocks.",

  // keywords: grid, modular panels, tiles joining, light cells
  "cad-by-conversation":
    "A bold pixel-art grid of square cells with visible dividers between them, like " +
    "modular tiles butted together, each cell glowing a different warm colour. " +
    "Palette: near-black background, bright white dividers, cells in amber, coral, " +
    "mint and cyan. The grid dissolves into loose scattered pixel blocks at the " +
    "right edge where the tiling runs out.",

  // keywords: interrupted frame, tearing, periodic collision
  "the-flicker-was-the-radar":
    "A bold pixel-art rectangular screen shape, its image cleanly torn across the " +
    "middle into two horizontally offset halves, as if caught mid-refresh. Faint " +
    "concentric arcs sweep across it from one corner. Palette: dark teal background, " +
    "bright lime screen, magenta arcs, one white tear line. Loose pixel blocks " +
    "scatter from the tear.",

  // keywords: one agent two interfaces, shared state
  "phoebe-needed-a-second-face":
    "Two bold pixel-art rounded rectangles side by side — one tall and narrow like a " +
    "phone, one wide like a window — joined by a thick bright line running between " +
    "them at the centre. Both contain the same simple glyph. Palette: deep violet " +
    "background, cream shapes, hot amber connecting line. The outer edges of both " +
    "shapes fray into loose pixel blocks.",

  // keywords: one symptom three sources, converging paths, hidden detail
  "one-error-three-causes":
    "Three distinct bold pixel-art paths of different colours entering from the left, " +
    "top and bottom, all converging into one single identical grey square at the " +
    "centre right. The three sources are vivid and distinguishable; the destination " +
    "is flat and featureless. Palette: near-black background, one coral path, one " +
    "cyan path, one amber path, dull grey square. Loose pixel blocks scatter at the " +
    "convergence point.",

  // keywords: measurement error, missing rows, a ruler that lies
  "the-query-was-lying":
    "A bold pixel-art vertical bar chart where several bars are clearly missing — " +
    "gaps where bars should be, their faint outlines only just visible in a dimmer " +
    "shade. One bright measuring line runs across the top. Palette: deep indigo " +
    "background, warm amber solid bars, barely-visible dim violet ghost bars in the " +
    "gaps, one cyan measuring line. Scattered pixel blocks drift near the gaps.",
};

// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : undefined;
};

const MODEL = value("model") || DEFAULT_MODEL;
const DRY = flag("dry-run");

/** Read the key without ever surfacing it. */
async function loadKey() {
  if (process.env.MUME_API_KEY) return process.env.MUME_API_KEY.trim();
  try {
    const env = await readFile(".env.local", "utf8");
    const line = env.split(/\r?\n/).find((l) => l.trim().startsWith("MUME_API_KEY="));
    if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    /* fall through */
  }
  console.error(
    "\n  No API key found.\n" +
      "  Create .env.local in the repo root (it is gitignored) containing:\n\n" +
      "    MUME_API_KEY=your-key-here\n\n" +
      "  or set the MUME_API_KEY environment variable.\n",
  );
  process.exit(1);
}

async function generate(slug, key) {
  const prompt = PROMPTS[slug];
  if (!prompt) {
    console.error(`  no prompt defined for "${slug}"`);
    return false;
  }

  const full = `${STYLE} ${prompt}`;
  console.log(`\n  ${slug}`);
  console.log(`    model: ${MODEL}`);

  if (DRY) {
    console.log(`    prompt: ${full}`);
    return true;
  }

  const res = await fetch(`${BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, prompt: full, n: 1 }),
  });

  const text = await res.text();
  if (!res.ok) {
    // Surface the gateway's own error — it is the fastest way to find a
    // valid model id, since the gateway has no /models endpoint.
    console.error(`    HTTP ${res.status}: ${text.slice(0, 600)}`);
    return false;
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error(`    unparseable response: ${text.slice(0, 300)}`);
    return false;
  }

  const entry = json?.data?.[0];
  if (!entry) {
    console.error(`    no image in response: ${text.slice(0, 300)}`);
    return false;
  }

  let buf;
  if (entry.b64_json) {
    buf = Buffer.from(entry.b64_json, "base64");
  } else if (entry.url) {
    const img = await fetch(entry.url);
    if (!img.ok) {
      console.error(`    could not fetch ${entry.url} (HTTP ${img.status})`);
      return false;
    }
    buf = Buffer.from(await img.arrayBuffer());
  } else {
    console.error("    response contained neither url nor b64_json");
    return false;
  }

  const out = join(IMG_DIR, `hero-${slug}.webp`);
  const info = await sharp(buf)
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(out);

  console.log(`    -> ${out}  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB`);

  if (json?.usage?.cost != null) console.log(`    cost: $${json.usage.cost}`);

  await updateFrontmatter(slug, `/content/images/hero-${slug}.webp`);
  return true;
}

/** Set heroImage + credit in the post's frontmatter, preserving everything else. */
async function updateFrontmatter(slug, path) {
  const file = join(BLOG_DIR, `${slug}.md`);
  try {
    await access(file);
  } catch {
    console.log(`    (no ${file} — set heroImage manually)`);
    return;
  }

  let text = await readFile(file, "utf8");
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return;

  let fm = m[1];
  const set = (key, val) => {
    const re = new RegExp(`^${key}:.*$`, "m");
    if (re.test(fm)) fm = fm.replace(re, `${key}: ${val}`);
    else fm = fm.replace(/^(description:.*)$/m, `$1\n${key}: ${val}`);
  };

  set("heroImage", `"${path}"`);
  set("heroImageCredit", `"mume"`);

  text = text.replace(m[1], fm);
  await writeFile(file, text, "utf8");
  console.log(`    frontmatter updated`);
}

// ---------------------------------------------------------------------------

const slugs = flag("all")
  ? Object.keys(PROMPTS)
  : value("slug")
    ? [value("slug")]
    : null;

if (flag("list") || !slugs) {
  const existing = await readdir(BLOG_DIR);
  console.log("\n  prompts defined:\n");
  for (const s of Object.keys(PROMPTS)) {
    const has = existing.includes(`${s}.md`);
    console.log(`    ${has ? "*" : "!"} ${s}${has ? "" : "   (no matching post)"}`);
  }
  console.log("\n  --slug <name> | --all | --dry-run | --model <id>\n");
  process.exit(0);
}

const key = DRY ? "dry-run" : await loadKey();
let ok = 0;
for (const s of slugs) if (await generate(s, key)) ok++;
console.log(`\n  ${ok}/${slugs.length} generated\n`);

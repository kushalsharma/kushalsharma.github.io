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

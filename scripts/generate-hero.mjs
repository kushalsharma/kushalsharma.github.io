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
const STYLE = [
  "Editorial tech illustration for an engineering blog.",
  "Dark slate background (#101418), deep and matte, not black.",
  "Restrained palette: one cyan accent (#22d3ee), one violet (#a78bfa), muted steel greys.",
  "Clean geometric composition, generous negative space, subtle film grain.",
  "Cinematic soft rim lighting. Shallow depth of field.",
  "No text, no letters, no numbers, no logos, no watermarks, no UI chrome.",
  "No human faces. Wide 16:9 crop.",
].join(" ");

const PROMPTS = {
  "same-thing-for-ten-years":
    "Five translucent glass panels floating in a row, receding into depth, each " +
    "etched with a different faint geometric lattice — but all five lattices are " +
    "the same shape at different scales. A single thin cyan thread passes cleanly " +
    "through all five, connecting them. The idea is repetition revealing itself as " +
    "one continuous line.",

  "gateways-route-mine-bills":
    "A single luminous cyan conduit entering from the left and fanning into many " +
    "thin threads on the right. At the fan-out point sits a precise brass-and-glass " +
    "measuring instrument, like an antique flow meter, catching the light. The " +
    "meter is the subject; the routing is background.",

  "one-user-infinite-loop":
    "A single glowing violet thread coiling into a tight runaway spiral that grows " +
    "denser and hotter toward the centre, spilling light. Around it, orderly parallel " +
    "cyan threads run straight and calm and unaffected. Tension between one thing " +
    "out of control and everything else fine.",

  "esp32-ai-buddy":
    "A small friendly rectangular device on a dark workbench, a soft glowing cyan " +
    "screen showing two simple luminous dots like calm eyes. Tiny electronic modules " +
    "and fine jumper wires arranged neatly around it. Warm, intimate, macro lens, " +
    "shallow focus. Affectionate rather than technical.",

  "pcb-with-an-agent":
    "A green-black printed circuit board seen at a low angle, copper traces catching " +
    "cyan light, header sockets in crisp rows. Faint violet wireframe schematic lines " +
    "hover a few centimetres above the physical board, slightly misaligned with it — " +
    "the plan and the object not quite agreeing.",

  "microcontroller-is-a-terminal":
    "Left: a small dark minimal device, nearly empty inside, a single cyan light. " +
    "Right: a large luminous violet volumetric cloud of dense structure. Between them " +
    "one clean taut horizontal beam of light. Weight and complexity obviously live on " +
    "the right; the left is deliberately, elegantly hollow.",

  "two-heartbeats":
    "Two overlapping pulse waveforms in cyan and violet running horizontally across " +
    "a dark field, slightly out of phase. Where their peaks collide the line breaks " +
    "and scatters into fragments of light. Rhythmic, clinical, a little ominous.",
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

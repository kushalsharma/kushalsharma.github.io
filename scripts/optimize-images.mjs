/**
 * One-off migration: the old Jekyll site shipped raw 1–2.4 MB PNGs straight
 * from ComfyUI and screenshot tools. Re-encode everything to WebP, cap the
 * long edge at 1600px, and rewrite every reference in the content and config.
 *
 *   node scripts/optimize-images.mjs
 */
import { readdir, readFile, writeFile, unlink, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import sharp from "sharp";

const IMG_DIR = "public/content/images";
const MAX_EDGE = 1600;
const QUALITY = 82;

const REWRITE_TARGETS = [
  "src/consts.ts",
  "src/components/Head.astro",
  ...(await readdir("src/content/blog")).map((f) => join("src/content/blog", f)),
];

const kb = (n) => `${Math.round(n / 1024)} KB`;

const files = (await readdir(IMG_DIR)).filter((f) =>
  [".png", ".jpg", ".jpeg"].includes(extname(f).toLowerCase()),
);

let before = 0;
let after = 0;
const renames = new Map();

// OneDrive holds transient locks on files it is syncing, so unlink can fail
// with EPERM even though the write succeeded. Retry, then move on.
const removeWithRetry = async (path, attempts = 5) => {
  for (let i = 0; i < attempts; i++) {
    try {
      await unlink(path);
      return true;
    } catch (err) {
      if (err.code !== "EPERM" && err.code !== "EBUSY") throw err;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  return false;
};

const stubborn = [];

for (const file of files) {
  const src = join(IMG_DIR, file);
  const out = join(IMG_DIR, `${basename(file, extname(file))}.webp`);

  const originalSize = (await stat(src)).size;
  before += originalSize;

  // Re-runnable: if a previous pass already produced the webp, keep it.
  let newSize;
  try {
    newSize = (await stat(out)).size;
    console.log(`  ${file.padEnd(48)} ${"(already converted)".padStart(8)}`);
  } catch {
    await sharp(src)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(out);
    newSize = (await stat(out)).size;
    console.log(`  ${file.padEnd(48)} ${kb(originalSize).padStart(8)} → ${kb(newSize)}`);
  }
  after += newSize;

  if (!(await removeWithRetry(src))) stubborn.push(file);
  renames.set(`/content/images/${file}`, `/content/images/${basename(file, extname(file))}.webp`);
}

let touched = 0;
for (const target of REWRITE_TARGETS) {
  let text = await readFile(target, "utf8");
  const original = text;
  for (const [from, to] of renames) text = text.split(from).join(to);
  if (text !== original) {
    await writeFile(target, text, "utf8");
    touched++;
  }
}

console.log(`\n  ${files.length} images: ${kb(before)} → ${kb(after)}`);
console.log(`  ${Math.round((1 - after / before) * 100)}% smaller · ${touched} files rewritten`);

if (stubborn.length) {
  console.log(`\n  Locked by OneDrive, delete manually: ${stubborn.join(", ")}`);
}

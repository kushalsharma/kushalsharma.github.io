#!/usr/bin/env node
/**
 * What is live, what is queued, and how much runway is left.
 *
 *   npm run queue
 *
 * Reads pubDate straight out of the frontmatter — no Astro build needed.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), "src/content/blog");
const CADENCE_DAYS = 2; // Tue/Thu-ish. Change if the cadence changes.

// Frontmatter dates parse as UTC midnight, so compare in UTC — otherwise a post
// dated today reads as "queued" from any timezone east of Greenwich.
const DAY = 86_400_000;
const now = new Date();
const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

function field(src, name) {
  const m = src.match(new RegExp(`^${name}:\\s*"?([^"\\n]+)"?\\s*$`, "m"));
  return m?.[1]?.trim();
}

const posts = readdirSync(DIR)
  .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
  .map((f) => {
    const src = readFileSync(join(DIR, f), "utf8");
    const head = src.slice(0, src.indexOf("\n---", 4));
    return {
      slug: f.replace(/\.mdx?$/, ""),
      title: field(head, "title") ?? f,
      date: new Date(field(head, "pubDate")),
      draft: field(head, "draft") === "true",
    };
  })
  .filter((p) => !p.draft && !Number.isNaN(p.date.valueOf()))
  .sort((a, b) => a.date - b.date);

const live = posts.filter((p) => p.date.valueOf() <= today);
const queued = posts.filter((p) => p.date.valueOf() > today);
const fmt = (d) =>
  d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });

console.log(`\n  \x1b[2m${live.length} live\x1b[0m`);
for (const p of live.slice(-3)) {
  console.log(`  \x1b[2m${fmt(p.date)}  ${p.title}\x1b[0m`);
}

if (queued.length) {
  console.log(`\n  \x1b[1m${queued.length} queued\x1b[0m`);
  for (const p of queued) console.log(`  \x1b[32m${fmt(p.date)}\x1b[0m  ${p.title}`);

  const runway = Math.round((queued.at(-1).date - today) / DAY);
  console.log(`\n  Runway: ${runway} days — empty after ${fmt(queued.at(-1).date)}`);
  if (runway < 14) console.log(`  \x1b[33mUnder two weeks. Write the next batch.\x1b[0m`);
} else {
  console.log(`\n  \x1b[33mNothing queued.\x1b[0m`);
  console.log(`  At one post every ${CADENCE_DAYS} days, the site goes quiet from now.`);
}
console.log();

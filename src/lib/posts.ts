import { getCollection } from "astro:content";

/**
 * Posts dated in the future are held back until their pubDate.
 *
 * This is what lets a batch of posts be written in one sitting and released on
 * a schedule: commit them all with the dates you want, and the daily rebuild in
 * .github/workflows/deploy.yml publishes each one on the morning it comes due.
 *
 * Set SHOW_SCHEDULED=1 to build with them visible (dev, or previewing a batch).
 */
// process.env, not import.meta.env — Vite only surfaces vars it read from a
// .env file, and this is a shell flag read at build time in Node.
const flag = process.env.SHOW_SCHEDULED ?? import.meta.env.SHOW_SCHEDULED;
const SHOW_SCHEDULED = flag === "1" || flag === "true";

/** All published posts, newest first. The one source of truth for post lists. */
export async function getPublishedPosts() {
  const now = Date.now();

  return (
    await getCollection(
      "blog",
      ({ data }) => !data.draft && (SHOW_SCHEDULED || data.pubDate.valueOf() <= now),
    )
  ).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Posts with a future pubDate — written, committed, not live yet. */
export async function getScheduledPosts() {
  const now = Date.now();

  return (
    await getCollection("blog", ({ data }) => !data.draft && data.pubDate.valueOf() > now)
  ).sort((a, b) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());
}

# kushalsharma.github.io

Personal site — Astro 5, Tailwind v4, zero client JS bundles.

## Commands

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run preview  # serve dist/
```

## Writing a post

Drop a `.md` or `.mdx` file into `src/content/blog/`. The filename becomes the
URL (`my-post.md` → `/writing/my-post/`).

```yaml
---
title: "Headline goes here"
description: "One or two sentences. This is what Google and Twitter show."
pubDate: 2026-08-14
heroImage: "/content/images/something.webp"
tags: ["ai-agents", "typescript"]
featured: false   # pins it to the top of the home page
draft: false      # true keeps it out of the build entirely
---
```

`description` is not optional in practice — it's the meta description, the OG
description and the card text on every index page.

## Images

Put them in `public/content/images/` and reference them as
`/content/images/name.webp`.

Anything large should be run through the optimiser first:

```bash
node scripts/optimize-images.mjs
```

It converts every PNG/JPG in that folder to WebP, caps the long edge at 1600px,
deletes the originals, and rewrites every reference in `src/`. It's re-runnable
and skips files that already have a `.webp` sibling. The initial migration took
the image payload from 14 MB to 2 MB.

## Deploying

`.github/workflows/deploy.yml` builds on every push to `main` and publishes to
GitHub Pages.

One-time setup: **Settings → Pages → Source → GitHub Actions**. If it's set to
"Deploy from a branch" the workflow will run and nothing will change.

## Custom domain

1. Add `public/CNAME` containing the bare domain, e.g. `kushalsharma.dev`
2. Change `site` in `astro.config.mjs` to match
3. Point DNS at GitHub Pages, then tick "Enforce HTTPS"

## Old URLs

The previous Jekyll site used `/YYYY/MM/DD/slug/` permalinks. Those are kept
alive as redirects in `astro.config.mjs` — if you rename a post slug, add a
redirect rather than breaking the link.

## Notes

- Node 20.12+ required (this repo pins `vite` to v6 via `overrides` because
  newer Vite needs Node 20.19+). Removing that override once Node is upgraded
  is fine.
- Theme, command palette (⌘K), tag filtering, reading progress and copy buttons
  are all inline vanilla JS — there is no framework runtime on the client.
- Scroll reveals use native `animation-timeline: view()` with an
  IntersectionObserver fallback, and are disabled under `prefers-reduced-motion`.

import type { APIRoute } from "astro";
import { SITE } from "../consts";

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL(SITE.url)).href.replace(/\/$/, "");
  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${base}/sitemap-index.xml
`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
};

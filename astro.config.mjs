// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// If you move to a custom domain later, change `site` and add a public/CNAME file.
export default defineConfig({
  site: "https://kushalsharma.github.io",
  integrations: [mdx(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark-dimmed" },
      wrap: true,
    },
  },
  // The old Jekyll site used `permalink: pretty` (/YYYY/MM/DD/slug/).
  // Never break a live URL — these keep the old links working.
  redirects: {
    "/2017/05/04/hello-world": "/writing/hello-world/",
    "/2018/09/23/lstm-keras": "/writing/lstm-keras/",
    "/2019/02/12/docker-basics": "/writing/docker-basics/",
    "/2020/01/20/kubeflow-for-ml-workflows": "/writing/kubeflow-for-ml-workflows/",
    "/2024/01/22/stable-diffusion-intro": "/writing/stable-diffusion-intro/",
    "/2025/11/29/mume-ai-gateway-api": "/writing/mume-ai-gateway-api/",
    "/2026/02/24/building-phoebe-pi-assistant": "/writing/building-phoebe-pi-assistant/",
  },
});

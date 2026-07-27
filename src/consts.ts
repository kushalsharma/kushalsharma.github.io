export const SITE = {
  title: "Kushal Sharma",
  tagline: "AI infrastructure, agents, and the occasional microcontroller.",
  description:
    "Kushal Sharma builds AI infrastructure at Muse Mesh — an LLM gateway, self-hosted agent frameworks, and open-source tooling. Previously ten years shipping Android at Flipkart.",
  url: "https://kushalsharma.github.io",
  author: "Kushal Sharma",
  locale: "en",
  location: "Bengaluru, India",
} as const;

export const SOCIAL = [
  { name: "GitHub", href: "https://github.com/kushalsharma", handle: "@kushalsharma" },
  { name: "Muse Mesh", href: "https://github.com/muse-mesh", handle: "@muse-mesh" },
  { name: "X", href: "https://x.com/rogerthatgame", handle: "@rogerthatgame" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/kushal12", handle: "in/kushal12" },
  {
    name: "Stack Overflow",
    href: "https://stackoverflow.com/users/3858196/kushal-sharma",
    handle: "kushal-sharma",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/channel/UCNRsNrn2-87kfsh6hQ-O6-Q",
    handle: "@kushalsharma",
  },
] as const;

export const NAV = [
  { label: "Writing", href: "/writing/" },
  { label: "Projects", href: "/projects/" },
  { label: "About", href: "/about/" },
] as const;

export const PROJECTS = [
  {
    name: "Mume Gateway",
    tagline: "One OpenAI-compatible endpoint for 500+ models",
    body: "The production LLM gateway behind everything else here. Provider routing, per-user credits and quotas, rate limiting, API keys, usage analytics and billing — the parts that are boring to build and expensive to get wrong.",
    href: "https://mume.ai/docs",
    meta: "Live · TypeScript",
    accent: "cyan",
  },
  {
    name: "mu",
    tagline: "Self-hosted AI agent framework",
    body: "Permission modes, audit logging and MCP support. Runs on your machine, in Docker, or on a Raspberry Pi. Built for people who want an agent with a paper trail rather than a black box.",
    href: "https://github.com/muse-mesh/mu",
    meta: "Open source · TypeScript",
    accent: "violet",
  },
  {
    name: "phoebe",
    tagline: "An autonomous agent that lives in Telegram",
    body: "855 modular skills installed on demand at runtime, voice in and out, full tool access, layered security. Ran for 48 hours on a Raspberry Pi 3 and pushed code to my GitHub org.",
    href: "https://github.com/muse-mesh/phoebe",
    meta: "Open source · TypeScript",
    accent: "amber",
  },
  {
    name: "Mume AI",
    tagline: "500+ models in one app",
    body: "Consumer app on iOS, Android and web. Real payments, real users, and six months in production without a deploy. The reference implementation for the gateway underneath it.",
    href: "https://mume.ai",
    meta: "Live · Flutter",
    accent: "emerald",
  },
  {
    name: "MCP servers",
    tagline: "Dockerised tool servers for Claude and Codex",
    body: "Small, tested Model Context Protocol servers that expose data and tools to any MCP client. The building blocks for giving an agent access to something real.",
    href: "https://github.com/muse-mesh/mume-mcp-servers",
    meta: "Open source · Python",
    accent: "rose",
  },
  {
    name: "Wallmax",
    tagline: "500,000+ downloads on the Play Store",
    body: "Self-taught Android, built nights and weekends before I worked anywhere that mattered. Half a million downloads and 4.3 out of 5 across 10,000+ reviews. The first thing I took all the way from idea to launch on my own.",
    href: "https://github.com/kushalsharma",
    meta: "Archived · Android",
    accent: "violet",
  },
  {
    name: "esp32-buddy",
    tagline: "A pocket AI companion on a ₹400 microcontroller",
    body: "An animated face on a 1.8\" screen you hold a button and talk to, a wireless camera eye over ESP-NOW, and tool calls that drive real pins. Two firmwares, an agent proxy, a custom carrier PCB and a printed shell. Runs on any OpenAI-spec endpoint.",
    href: "https://github.com/muse-mesh/esp32-buddy",
    meta: "Open source · C++ / Python",
    accent: "sky",
  },
] as const;

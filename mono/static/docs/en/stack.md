# Project stack

TAO is a **SvelteKit** single-page application. Source code lives on **GitHub**
and every push to the production branch is automatically deployed to **Cloudflare
Pages**.

## Source code — GitHub

Repository: [SPF-Open/Tao_Tool](https://github.com/SPF-Open/Tao_Tool)

- All source code, issues and pull requests are managed in GitHub.
- The `Prod` branch is the production branch; merging into it triggers a
  Cloudflare Pages deployment.
- Contributions go through pull requests. CI runs automatically on each PR.

## Hosting — Cloudflare Pages

The app is served from **Cloudflare Pages** at `https://tao.lv0.eu`.

- Deploys are triggered automatically on every push to `Prod`.
- Cloudflare's edge network serves the static assets globally with no
  origin server.
- Preview deployments are created for every pull request, each with its own
  unique URL.

## Build

| Tool | Role |
|------|------|
| **SvelteKit** | App framework (routing, SSR/SSG, load functions) |
| **Vite** | Dev server and bundler |
| **TypeScript** | Type-safe application code |
| **Tailwind CSS** | Utility-first styling |
| **Bun / npm** | Package management and scripts |

The app is built as a fully static site (`adapter-static`) — no server runtime
is required and all processing happens in the browser.

## Privacy

Because there is no backend, no data ever leaves the user's browser. Files
uploaded to any tool are processed entirely client-side and are never sent to
Cloudflare, GitHub, or any third party.

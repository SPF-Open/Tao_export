## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: tailwindcss, sveltekit-adapter, mdsvex, mcp
- **Production URL**: https://tao.lv0.eu/ (`SITE_URL` constant in `src/routes/+page.svelte`)

---

## Design System ("TAO" visual language)

Apply this language to every page/route so the site stays cohesive. The landing
page (`src/routes/+page.svelte`) is the reference implementation.

**Core principle — restraint & premium.** No rainbow/multi-color gradients. No
emoji as UI icons. Neutral surfaces by default; the brand accent appears only on
hover/focus. When in doubt, calmer and more monochrome.

**Theme & tokens.** Light/dark via the `.dark` class on `<html>`, toggled in
`+layout.svelte`. All colors/radii/shadows come from CSS variables defined in
`src/routes/layout.css` — always use these, never hardcode greys:
`--bg --surface --surface-elevated --border --border-strong --text --text-muted`,
`--radius / --radius-lg / --radius-xl`, `--shadow-sm..xl`. Font: **Inter**.

**Brand accent (single, theme-aware, GLOBAL).** Defined once in `layout.css` and
inherited app-wide — `--primary` and `--accent` both flow from `--brand`, so the
whole UI is one accent. Reference tints as `rgba(var(--brand-rgb), …)`:
- Light: indigo `--brand: #4f46e5` → `--brand-rgb: 79, 70, 229`
- Dark:  emerald `--brand: #34d399` → `--brand-rgb: 52, 211, 153`
- Emerald is light, so in `.dark` `--primary-foreground`/`--accent-foreground`
  flip to near-black (`#0a0a0a`) for text on accent backgrounds.

**Shared building blocks (reuse — do not recreate).** `lib/ui/` primitives plus:
- `DotCanvas.svelte` — the mouse-reactive dot-grid background (props: `gap`,
  `glow`, `interactive`).
- `PageHeader.svelte` — standard route header: `icon` (lucide), `eyebrow`,
  `title`, `subtitle`, `align`, `actions` snippet. Use on every inner route.
- `EmptyState.svelte` — centered icon + title + description + `children` slot,
  with brand halo. Use for dropzone/empty views.
- `icon` props are typed `ComponentType` (lucide icons are not the new `Component`
  functional type — using `Component<…>` fails svelte-check).

**Iconography.** Use **lucide-svelte** line icons (`size=20`, `strokeWidth=1.75`),
never emoji. Icon tiles sit on `--surface` with a `--border` hairline and
`--text-muted` color at rest; on hover they take `--brand` color + a faint
`rgba(var(--brand-rgb),0.08)` tint.

**Signature elements.**
- *Dot-grid canvas background*: use `<DotCanvas />`. Mouse-reactive glow, dots
  colored with the accent (indigo light / emerald dark). Decorative, `aria-hidden`.
- *Brand halo*: one soft radial glow in the accent — never multiple colored orbs.
- *Logomark*: a ringed triad of dots (echoes the dot grid) in brand color; the
  `TAO` wordmark is solid `--text`, weight 700, letter-spacing `-0.045em`.
- *Cards* (`.route-card`): `--surface-elevated`, `--radius-xl`, hairline border,
  `--shadow-sm`. Hover = lift `translateY(-3px)`, brand-tinted border, a
  cursor-following brand spotlight (radial `::after` driven by `--mx/--my` via an
  `onpointermove` handler), and an `ArrowUpRight` that slides in.
- *Entrance*: staggered `rise` keyframe (fade + `translateY(16px)`),
  `cubic-bezier(0.22, 1, 0.36, 1)`, `animation-delay: i * 70ms`.
- *Print artifacts*: `@media print` borders stay hardcoded `#000` (no token
  resolves black in dark-mode print). Restyle screen UI to tokens, not print ink.

**Accessibility.** Every animation must be disabled under
`@media (prefers-reduced-motion: reduce)`. Interactive elements get a
`:focus-visible` brand ring (`box-shadow: 0 0 0 3px rgba(var(--brand-rgb),0.18)`).
Validation rejections, especially file/dropzone rejection states, should visibly
use the error color token (`--danger`) and a short rejection animation (for
example a restrained shake/flash), with the animation disabled under reduced
motion.
Menus, popovers, dropdowns, and newly revealed items should also animate in with
a restrained fade/slide or scale transition, and those animations must respect
`prefers-reduced-motion`.

**Page structure & layout.** Every inner tool route (`/import`, `/export`,
`/library`, `/audit`, …) uses the shared `lib/ui/SidebarLayout.svelte` — a **left
side menu, main content on the right**. Pass the menu (section nav, filters,
settings, file inputs) as the `sidebar` snippet and the primary content as the
default children, led by a `PageHeader`. Do not hand-roll the shell: the component
owns the sticky desktop sidebar, the `.main-area`, and the **≤640px overlay
drawer** — on phones the sidebar collapses to a left drawer over the global
backdrop (in `+layout.svelte`); the header burger toggles `sidebarOpen` and the
backdrop tap closes it. Reuse `PageHeader`/`Card`/`EmptyState` for headers,
surfaces and empty/dropzone states; tokens only. **Never use emoji** — not in UI,
labels, or generated reports — use lucide-svelte icons, and the severity tokens
(`--severity-critical/major/minor`) for status.

**Brand assets & SEO.** `static/favicon.svg` (triad mark on indigo tile),
`static/og-image.png` (1200×630, regenerate from `static/og-image.svg` with
`sharp`). New routes should add `<svelte:head>` with title/description + Open
Graph/Twitter tags mirroring the homepage. `robots.txt` allows general + AI
crawlers (GPTBot, ClaudeBot, anthropic-ai, PerplexityBot, …); keep
`static/sitemap.xml` in sync when adding routes.

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

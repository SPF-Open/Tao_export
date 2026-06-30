# Project stack

TAO is een **SvelteKit** single-page applicatie. De broncode staat op **GitHub**
en elke push naar de productiebranch wordt automatisch uitgerold naar **Cloudflare
Pages**.

## Broncode — GitHub

Repository: [SPF-Open/Tao_Tool](https://github.com/SPF-Open/Tao_Tool)

- Alle broncode, issues en pull requests worden beheerd in GitHub.
- De `Prod` branch is de productiebranch; samenvoegen hierin activeert een
  Cloudflare Pages-uitrol.
- Bijdragen verlopen via pull requests. CI wordt automatisch uitgevoerd bij elke PR.

## Hosting — Cloudflare Pages

De app wordt geserveerd via **Cloudflare Pages** op `https://tao.lv0.eu`.

- Uitrollen worden automatisch geactiveerd bij elke push naar `Prod`.
- Het edge-netwerk van Cloudflare serveert de statische bestanden wereldwijd zonder
  oorspronkelijke server.
- Voorbeelduitrollen worden aangemaakt voor elke pull request, elk met een eigen
  unieke URL.

## Build

| Tool | Rol |
|------|-----|
| **SvelteKit** | App-framework (routing, SSR/SSG, laadfuncties) |
| **Vite** | Ontwikkelserver en bundler |
| **TypeScript** | Type-veilige applicatiecode |
| **Tailwind CSS** | Utility-first stijlen |
| **Bun / npm** | Pakketbeheer en scripts |

De app wordt gebouwd als een volledig statische site (`adapter-static`) — er is geen
serverruntime vereist en alle verwerking vindt plaats in de browser.

## Privacy

Omdat er geen backend is, verlaat er nooit data de browser van de gebruiker. Bestanden
die naar een tool worden geüpload, worden volledig client-side verwerkt en worden
nooit verstuurd naar Cloudflare, GitHub of een derde partij.

# Stack du projet

TAO est une application monopage **SvelteKit**. Le code source est hébergé sur **GitHub**
et chaque push sur la branche de production est automatiquement déployé sur **Cloudflare
Pages**.

## Code source — GitHub

Dépôt : [SPF-Open/Tao_Tool](https://github.com/SPF-Open/Tao_Tool)

- L'ensemble du code source, des issues et des pull requests est géré dans GitHub.
- La branche `Prod` est la branche de production ; toute fusion dans cette branche déclenche
  un déploiement Cloudflare Pages.
- Les contributions passent par des pull requests. La CI s'exécute automatiquement sur chaque PR.

## Hébergement — Cloudflare Pages

L'application est servie depuis **Cloudflare Pages** à l'adresse `https://tao.lv0.eu`.

- Les déploiements sont déclenchés automatiquement à chaque push sur `Prod`.
- Le réseau edge de Cloudflare sert les ressources statiques à l'échelle mondiale, sans
  serveur d'origine.
- Des déploiements de prévisualisation sont créés pour chaque pull request, chacun avec sa
  propre URL unique.

## Build

| Outil | Rôle |
|-------|------|
| **SvelteKit** | Framework applicatif (routage, SSR/SSG, fonctions de chargement) |
| **Vite** | Serveur de développement et bundler |
| **TypeScript** | Code applicatif typé |
| **Tailwind CSS** | Styles utilitaires |
| **Bun / npm** | Gestion des paquets et scripts |

L'application est compilée en site entièrement statique (`adapter-static`) — aucun runtime
serveur n'est nécessaire et tout le traitement s'effectue dans le navigateur.

## Confidentialité

En l'absence de backend, aucune donnée ne quitte jamais le navigateur de l'utilisateur. Les
fichiers téléversés dans n'importe quel outil sont traités entièrement côté client et ne sont
jamais envoyés à Cloudflare, GitHub ou un quelconque tiers.

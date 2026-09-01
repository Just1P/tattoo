[![CI](https://github.com/Just1P/tattoo/actions/workflows/ci.yml/badge.svg)](https://github.com/Just1P/tattoo/actions/workflows/ci.yml)

# Tattoo Pro

Marketplace mettant en relation clients et tatoueurs : recherche d'artistes par ville/style/tarif, portfolio d'œuvres, prise de rendez-vous, messagerie, et back-office artiste (disponibilités, réservations, statistiques).

**Démo en ligne** : https://tattoo-gmeb.vercel.app

## Stack

- **Framework** : [Next.js 16](https://nextjs.org) (App Router, React Server Components), TypeScript
- **UI** : Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com), [Tabler Icons](https://tabler.io/icons)
- **Base de données** : PostgreSQL, [Prisma 7](https://www.prisma.io) (generator `prisma-client`, adapter `pg`)
- **Authentification** : [better-auth](https://www.better-auth.com) (email/mot de passe + Google OAuth)
- **Validation** : [Zod](https://zod.dev)
- **Upload d'images** : [UploadThing](https://uploadthing.com)
- **Emails transactionnels** : [Resend](https://resend.com)
- **Sélecteurs de dates** : [react-day-picker](https://daypicker.dev)
- **Tests** : [Vitest](https://vitest.dev) (unitaires) + [Playwright](https://playwright.dev) (E2E)
- **CI/CD** : GitHub Actions, déploiement [Vercel](https://vercel.com)

Voir [`docs/architecture.md`](docs/architecture.md) pour le détail des couches et des choix techniques.

## Prérequis

- Node.js ≥ 22.13
- [pnpm](https://pnpm.io) (`corepack enable` si besoin)
- Docker (pour Postgres en local) — ou une base Postgres/Neon déjà accessible

## Installation

```bash
git clone https://github.com/Just1P/tattoo.git
cd tattoo
pnpm install

cp .env.example .env
# Renseigner au minimum DATABASE_URL et BETTER_AUTH_SECRET dans .env

docker compose up -d        # démarre Postgres (+ Adminer sur :8080)
pnpm exec prisma migrate deploy
pnpm db:seed                 # 3 artistes de démo, styles, œuvres, réservations

pnpm dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000). Les comptes de démo créés par `pnpm db:seed` sont listés dans [`prisma/seed.ts`](prisma/seed.ts) (mot de passe : `Demo1234!`).

## Commandes

| Commande | Description |
|---|---|
| `pnpm dev` | Serveur de développement (Turbopack) |
| `pnpm build` | Build de production |
| `pnpm start` | Lance le build de production |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Vérification TypeScript (`tsc --noEmit`) |
| `pnpm test` | Tests unitaires (Vitest) |
| `pnpm test:e2e` | Tests end-to-end (Playwright) |
| `pnpm db:seed` | Peuple la base avec des données de démonstration |

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — schéma des couches, choix techniques
- [`docs/mcd.md`](docs/mcd.md) — modèle conceptuel de données
- [`docs/securite/test-securite.md`](docs/securite/test-securite.md) — test de sécurité (rate limiting, brute-force)
- [`docs/veille.md`](docs/veille.md) — sources de veille, vulnérabilité traitée
- [`docs/tests/jeu-essai.md`](docs/tests/jeu-essai.md) — jeu d'essai du parcours E2E

## Déploiement

L'application est déployée automatiquement sur [Vercel](https://vercel.com) à chaque push sur `main` (intégration GitHub). Le pipeline CI (`.github/workflows/ci.yml`) exécute `lint`, `typecheck` et les tests unitaires sur chaque pull request, et rejoue les tests E2E contre un Postgres jetable après chaque fusion sur `main`.

# Veille technologique et sécuritaire

## Sources suivies

| Source | Sujet | Lien |
|---|---|---|
| GitHub Security Advisories (via `pnpm audit`) | Vulnérabilités des dépendances npm du projet | https://github.com/advisories |
| npm / GitHub Advisory Database | Détail des CVE/GHSA touchant l'écosystème JS | https://github.com/advisories?ecosystem=npm |
| Next.js — Blog & Releases | Changements de sécurité, dépréciations, breaking changes | https://nextjs.org/blog |
| Vercel — Changelog | Évolutions de la plateforme de déploiement | https://vercel.com/changelog |
| better-auth — Releases GitHub | Le projet évolue vite (1.5 → 1.7 en quelques semaines) ; correctifs de sécurité notés dans les release notes | https://github.com/better-auth/better-auth/releases |
| Prisma — Releases GitHub | Migrations de version du générateur/ORM utilisé | https://github.com/prisma/prisma/releases |
| OWASP Top 10 | Référentiel des familles de vulnérabilités web (utilisé pour les audits manuels, ex: ticket #88 IDOR) | https://owasp.org/www-project-top-ten/ |

## Périodicité

- **`pnpm audit`** : lancé manuellement avant chaque jalon important (comme au ticket #97), et à terme prévu en job CI hebdomadaire (piste d'amélioration, non encore mise en place — voir `docs/architecture.md`).
- **Suivi des releases** (Next.js, better-auth, Prisma) : hebdomadaire, au moment de faire `pnpm outdated` avant de démarrer une nouvelle session de travail.
- **GitHub Advisories** : consultées à la demande dès qu'un `pnpm install` ou `pnpm audit` signale une alerte (comportement réactif, pas de créneau fixe dédié).

## Vulnérabilité réellement rencontrée et traitée

**GHSA-pw9m-5jxm-xr6h** — *Better Auth: OAuth refresh-token replay via missing client authentication on oidc-provider and mcp plugins*

- **Sévérité** : Critique
- **Advisory publié le** : 2026-07-07 ([github.com/advisories/GHSA-pw9m-5jxm-xr6h](https://github.com/advisories/GHSA-pw9m-5jxm-xr6h))
- **Package concerné** : `better-auth` (dépendance directe du projet, gère l'authentification)
- **Versions vulnérables** : `< 1.6.11`
- **Version corrigée** : `>= 1.6.11`
- **Date de détection** : 2026-09-01, remontée par `pnpm audit --prod` lors du ticket #97 (préparation de la soutenance) — le projet utilisait `better-auth@1.5.5`, dans la plage vulnérable
- **Correctif appliqué** : mise à jour vers `better-auth@1.7.2` (dernière version stable, largement au-dessus du seuil du correctif), commit [`2d2f957`](https://github.com/Just1P/tattoo/commit/2d2f957), PR [#110](https://github.com/Just1P/tattoo/pull/110)
- **Effet de bord découvert et traité dans la foulée** : la nouvelle version de better-auth introduit un champ `issuer` obligatoire sur le modèle `Account`, absent de notre schéma Prisma — cassait l'inscription/connexion. Migration `20260901172550_add_account_issuer` créée manuellement (colonne nullable → backfill selon la convention de better-auth → `NOT NULL`), pour ne perdre aucune des 12 lignes existantes.
- **Vérification** : `pnpm audit --prod` ne remonte plus la vulnérabilité (0 critique après correctif, contre 1 avant) ; suite E2E, tests unitaires, build de production et lint rejoués avec succès après la mise à jour.

Cet exemple illustre pourquoi la veille sur les dépendances d'authentification est prioritaire : `better-auth` est la seule ligne de défense entre un visiteur anonyme et les comptes utilisateurs, une vulnérabilité y est donc traitée en priorité absolue, avant les vulnérabilités de sévérité équivalente sur des dépendances moins critiques (ex: outillage de build).

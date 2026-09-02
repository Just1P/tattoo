# Gestion de projet — préparation de la soutenance

## Méthode

Pilotage en solo via GitHub : un **kanban** (GitHub Project [#8 « Tattoo project »](https://github.com/users/Just1P/projects/8)) où chaque tâche est une **issue** étiquetée par CCP (`CCP1`/`CCP2`/`CCP3`) et par nature (`tests`, `securite`, `docs`, `ci`), rattachée à un **milestone** J1 à J7 — un milestone = un thème de la semaine, pas un jour calendaire strict (voir écart ci-dessous).

Règle appliquée à chaque ticket : **une branche dédiée, une pull request, une CI verte avant fusion** (voir *Definition of Done*). Les PR sont nommées `<numéro>-<slug>` (ex: `86-security-headers`) et référencent le ticket qu'elles ferment (`Closes #86`), ce qui donne une traçabilité automatique issue ↔ commit ↔ PR.

## Jalons J1 → J7

| Jalon | Thème | Objectif |
|---|---|---|
| J1 | CI/CD | Pipeline GitHub Actions (lint, typecheck, tests, E2E), scripts npm |
| J2 | Tests unitaires | Vitest, schémas Zod, helpers de dates/tarifs |
| J3 | Tests E2E | Playwright, parcours critique, jeu d'essai exporté |
| J4 | Sécurité | Headers HTTP, rate limiting, audit IDOR, test de sécurité documenté |
| J5 | Documentation | README, architecture, MCD, veille, seed de démo |
| J6 | Gestion de projet | GitHub Project, nettoyage des issues obsolètes |
| J7 | Finalisation | Audit des dépendances, gel du code, cohérence dossier/code |

## Planning réel vs prévisionnel

Le nommage « J1 » à « J7 » suggérait initialement sept jours calendaires consécutifs. Dans les faits, la quasi-totalité du travail (tickets #79 à #114) s'est déroulée sur une **seule journée réelle, le 2026-09-01**, en deux sessions (une courte en tout début de matinée, ~00h50–02h00, heure locale UTC+2 ; une longue en fin de journée, ~18h45–20h45, heure locale UTC+2) — le contexte professionnel imposait de compresser une semaine de préparation prévue en une fenêtre bien plus courte. Le nommage J1-J7 a été conservé comme **étiquette thématique** (milestone GitHub) plutôt que jour strict, ce qui reste cohérent avec les critères d'acceptation de chaque ticket.

**Écarts d'ordre d'exécution par rapport au séquencement thématique déclaré :**

- Les tests unitaires (J2) et E2E (J3) ont été traités **avant** la finalisation du pipeline CI (J1, ticket #79) : plus logique de garantir que le pipeline, une fois écrit, référence des scripts et des tests déjà fonctionnels plutôt que de le construire en deux passes.
- L'audit des dépendances (J7, ticket #97) a été traité **en avance**, entre plusieurs tickets J5 — un correctif critique réel (`better-auth`, voir `docs/veille.md`) a été découvert et isolé dès qu'il a été identifié, plutôt que d'attendre la fin de la semaine.
- Le ticket #88 (audit IDOR, J4) prévoyait de trouver **et corriger** une faille — l'audit a conclu que la route `/api/bookings/[id]/status` était **déjà sécurisée**. Plutôt que de fermer le ticket sans rien produire pour la soutenance, le travail a été réorienté vers #87 (rate limiting sur l'authentification, hors périmètre initial mais découvert pendant l'audit), qui a révélé une vraie faille critique — devenue la base du test de sécurité documenté en #89.
- Deux issues préexistantes (#57, #59) se sont avérées déjà résolues dans le code lors du nettoyage du ticket #94 (J6) — clôturées avec référence au commit qui les avait réellement corrigées, plutôt que rouvertes ou dupliquées.

## Stratégie de branches et environnements

Trois branches longues, chacune reliée à un environnement de déploiement Vercel distinct :

| Branche   | Rôle                                            | Déploiement Vercel |
|-----------|--------------------------------------------------|---------------------|
| `dev`     | Intégration des tickets. Branche par défaut, cible des PR de feature. | Preview (URL stable `*-git-dev-*.vercel.app`) |
| `staging` | Validation pré-prod sur un environnement complet avant mise en ligne. | Preview (URL stable `*-git-staging-*.vercel.app`) |
| `main`    | Production.                                      | Production (domaine réel) |

Flux de promotion : `<numéro-issue>-<slug>` → PR → `dev` → (PR groupée) → `staging` → (PR de mise en production) → `main`.

La CI (`.github/workflows/ci.yml`) tourne sur les PR et les push vers ces trois branches (`lint`, `typecheck`, `test`) ; `e2e` tourne uniquement sur push (jamais sur PR, trop lent à rejouer à chaque commit), sur les trois branches, pour valider chaque étape de promotion avant qu'elle n'atteigne la prod.

Vercel déploie automatiquement toute branche poussée sur GitHub : `main` est configurée comme branche de production dans les réglages du projet (Settings → Git → Production Branch), `dev` et `staging` reçoivent chacune une URL de preview stable propre à la branche, sans configuration supplémentaire.

## Definition of Done

Un ticket n'est considéré terminé que si **toutes** ces conditions sont réunies :

1. **Branche dédiée** créée depuis `dev` à jour, nommée `<numéro-issue>-<slug>`
2. **Implémentation** conforme aux tâches et critères d'acceptation de l'issue
3. **Tests** : unitaires et/ou E2E ajoutés ou mis à jour si le comportement change ; vérification empirique quand c'est pertinent (ex: `curl -I` pour confirmer des headers HTTP, requêtes réelles pour un test de sécurité)
4. **Vérification locale** avant commit : `pnpm lint`, `pnpm typecheck`, `pnpm test`, et `pnpm test:e2e` si le parcours concerné est touché — tous verts
5. **Commit** avec message explicite (contexte + ce qui change) et `Closes #<numéro>`
6. **Pull request** ouverte avec description résumant le changement et la vérification faite, milestone et labels posés
7. **CI verte** (`lint`, `typecheck`, `test`, `e2e` si applicable, déploiement preview Vercel) avant toute fusion
8. **Fusion en squash**, branche supprimée, `dev` resynchronisé avant le ticket suivant
9. **Documentation** mise à jour si le ticket en prévoyait une (`docs/`)

**Exemple vérifiable** — ticket #86 (headers de sécurité sur `/api/*`) :
branche `86-security-headers` → code (`lib/security-headers.ts`, `next.config.ts`) → vérification empirique (`curl -I http://localhost:3000/api/artists` confirmant les headers, absents avant) → `pnpm test:e2e` rejoué et vert → commit `Closes #86` → [PR #112](https://github.com/Just1P/tattoo/pull/112) avec CI verte (lint/typecheck/test/Vercel) → fusionnée en squash → issue #86 fermée automatiquement. Le même schéma s'observe sur chacune des PR #100 à #114.

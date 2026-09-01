# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

## [1.0.0] — 2026-09-01

Première version stable, préparée pour la soutenance du titre professionnel CDA.

### Ajouté

**Authentification & profils**
- Inscription/connexion par email et mot de passe, connexion Google OAuth (better-auth)
- Sélection de rôle (client / artiste) et onboarding du profil artiste (bio, ville, SIRET, tarifs, styles)
- Édition de profil (avatar, informations) pour clients et artistes

**Découverte & portfolio**
- Recherche et filtrage des artistes (ville, style, fourchette de prix)
- Fil d'actualité (feed) des œuvres avec filtrage par style et pagination
- Gestion de portfolio artiste : upload, édition, suppression, réorganisation des œuvres
- Système de favoris (œuvres) et d'abonnement (suivre un artiste)
- Pages publiques artistes avec métadonnées SEO, sitemap et robots.txt

**Réservations & disponibilités**
- Demande de rendez-vous par un client (type, zone, taille, description)
- Gestion des disponibilités artiste : créneaux hebdomadaires récurrents et périodes bloquées
- Confirmation / refus des demandes par l'artiste, avec notifications email transactionnelles (Resend)

**Messagerie & notifications**
- Messagerie interne entre clients et artistes (conversations, pièces jointes)
- Notifications in-app (nouvelles demandes, réservations confirmées/annulées, nouveaux abonnés) avec badge de compteur

**Administration**
- Back-office de vérification des profils artistes (approbation/rejet)

**Qualité, sécurité & outillage** *(semaine de préparation à la soutenance)*
- Pipeline CI GitHub Actions : lint, typecheck et tests unitaires sur chaque pull request, tests E2E sur `main`
- Suite de tests unitaires (Vitest) : schémas de validation Zod, helpers de dates et de tarifs
- Parcours end-to-end (Playwright) : inscription → recherche d'artiste → réservation, avec jeu d'essai exporté (`docs/tests/`)
- Headers de sécurité HTTP (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS) appliqués sur les pages **et** l'API
- Rate limiting sur la connexion par mot de passe (protection brute-force)
- Audit d'autorisation des routes de réservation (IDOR)
- Mise à jour des dépendances vulnérables (dont un correctif critique better-auth) via `pnpm audit`
- Script de seed (`prisma/seed.ts`) et `.env.example` pour une démo reproductible
- Documentation : architecture, modèle conceptuel de données, veille technologique, gestion de projet, test de sécurité

### Sécurité
- Voir [`docs/securite/test-securite.md`](docs/securite/test-securite.md) et [`docs/veille.md`](docs/veille.md) pour le détail des correctifs appliqués durant cette version.

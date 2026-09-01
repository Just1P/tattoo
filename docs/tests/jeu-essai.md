# Jeu d'essai — parcours client (inscription → recherche → réservation)

Scénario automatisé par Playwright (`e2e/booking-journey.spec.ts`), rejoué à chaque push sur `main` par la CI (`.github/workflows/ci.yml`, job `e2e`).

- **Résultat global** : ✅ 1/1 test passé, 0 échec, 0 flaky
- **Date d'exécution de référence** : 2026-09-01
- **Durée totale** : 19,0 s (dont 11,2 s pour le test lui-même)
- **Rapport complet** : [`rapport-e2e/html/index.html`](rapport-e2e/html/index.html) (Playwright HTML reporter) et [`rapport-e2e/results.json`](rapport-e2e/results.json) (données brutes)
- **Captures d'écran** : [`rapport-e2e/screenshots/`](rapport-e2e/screenshots/), une par étape

| # | Étape | Entrée | Résultat attendu | Résultat obtenu | Statut | Durée |
|---|-------|--------|-------------------|-------------------|--------|-------|
| 1 | Inscription d'un nouveau compte client | Nom `Client E2E`, email unique horodaté, mot de passe `MotDePasse123!` (+ confirmation) soumis via `/register` | Redirection vers `/role-selection` | Redirection vers `/role-selection` confirmée ([capture](rapport-e2e/screenshots/01-inscription.png)) | ✅ | 4,83 s |
| 2 | Sélection du rôle client | Clic sur « Je cherche un tatoueur » | Redirection vers `/` (accueil) | Redirection vers `/` confirmée ([capture](rapport-e2e/screenshots/02-role-selectionne.png)) | ✅ | 0,96 s |
| 3 | Recherche de l'artiste par nom | Saisie de « E2E Test Artist » dans le champ de recherche sur `/artists` | La fiche de l'artiste apparaît dans les résultats filtrés | Lien « E2E Test Artist » visible dans la liste filtrée ([capture](rapport-e2e/screenshots/03-recherche-artiste.png)) | ✅ | 1,35 s |
| 4 | Ouverture de la fiche artiste | Clic sur le lien de la carte artiste | Navigation vers `/artists/{id}` | URL `/artists/{id}` confirmée ([capture](rapport-e2e/screenshots/04-fiche-artiste.png)) | ✅ | 1,44 s |
| 5 | Ouverture du formulaire de demande de RDV | Clic sur « Demander un RDV » | Le formulaire (type, zone, taille, description) s'affiche | Champ « Type de rendez-vous » visible ([capture](rapport-e2e/screenshots/05-formulaire-ouvert.png)) | ✅ | 0,41 s |
| 6 | Sélection du type et de la taille | Type = « Premier rendez-vous », zone = « Avant-bras », taille = « Moyen (5–15 cm) » | Les champs reflètent les valeurs sélectionnées | Champs remplis conformément à la saisie ([capture](rapport-e2e/screenshots/06-champs-remplis.png)) | ✅ | 0,47 s |
| 7 | Description du projet et soumission | Description « Un tatouage floral sur l'avant-bras, style fine line. » puis clic sur « Envoyer la demande » | La requête `POST /api/bookings` est acceptée | Requête acceptée, aucune erreur affichée ([capture](rapport-e2e/screenshots/07-avant-envoi.png)) | ✅ | 0,24 s |
| 8 | Confirmation de l'envoi | — | Message « Demande envoyée ! L'artiste vous contactera bientôt. » visible | Message de confirmation affiché ([capture](rapport-e2e/screenshots/08-confirmation.png)) | ✅ | 1,38 s |

## Reproduire ce jeu d'essai

```bash
pnpm test:e2e
```

Génère automatiquement le rapport HTML/JSON et les captures d'écran dans `docs/tests/rapport-e2e/` (écrasés à chaque exécution). L'artiste utilisé pour la recherche (étape 3) est provisionné automatiquement par `e2e/global-setup.ts`, indépendamment des données de démo réelles.

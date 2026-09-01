# Test de sécurité — brute-force sur la connexion

## Contexte

Le handler d'authentification `/api/auth/[...all]/route.ts` (better-auth) exposait toutes ses actions — dont `POST /api/auth/sign-in/email` — sans aucune limite de tentatives. Un attaquant connaissant l'email d'un compte pouvait tenter un nombre illimité de mots de passe (brute-force / dictionnaire) sans être ralenti.

Correctif : [`app/api/auth/[...all]/route.ts`](../../app/api/auth/%5B...all%5D/route.ts), ticket [#87](https://github.com/Just1P/tattoo/pull/107).

## Scénario joué

Compte cible créé pour le test : `bruteforce.target@tattoo-pro.test` / mot de passe réel `CorrectHorseBattery1!`.

### Avant le correctif

Code de `app/api/auth/[...all]/route.ts` remis temporairement dans son état d'avant #87 (`toNextJsHandler(auth)` exposé tel quel, sans limite), pour rejouer l'attaque en conditions réelles :

```bash
for i in 1 2 3 4 5 6 7 8 9 10; do
  curl -s -X POST http://localhost:3000/api/auth/sign-in/email \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"bruteforce.target@tattoo-pro.test\",\"password\":\"WrongPassword$i\"}" \
    -w "\nHTTP %{http_code}\n"
done
```

**Sortie réelle** (10/10 tentatives acceptées, aucune limite) :

```
=== Tentative 1 (mauvais mot de passe) ===
{"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}
HTTP 401
=== Tentative 2 (mauvais mot de passe) ===
{"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}
HTTP 401
[...]
=== Tentative 10 (mauvais mot de passe) ===
{"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}
HTTP 401
```

**Preuve de l'impact réel** — la tentative suivante, avec le bon mot de passe, aboutit sans aucune friction :

```bash
curl -s -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"bruteforce.target@tattoo-pro.test","password":"CorrectHorseBattery1!"}' \
  -w "\nHTTP %{http_code}\n"
```

```
{"redirect":false,"token":"IHBGcYk2FgGnxLBGSgBrBY4l1fSe5kL9","user":{"email":"bruteforce.target@tattoo-pro.test", ...}}
HTTP 200
```

Rien ne ralentit ni ne bloque l'attaquant : avec un dictionnaire de mots de passe courants et un peu de temps, le compte est compromis — la session (`token`) est délivrée normalement à la tentative gagnante.

### Correctif appliqué

```ts
// app/api/auth/[...all]/route.ts
export async function POST(req: NextRequest) {
  if (req.nextUrl.pathname === "/api/auth/sign-in/email") {
    const limited = rateLimit(req, { id: "auth-sign-in", limit: 5, windowSec: 900 });
    if (limited) return limited;
  }
  return basePOST(req);
}
```

`rateLimit` (`lib/rate-limit.ts`) compte les requêtes par IP dans une fenêtre glissante et renvoie `429` au-delà du seuil.

### Après le correctif

Même script, rejoué après déploiement du correctif :

```
=== Tentative 1 (mauvais mot de passe) ===
{"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}
HTTP 401
=== Tentative 2 (mauvais mot de passe) ===
{"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}
HTTP 401
=== Tentative 3 (mauvais mot de passe) ===
{"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}
HTTP 401
=== Tentative 4 (mauvais mot de passe) ===
{"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}
HTTP 401
=== Tentative 5 (mauvais mot de passe) ===
{"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}
HTTP 401
=== Tentative 6 (mauvais mot de passe) ===
{"error":"Trop de requêtes, réessayez dans quelques instants."}
HTTP 429
```

**Résultat après** : la 6ᵉ tentative (dans les 15 minutes suivant la 1ʳᵉ) est bloquée avec `429`.

### Contrôle : pas de contournement via un mot de passe correct

Un attaquant qui devinerait le bon mot de passe pile après avoir épuisé le quota ne doit pas pouvoir passer en force :

```bash
curl -s -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"bruteforce.target@tattoo-pro.test","password":"CorrectHorseBattery1!"}' \
  -w "\nHTTP %{http_code}\n"
```

```
{"error":"Trop de requêtes, réessayez dans quelques instants."}
HTTP 429
```

Confirmé : le blocage ne dépend pas de la validité des identifiants, seulement du nombre de requêtes dans la fenêtre — pas de contournement possible.

### Non-régression : usage légitime non impacté

Le parcours E2E (`e2e/booking-journey.spec.ts`, ticket #84) inscrit un nouveau compte à chaque exécution via `POST /api/auth/sign-up/email` — une action volontairement **non** limitée (voir justification dans le commit de #87 : limiter l'inscription n'apporte pas de protection équivalente contre un risque réel et gênerait des usages légitimes comme la démo ou les tests). Le test E2E complet passe sans être affecté par ce correctif :

```
$ pnpm test:e2e
ok 1 [chromium] › booking-journey.spec.ts › ... (9.5s)
1 passed (12.9s)
```

## Reproduire ce test

1. `pnpm dev`
2. Créer un compte de test : `POST /api/auth/sign-up/email`
3. Rejouer la boucle de 6 tentatives ci-dessus contre `POST /api/auth/sign-in/email`
4. Constater le passage de `401` à `429` à la 6ᵉ tentative

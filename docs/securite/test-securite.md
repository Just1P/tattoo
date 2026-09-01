# Tests de sécurité

## Scénario 1 — Brute-force sur la connexion

### Contexte

Le handler d'authentification `/api/auth/[...all]/route.ts` (better-auth) exposait toutes ses actions — dont `POST /api/auth/sign-in/email` — sans aucune limite de tentatives. Un attaquant connaissant l'email d'un compte pouvait tenter un nombre illimité de mots de passe (brute-force / dictionnaire) sans être ralenti.

Correctif : [`app/api/auth/[...all]/route.ts`](../../app/api/auth/%5B...all%5D/route.ts), ticket [#87](https://github.com/Just1P/tattoo/pull/107).

### Scénario joué

Compte cible créé pour le test : `bruteforce.target@tattoo-pro.test` / mot de passe réel `CorrectHorseBattery1!`.

#### Avant le correctif

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

#### Correctif appliqué

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

#### Après le correctif

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

#### Contrôle : pas de contournement via un mot de passe correct

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

#### Non-régression : usage légitime non impacté

Le parcours E2E (`e2e/booking-journey.spec.ts`, ticket #84) inscrit un nouveau compte à chaque exécution via `POST /api/auth/sign-up/email` — une action volontairement **non** limitée (voir justification dans le commit de #87 : limiter l'inscription n'apporte pas de protection équivalente contre un risque réel et gênerait des usages légitimes comme la démo ou les tests). Le test E2E complet passe sans être affecté par ce correctif :

```
$ pnpm test:e2e
ok 1 [chromium] › booking-journey.spec.ts › ... (9.5s)
1 passed (12.9s)
```

### Reproduire ce test

1. `pnpm dev`
2. Créer un compte de test : `POST /api/auth/sign-up/email`
3. Rejouer la boucle de 6 tentatives ci-dessus contre `POST /api/auth/sign-in/email`
4. Constater le passage de `401` à `429` à la 6ᵉ tentative

---

## Scénario 2 — Élévation de privilèges à l'inscription

### Contexte

Trouvé le 2026-09-01 lors de la relecture du dossier de soutenance : l'extrait de code présenté en Partie 9 (Réalisation 1 — `lib/auth.ts`) exposait le champ additionnel `role` avec `input: true`. D'après la documentation better-auth, `input: true` signifie que le champ est accepté **tel quel** depuis le corps de la requête d'inscription. N'importe quel appelant pouvait donc envoyer `{ email, password, name, role: "admin" }` sur `POST /api/auth/sign-up/email` et obtenir un compte administrateur — sans jamais passer par l'interface, qui ne propose que « Client » et « Tatoueur ».

Impact réel : `app/(admin)/layout.tsx` n'effectue qu'une vérification `session.user.role !== "admin"` pour donner accès au back-office de vérification des profils artistes (`/admin/verification`). Un compte forgé de cette façon obtenait donc un accès complet à cette page.

Correctif : [`lib/auth.ts`](../../lib/auth.ts).

**Vérification préalable** : aucun compte `role: "admin"` n'existait en base au moment de la découverte — la faille n'avait pas été exploitée.

### Avant le correctif

```bash
curl -s -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Privilege Escalation Test","email":"privesc.test@tattoo-pro.test","password":"MotDePasse123!","role":"admin"}' \
  -w "\nHTTP %{http_code}\n"
```

```
{"token":"UGoc5caKQdzA3tCz7BALeGAk6s7O6typ","user":{"name":"Privilege Escalation Test","email":"privesc.test@tattoo-pro.test","role":"admin", ...}}
HTTP 200
```

Le compte est bien créé avec `"role":"admin"`. Preuve de l'impact réel — accès effectif au back-office avec la session obtenue :

```bash
curl -s -b cookies.txt http://localhost:3000/admin/verification -o /dev/null -w "%{http_code}\n"
```

```
200
```

### Correctif appliqué

```ts
// lib/auth.ts
user: {
  additionalFields: {
    role: {
      type: "string",
      required: false,
      defaultValue: "client",
      input: false, // jamais accepté tel quel depuis la requête client
    },
  },
},
databaseHooks: {
  user: {
    create: {
      before: async (user, context) => {
        const requestedRole = (context?.body as { role?: unknown } | undefined)?.role;
        const ALLOWED_SIGNUP_ROLES = ["client", "artist"] as const;
        const role = ALLOWED_SIGNUP_ROLES.includes(
          requestedRole as (typeof ALLOWED_SIGNUP_ROLES)[number],
        )
          ? (requestedRole as "client" | "artist")
          : "client";

        return { data: { ...user, role } };
      },
      // ... (hook after existant, inchangé)
    },
  },
},
```

`input: false` retire `role` du schéma que better-auth assigne automatiquement depuis la requête. Le hook `user.create.before` relit la valeur demandée directement dans le corps brut de la requête (`context.body`), la filtre contre une liste blanche stricte (`client` ou `artist` uniquement — jamais `admin`), et l'assigne explicitement. Un choix de rôle légitime reste donc possible côté formulaire d'inscription, sans qu'aucune valeur arbitraire ne puisse être injectée.

### Après le correctif

```bash
curl -s -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Privilege Escalation Retry","email":"privesc.retry@tattoo-pro.test","password":"MotDePasse123!","role":"admin"}' \
  -w "\nHTTP %{http_code}\n"
```

```
{"token":"c5ZKg57jF6mSEVlJ18SbMURvL0Ake0Ps","user":{"name":"Privilege Escalation Retry","email":"privesc.retry@tattoo-pro.test","role":"client", ...}}
HTTP 200
```

`role: "admin"` envoyé, silencieusement ramené à `"client"` — pas d'erreur qui confirmerait à l'attaquant qu'il a touché un mécanisme de sécurité, juste le comportement par défaut normal. Contrôle de l'accès au back-office avec ce compte :

```bash
curl -s -b cookies.txt http://localhost:3000/admin/verification -o /dev/null -w "%{http_code} -> %{redirect_url}\n"
```

```
307 -> http://localhost:3000/
```

Accès refusé, redirection vers l'accueil.

### Contrôle : le choix de rôle légitime n'est pas cassé

```bash
curl -s -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Legit Artist Signup","email":"legit.artist@tattoo-pro.test","password":"MotDePasse123!","role":"artist"}' \
  -w "\nHTTP %{http_code}\n"
```

```
{"token":"oCfiM6r34ms0cr3ycNr2dez7Krw1afhL","user":{"name":"Legit Artist Signup","email":"legit.artist@tattoo-pro.test","role":"artist", ...}}
HTTP 200
```

`role: "artist"` correctement appliqué, et le profil `TattooArtist` associé est bien auto-créé (hook `after` inchangé, vérifié en base).

### Non-régression

`pnpm test` (25/25), `pnpm test:e2e` et `pnpm db:seed` (création des 3 artistes de démo via ce même mécanisme) rejoués avec succès après le correctif.

### Reproduire ce test

1. `pnpm dev`
2. `POST /api/auth/sign-up/email` avec `{ "role": "admin", ... }` dans le corps
3. Constater que le compte créé a `"role":"client"`, jamais `"admin"`
4. Vérifier qu'une requête sur `/admin/verification` avec la session de ce compte redirige vers `/`

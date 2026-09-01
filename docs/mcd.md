# Modèle conceptuel de données (MCD)

Dérivé de [`prisma/schema.prisma`](../prisma/schema.prisma), qui fait office de **modèle physique** (MPD) : chaque entité ci-dessous y correspond à un `model` Prisma, chaque association 0,n/1,n matérialisée par une table de jonction ou une clé étrangère.

## Diagramme

```mermaid
erDiagram
    USER ||--o| TATTOO_ARTIST : "a un profil (optionnel)"
    TATTOO_ARTIST ||--o{ TATTOO : "publie"
    STYLE ||--o{ TATTOO : "catégorise"
    TATTOO_ARTIST ||--o{ ARTIST_STYLE : "pratique"
    STYLE ||--o{ ARTIST_STYLE : ""
    TATTOO_ARTIST ||--o{ ARTIST_FOLLOWER : "est suivi"
    USER ||--o{ ARTIST_FOLLOWER : "suit"
    USER ||--o{ FAVORITE_TATTOO : "aime"
    TATTOO ||--o{ FAVORITE_TATTOO : ""
    USER ||--o{ BOOKING : "demande (client)"
    TATTOO_ARTIST ||--o{ BOOKING : "reçoit"
    TATTOO_ARTIST ||--o{ WEEKLY_SLOT : "définit"
    TATTOO_ARTIST ||--o{ BLOCKED_PERIOD : "définit"
    USER ||--o{ CONVERSATION_PARTICIPANT : "participe"
    CONVERSATION ||--o{ CONVERSATION_PARTICIPANT : ""
    CONVERSATION ||--o{ MESSAGE : "contient"
    USER ||--o{ MESSAGE : "envoie"
    USER ||--o{ NOTIFICATION : "reçoit"
    USER ||--o{ SESSION : "session active (better-auth)"
    USER ||--o{ ACCOUNT : "identifiant lié (better-auth)"
```

## Entités et attributs principaux

| Entité | Attributs clés | Rôle |
|---|---|---|
| **User** | email, role (client/artist/admin), roleSelected, avatarUrl | Compte, quel que soit le rôle |
| **TattooArtist** | artistName, bio, city, siret, priceMin/Max, verified | Profil professionnel d'un `User` role=artist |
| **Tattoo** | title, description, imageUrl, position, pinned | Œuvre publiée par un artiste |
| **Style** | name, slug, usageCount | Référentiel des styles (fine line, old school, ...) |
| **Booking** | status (pending/confirmed/cancelled), tattooType, size, startAt/endAt | Demande de rendez-vous client → artiste |
| **WeeklySlot** | day, startTime, endTime | Créneau récurrent hebdomadaire de disponibilité |
| **BlockedPeriod** | startDate, endDate, label | Période bloquée (congés, conventions) |
| **Conversation / Message** | content, imageUrl, readAt | Messagerie interne |
| **Notification** | type, read, payload (JSON) | Notification in-app |

`ArtistStyle`, `ArtistFollower`, `FavoriteTattoo`, `ConversationParticipant` sont des **entités d'association** (tables de jonction many-to-many), chacune avec une contrainte d'unicité sur la paire de clés étrangères pour empêcher les doublons (ex: `@@unique([artistId, styleId])`).

`Session`, `Account`, `Verification` sont gérées par **better-auth** (génération et migration via `better-auth-cli`) plutôt que modélisées manuellement — elles apparaissent dans le schéma car Prisma est le driver de stockage utilisé par better-auth, mais leur structure suit la convention de la librairie.

## Cardinalités (notation MERISE)

| Association | Côté 1 | Côté 2 |
|---|---|---|
| User — TattooArtist | User : **(0,1)** — un utilisateur a au plus un profil artiste | TattooArtist : **(1,1)** — un profil artiste appartient à exactement un utilisateur |
| TattooArtist — Tattoo | TattooArtist : **(0,n)** | Tattoo : **(1,1)** |
| Style — Tattoo | Style : **(0,n)** | Tattoo : **(1,1)** |
| TattooArtist — Style (via ArtistStyle) | TattooArtist : **(0,n)** | Style : **(0,n)** |
| User — TattooArtist (via ArtistFollower, "suit") | User : **(0,n)** | TattooArtist : **(0,n)** |
| User — Tattoo (via FavoriteTattoo, "aime") | User : **(0,n)** | Tattoo : **(0,n)** |
| User — Booking (client) | User : **(0,n)** | Booking : **(1,1)** |
| TattooArtist — Booking | TattooArtist : **(0,n)** | Booking : **(1,1)** |
| TattooArtist — WeeklySlot | TattooArtist : **(0,n)** | WeeklySlot : **(1,1)** |
| TattooArtist — BlockedPeriod | TattooArtist : **(0,n)** | BlockedPeriod : **(1,1)** |
| User — Conversation (via ConversationParticipant) | User : **(0,n)** | Conversation : **(0,n)** |
| Conversation — Message | Conversation : **(0,n)** | Message : **(1,1)** |
| User — Message (émetteur) | User : **(0,n)** | Message : **(1,1)** |
| User — Notification | User : **(0,n)** | Notification : **(1,1)** |

## Règles de gestion notables

- Un `User` ne peut avoir qu'**un seul** profil `TattooArtist` (`userId @unique`), créé automatiquement par un hook better-auth quand un compte s'inscrit avec `role = artist`.
- Un `TattooArtist` doit être `verified = approved` pour apparaître dans les résultats de recherche publics (filtre appliqué côté requête, pas au niveau du schéma).
- Un `Booking` ne peut être modifié (`confirmed`/`cancelled`) que par l'artiste propriétaire, et uniquement tant que `status = pending` (cf. `app/api/bookings/[id]/status/route.ts`, audité au ticket #88).
- La suppression d'un `User` ou d'un `TattooArtist` entraîne la suppression en cascade de toutes ses données associées (`onDelete: Cascade` sur la quasi-totalité des relations).

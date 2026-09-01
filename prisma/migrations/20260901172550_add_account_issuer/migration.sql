-- Ajoute la colonne "issuer" requise par better-auth >=1.7 (désambiguïse
-- les comptes entre providers). Ajoutée nullable, backfillée pour les
-- lignes existantes selon la même convention que better-auth
-- (createLocalAccountIssuer / createOAuthAccountIssuer), puis rendue
-- obligatoire.

-- AlterTable
ALTER TABLE "account" ADD COLUMN "issuer" TEXT;

-- Backfill : comptes par identifiant/mot de passe
UPDATE "account"
SET "issuer" = 'local:' || "providerId"
WHERE "providerId" = 'credential';

-- Backfill : comptes OAuth (google, etc.)
UPDATE "account"
SET "issuer" = 'local:oauth:' || "providerId"
WHERE "providerId" != 'credential';

-- AlterTable
ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;

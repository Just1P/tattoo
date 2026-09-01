import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { E2E_ARTIST_CITY, E2E_ARTIST_EMAIL, E2E_ARTIST_NAME } from "./fixtures";

/**
 * Crée (ou met à jour) un artiste vérifié fixe et discoverable via /artists,
 * indépendamment du script de seed (prisma/seed.ts, ticket #93) qui n'existe
 * pas encore. Idempotent : relancer les tests ne duplique pas la donnée.
 *
 * Exécuté via `npx tsx` (pas importé directement) : le client Prisma généré
 * utilise `import.meta`, ce que le chargeur de modules de Playwright ne sait
 * pas résoudre pour globalSetup — on isole donc cette partie dans un
 * sous-processus tsx, qui la gère correctement.
 */
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.upsert({
    where: { email: E2E_ARTIST_EMAIL },
    update: {},
    create: {
      email: E2E_ARTIST_EMAIL,
      name: E2E_ARTIST_NAME,
      role: "artist",
      roleSelected: true,
      emailVerified: true,
    },
  });

  await prisma.tattooArtist.upsert({
    where: { userId: user.id },
    update: {
      artistName: E2E_ARTIST_NAME,
      city: E2E_ARTIST_CITY,
      verified: "approved",
    },
    create: {
      userId: user.id,
      artistName: E2E_ARTIST_NAME,
      city: E2E_ARTIST_CITY,
      verified: "approved",
    },
  });

  await prisma.$disconnect();
}

main();

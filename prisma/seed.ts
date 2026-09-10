import "dotenv/config";
import { extname, join } from "node:path";
import { readFileSync, readdirSync } from "node:fs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

const DEMO_PASSWORD = "Demo1234!";

/** Dossier local d'images réelles à uploader via UploadThing pour le portfolio des artistes de démo. */
const IMAGE_DIR = "C:/Users/justi/Desktop/Tout/Projet RNCP/tattoo-images";
const IMAGE_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const utapi = new UTApi();

const STYLES = [
  { slug: "fine-line", name: "Fine Line" },
  { slug: "old-school", name: "Old School" },
  { slug: "blackwork", name: "Blackwork" },
  { slug: "japonais", name: "Japonais" },
  { slug: "realisme", name: "Réalisme" },
  { slug: "geometrique", name: "Géométrique" },
];

const ARTISTS = [
  {
    email: "artiste1.demo@tattoo-pro.fr",
    name: "Léa Moreau",
    artistName: "Léa Moreau Tattoo",
    bio: "Spécialisée en fine line et motifs botaniques depuis 6 ans. Basée à Paris, je travaille sur rendez-vous uniquement.",
    city: "Paris",
    siret: "88012345600011",
    priceMin: 90,
    priceMax: 160,
    styleSlugs: ["fine-line", "geometrique"],
  },
  {
    email: "artiste2.demo@tattoo-pro.fr",
    name: "Karim Belhadj",
    artistName: "Karim Ink",
    bio: "Old school et blackwork, influencé par le flash traditionnel américain. 10 ans d'expérience, studio à Lyon.",
    city: "Lyon",
    siret: "79098765400023",
    priceMin: 100,
    priceMax: 200,
    styleSlugs: ["old-school", "blackwork"],
  },
  {
    email: "artiste3.demo@tattoo-pro.fr",
    name: "Yuki Tanaka",
    artistName: "Yuki Tanaka Irezumi",
    bio: "Formée au Japon, je propose des pièces japonaises traditionnelles et du réalisme en noir et gris. Studio à Marseille.",
    city: "Marseille",
    siret: "83045678900034",
    priceMin: 120,
    priceMax: 250,
    styleSlugs: ["japonais", "realisme"],
  },
  {
    email: "artiste4.demo@tattoo-pro.fr",
    name: "Emma Rousseau",
    artistName: "Emma Rousseau Art",
    bio: "Géométrique et blackwork épuré, motifs sur-mesure dessinés à la main. Studio à Bordeaux.",
    city: "Bordeaux",
    siret: "90123456700045",
    priceMin: 110,
    priceMax: 220,
    styleSlugs: ["geometrique", "blackwork"],
  },
  {
    email: "artiste5.demo@tattoo-pro.fr",
    name: "Thomas Lefebvre",
    artistName: "Thomas Lefebvre Tattoo",
    bio: "Réalisme noir et gris, portraits et animaux. 8 ans d'expérience, studio à Lille.",
    city: "Lille",
    siret: "85234567800056",
    priceMin: 130,
    priceMax: 280,
    styleSlugs: ["realisme", "blackwork"],
  },
  {
    email: "artiste6.demo@tattoo-pro.fr",
    name: "Sofia Martins",
    artistName: "Sofia Martins Ink",
    bio: "Fine line délicat et inspirations japonaises, pièces minimalistes. Studio à Toulouse.",
    city: "Toulouse",
    siret: "77345678900067",
    priceMin: 80,
    priceMax: 150,
    styleSlugs: ["fine-line", "japonais"],
  },
];

function listLocalImages(): string[] {
  return readdirSync(IMAGE_DIR)
    .filter((name) => extname(name).toLowerCase() in IMAGE_MIME_TYPES)
    .sort()
    .map((name) => join(IMAGE_DIR, name));
}

/** Répartit les images en `parts` groupes de taille égale (round-robin). */
function splitEvenly<T>(items: T[], parts: number): T[][] {
  const groups: T[][] = Array.from({ length: parts }, () => []);
  items.forEach((item, i) => groups[i % parts].push(item));
  return groups;
}

async function uploadImage(filePath: string): Promise<string | null> {
  const fileName = filePath.split(/[\\/]/).pop()!;
  const mimeType = IMAGE_MIME_TYPES[extname(fileName).toLowerCase()];
  const buffer = readFileSync(filePath);
  const file = new File([buffer], fileName, { type: mimeType });

  const result = await utapi.uploadFiles(file);
  if (result.error) {
    console.error(`    ✗ échec upload ${fileName} : ${result.error.message}`);
    return null;
  }
  return result.data.ufsUrl;
}

async function resetArtists() {
  const { count } = await prisma.user.deleteMany({ where: { role: "artist" } });
  console.log(
    `  ✓ ${count} compte(s) artiste supprimé(s) (cascade : profils, œuvres, réservations, créneaux)`,
  );
}

async function ensureUser(email: string, name: string, role: "artist" | "client") {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  // `role` a input: false côté serveur (voir lib/auth.ts) : le typage
  // officiel de l'API exclut ce champ par design, il est revalidé
  // indépendamment côté serveur (liste blanche client/artist).
  const { user } = await auth.api.signUpEmail({
    body: { email, password: DEMO_PASSWORD, name, role },
  } as Parameters<typeof auth.api.signUpEmail>[0]);
  return prisma.user.findUniqueOrThrow({ where: { id: user.id } });
}

async function seedArtists() {
  const imageBatches = splitEvenly(listLocalImages(), ARTISTS.length);

  for (const [index, data] of ARTISTS.entries()) {
    const user = await ensureUser(data.email, data.name, "artist");

    const artist = await prisma.tattooArtist.upsert({
      where: { userId: user.id },
      update: {
        artistName: data.artistName,
        bio: data.bio,
        city: data.city,
        siret: data.siret,
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        verified: "approved",
      },
      create: {
        userId: user.id,
        artistName: data.artistName,
        bio: data.bio,
        city: data.city,
        siret: data.siret,
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        verified: "approved",
      },
    });

    for (const styleSlug of data.styleSlugs) {
      const style = await prisma.style.findUniqueOrThrow({ where: { slug: styleSlug } });
      await prisma.artistStyle.upsert({
        where: { artistId_styleId: { artistId: artist.id, styleId: style.id } },
        update: {},
        create: { artistId: artist.id, styleId: style.id },
      });
    }

    const styles = await prisma.style.findMany({ where: { slug: { in: data.styleSlugs } } });

    let position = 0;
    for (const filePath of imageBatches[index]) {
      const imageUrl = await uploadImage(filePath);
      if (!imageUrl) continue;

      const style = styles[position % styles.length];
      await prisma.tattoo.create({
        data: {
          artistId: artist.id,
          styleId: style.id,
          title: `${data.artistName} — pièce ${position + 1}`,
          imageUrl,
          position,
          pinned: position === 0,
        },
      });
      position++;
    }

    console.log(`  ✓ ${data.artistName} (${data.email}) — ${position} œuvre(s) uploadée(s)`);
  }
}

async function seedBookings() {
  const client = await ensureUser("client.demo@tattoo-pro.fr", "Camille Dubois", "client");

  const artists = await prisma.tattooArtist.findMany({
    where: { user: { email: { in: ARTISTS.map((a) => a.email) } } },
    orderBy: { createdAt: "asc" },
  });

  const bookingSeeds = [
    {
      artist: artists[0],
      status: "pending" as const,
      tattooType: "premier_rdv",
      bodyPart: "Avant-bras",
      size: "moyen",
      description: "Un motif floral fine line sur l'avant-bras, inspiration botanique.",
    },
    {
      artist: artists[1],
      status: "confirmed" as const,
      tattooType: "remplissage",
      bodyPart: "Mollet",
      size: "grand",
      description: "Continuation d'une pièce old school déjà commencée, ajout de couleurs.",
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    },
  ];

  for (const seed of bookingSeeds) {
    if (!seed.artist) continue;

    const existing = await prisma.booking.findFirst({
      where: { artistId: seed.artist.id, userId: client.id, description: seed.description },
    });
    if (existing) continue;

    await prisma.booking.create({
      data: {
        artistId: seed.artist.id,
        userId: client.id,
        status: seed.status,
        tattooType: seed.tattooType,
        bodyPart: seed.bodyPart,
        size: seed.size,
        description: seed.description,
        startAt: "startAt" in seed ? seed.startAt : null,
        endAt: "endAt" in seed ? seed.endAt : null,
      },
    });
  }

  console.log(`  ✓ Réservations de démo pour ${client.email}`);
}

async function main() {
  console.log("Réinitialisation des artistes existants…");
  await resetArtists();

  console.log("Styles…");
  for (const style of STYLES) {
    await prisma.style.upsert({
      where: { slug: style.slug },
      update: { name: style.name },
      create: style,
    });
  }
  console.log(`  ✓ ${STYLES.length} styles`);

  console.log("Artistes (upload des images réelles vers UploadThing)…");
  await seedArtists();

  console.log("Réservations…");
  await seedBookings();

  console.log(`\nTerminé. Mot de passe de tous les comptes de démo : ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

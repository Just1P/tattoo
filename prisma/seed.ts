import "dotenv/config";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEMO_PASSWORD = "Demo1234!";

/** Rectangle coloré en data URI — aucune dépendance réseau, taille compatible imageUrl @db.VarChar(500). */
function placeholderImage(hue: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'><rect width='800' height='1000' fill='hsl(${hue},45%,55%)'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

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
    hue: 340,
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
    hue: 20,
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
    hue: 210,
  },
];

async function ensureUser(email: string, name: string, role: "artist" | "client") {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const { user } = await auth.api.signUpEmail({
    body: { email, password: DEMO_PASSWORD, name, role },
  });
  return prisma.user.findUniqueOrThrow({ where: { id: user.id } });
}

async function seedArtists() {
  for (const data of ARTISTS) {
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

    const primaryStyle = await prisma.style.findUniqueOrThrow({
      where: { slug: data.styleSlugs[0] },
    });

    const existingTattoos = await prisma.tattoo.count({ where: { artistId: artist.id } });
    if (existingTattoos === 0) {
      await prisma.tattoo.createMany({
        data: [0, 1, 2].map((i) => ({
          artistId: artist.id,
          styleId: primaryStyle.id,
          title: `${data.artistName} — pièce ${i + 1}`,
          imageUrl: placeholderImage(data.hue + i * 15),
          position: i,
          pinned: i === 0,
        })),
      });
    }

    console.log(`  ✓ ${data.artistName} (${data.email})`);
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
  console.log("Styles…");
  for (const style of STYLES) {
    await prisma.style.upsert({
      where: { slug: style.slug },
      update: { name: style.name },
      create: style,
    });
  }
  console.log(`  ✓ ${STYLES.length} styles`);

  console.log("Artistes…");
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

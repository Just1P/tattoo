import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const STYLES = [
  { name: "Traditionnel", slug: "traditionnel", description: "Old school américain, traits épais, couleurs vives" },
  { name: "Réaliste", slug: "realiste", description: "Portraits et scènes photoréalistes" },
  { name: "Japonais", slug: "japonais", description: "Koi, dragons, fleurs de cerisier, style Irezumi" },
  { name: "Minimaliste", slug: "minimaliste", description: "Traits fins, designs épurés et discrets" },
  { name: "Géométrique", slug: "geometrique", description: "Formes géométriques, mandalas, symétrie" },
];

async function main() {
  console.log("Seeding styles...");

  for (const style of STYLES) {
    await prisma.style.upsert({
      where: { slug: style.slug },
      update: { name: style.name, description: style.description },
      create: style,
    });
  }

  console.log(`✓ ${STYLES.length} styles insérés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

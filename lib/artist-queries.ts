import { prisma } from "@/lib/prisma";

const tattooOrderBy = [{ pinned: "desc" as const }, { position: "asc" as const }];
const tattooInclude = { style: { select: { name: true } } };
const styleInclude = { style: { select: { id: true, name: true } } };

export async function getPublicArtist(id: string) {
  return prisma.tattooArtist.findFirst({
    where: { id, verified: "approved" },
    include: {
      tattoos: { orderBy: tattooOrderBy, include: tattooInclude },
      artistStyles: { include: styleInclude },
    },
  });
}

export async function getArtistByUserId(userId: string) {
  return prisma.tattooArtist.findUnique({
    where: { userId },
    include: {
      tattoos: { orderBy: tattooOrderBy, include: tattooInclude },
      artistStyles: { include: styleInclude },
    },
  });
}

export async function getAllPublicArtistIds() {
  const artists = await prisma.tattooArtist.findMany({
    where: { verified: "approved" },
    select: { id: true },
  });
  return artists.map((a) => ({ id: a.id }));
}

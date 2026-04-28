import { prisma } from "@/lib/prisma";

const tattooOrderBy = [{ pinned: "desc" as const }, { position: "asc" as const }];
const tattooInclude = { style: { select: { name: true } } };
const styleInclude = { style: { select: { id: true, name: true } } };

export type ArtistFilters = {
  search?: string;
  city?: string;
  styleSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  excludeUserId?: string;
};

export async function getFilteredArtists(filters: ArtistFilters = {}) {
  const { search, city, styleSlug, minPrice, maxPrice, excludeUserId } = filters;
  return prisma.tattooArtist.findMany({
    where: {
      artistName: { not: null, ...(search ? { contains: search, mode: "insensitive" } : {}) },
      verified: "approved",
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(styleSlug ? { artistStyles: { some: { style: { slug: styleSlug } } } } : {}),
      ...(minPrice !== undefined ? { priceMin: { gte: minPrice } } : {}),
      ...(maxPrice !== undefined ? { priceMax: { lte: maxPrice } } : {}),
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
    include: {
      artistStyles: {
        include: { style: { select: { id: true, name: true } } },
      },
      _count: { select: { tattoos: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllStyles() {
  return prisma.style.findMany({ orderBy: { name: "asc" } });
}

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

export async function getArtistPageData(id: string, userId?: string) {
  const [artist, isFollowed, favoritedTattooIds] = await Promise.all([
    getPublicArtist(id),
    userId
      ? prisma.artistFollower
          .findUnique({ where: { artistId_userId: { artistId: id, userId } } })
          .then(Boolean)
      : Promise.resolve(false),
    userId
      ? prisma.favoriteTattoo
          .findMany({ where: { userId, tattoo: { artistId: id } }, select: { tattooId: true } })
          .then((rows) => rows.map((r) => r.tattooId))
      : Promise.resolve(undefined),
  ]);

  return { artist, isFollowed, favoritedTattooIds };
}

export async function getAllPublicArtistIds() {
  const artists = await prisma.tattooArtist.findMany({
    where: { verified: "approved" },
    select: { id: true },
  });
  return artists.map((a) => ({ id: a.id }));
}

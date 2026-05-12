import { prisma } from "@/lib/prisma";
import { cache } from "react";

const tattooOrderBy = [{ pinned: "desc" as const }, { position: "asc" as const }];
const tattooInclude = { style: { select: { name: true } } };
const styleInclude = { style: { select: { id: true, name: true } } };

const ARTISTS_PAGE_SIZE = 12;

export type ArtistFilters = {
  search?: string;
  city?: string;
  styleSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  excludeUserId?: string;
  page?: number;
};

export async function getFilteredArtists(filters: ArtistFilters = {}) {
  const { search, city, styleSlug, minPrice, maxPrice, excludeUserId } = filters;
  const page = Math.max(1, filters.page ?? 1);

  const where = {
    artistName: { not: null, ...(search ? { contains: search, mode: "insensitive" as const } : {}) },
    verified: "approved" as const,
    ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
    ...(styleSlug ? { artistStyles: { some: { style: { slug: styleSlug } } } } : {}),
    ...(minPrice !== undefined ? { priceMin: { gte: minPrice } } : {}),
    ...(maxPrice !== undefined ? { priceMax: { lte: maxPrice } } : {}),
    ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
  };

  const [artists, totalCount] = await Promise.all([
    prisma.tattooArtist.findMany({
      where,
      include: {
        artistStyles: { include: styleInclude },
        _count: { select: { tattoos: true } },
      },
      orderBy: { createdAt: "desc" },
      take: ARTISTS_PAGE_SIZE,
      skip: (page - 1) * ARTISTS_PAGE_SIZE,
    }),
    prisma.tattooArtist.count({ where }),
  ]);

  return {
    artists,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / ARTISTS_PAGE_SIZE)),
    currentPage: page,
  };
}

export async function getAllStyles() {
  return prisma.style.findMany({ orderBy: { name: "asc" } });
}

export const getPublicArtist = cache(async function getPublicArtist(id: string) {
  return prisma.tattooArtist.findFirst({
    where: { id, verified: "approved" },
    include: {
      tattoos: { orderBy: tattooOrderBy, include: tattooInclude },
      artistStyles: { include: styleInclude },
    },
  });
});

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

export async function getFollowedArtists(userId: string) {
  const followed = await prisma.artistFollower.findMany({
    where: { userId },
    include: {
      artist: {
        include: {
          artistStyles: { include: styleInclude },
          _count: { select: { tattoos: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return followed.map(({ artist }) => artist);
}

export async function getAllPublicArtistIds() {
  const artists = await prisma.tattooArtist.findMany({
    where: { verified: "approved" },
    select: { id: true },
  });
  return artists.map((a) => ({ id: a.id }));
}

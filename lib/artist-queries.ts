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

const artistPublicSelect = {
  id: true,
  artistName: true,
  bio: true,
  city: true,
  priceMin: true,
  priceMax: true,
  verified: true,
  artistStyles: { include: styleInclude },
  _count: { select: { tattoos: true } },
} as const;

export async function getFilteredArtists(filters: ArtistFilters = {}) {
  const { search, city, styleSlug, minPrice, maxPrice, excludeUserId } = filters;
  const page = Math.max(1, filters.page ?? 1);
  const isFirstPage = page === 1;

  const where = {
    artistName: { not: null, ...(search ? { contains: search, mode: "insensitive" as const } : {}) },
    verified: "approved" as const,
    ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
    ...(styleSlug ? { artistStyles: { some: { style: { slug: styleSlug } } } } : {}),
    ...(minPrice !== undefined ? { priceMin: { gte: minPrice } } : {}),
    ...(maxPrice !== undefined ? { priceMax: { lte: maxPrice } } : {}),
    ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
  };

  // take + 1 pour détecter s'il y a une page suivante sans COUNT
  const rows = await prisma.tattooArtist.findMany({
    where,
    select: artistPublicSelect,
    orderBy: { createdAt: "desc" },
    take: ARTISTS_PAGE_SIZE + 1,
    skip: (page - 1) * ARTISTS_PAGE_SIZE,
  });

  const hasNextPage = rows.length > ARTISTS_PAGE_SIZE;
  const artists = hasNextPage ? rows.slice(0, ARTISTS_PAGE_SIZE) : rows;

  // COUNT uniquement sur la première page pour afficher le total
  const totalCount = isFirstPage
    ? await prisma.tattooArtist.count({ where })
    : undefined;

  return {
    artists,
    totalCount,
    hasNextPage,
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

import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 24;

export async function getFavoritedTattooIds(
  userId: string,
  tattooIds: string[],
): Promise<Set<string>> {
  if (tattooIds.length === 0) return new Set();
  const rows = await prisma.favoriteTattoo.findMany({
    where: { userId, tattooId: { in: tattooIds } },
    select: { tattooId: true },
  });
  return new Set(rows.map((r) => r.tattooId));
}

export type TattooFeedFilters = {
  styleSlug?: string;
  page?: number;
};

export async function getPublicTattoos(filters: TattooFeedFilters = {}) {
  const { styleSlug } = filters;
  const page = Math.max(1, Math.floor(filters.page ?? 1) || 1);

  const where = {
    artist: { verified: "approved" as const },
    ...(styleSlug ? { style: { slug: styleSlug } } : {}),
  };

  const [tattoos, totalCount] = await Promise.all([
    prisma.tattoo.findMany({
      where,
      include: {
        style: { select: { name: true, slug: true } },
        artist: { select: { id: true, artistName: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.tattoo.count({ where }),
  ]);

  return {
    tattoos,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    currentPage: page,
  };
}

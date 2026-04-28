import { prisma } from "@/lib/prisma";

export async function getProfileData(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      artistProfile: {
        include: {
          tattoos: {
            orderBy: [{ pinned: "desc" }, { position: "asc" }],
            include: { style: { select: { name: true } } },
          },
        },
      },
      favoriteTattoos: {
        include: {
          tattoo: {
            include: { style: { select: { name: true } } },
          },
        },
      },
      followedArtists: { select: { id: true } },
    },
  });
}

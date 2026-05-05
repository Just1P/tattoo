import { getAllPublicArtistIds } from "@/lib/artist-queries";
import type { MetadataRoute } from "next";

export const revalidate = 86400;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const artistIds = await getAllPublicArtistIds();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/feed`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/artists`, changeFrequency: "daily", priority: 0.8 },
  ];

  const artistRoutes: MetadataRoute.Sitemap = artistIds.map(({ id }) => ({
    url: `${BASE_URL}/artists/${id}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...artistRoutes];
}

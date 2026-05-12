import { auth } from "@/lib/auth";
import { getFilteredArtists } from "@/lib/artist-queries";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { searchParams } = req.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const result = await getFilteredArtists({
    search: searchParams.get("search") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    styleSlug: searchParams.get("styleSlug") ?? undefined,
    minPrice: searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : undefined,
    maxPrice: searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : undefined,
    excludeUserId: session?.user.id,
    page,
  });

  return NextResponse.json(result);
}

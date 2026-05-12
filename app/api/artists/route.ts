import { auth } from "@/lib/auth";
import { getFilteredArtists } from "@/lib/artist-queries";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  minPrice: z.coerce.number().int().min(0).optional().catch(undefined),
  maxPrice: z.coerce.number().int().min(0).optional().catch(undefined),
  search: z.string().optional(),
  city: z.string().optional(),
  styleSlug: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const raw = Object.fromEntries(req.nextUrl.searchParams);
  const params = querySchema.parse(raw);

  const result = await getFilteredArtists({
    ...params,
    excludeUserId: session?.user.id,
  });

  return NextResponse.json(result);
}

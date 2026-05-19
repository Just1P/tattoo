import { NextRequest, NextResponse } from "next/server";

type RateLimitStore = Map<string, { count: number; resetAt: number }>;

const stores = new Map<string, RateLimitStore>();

function getStore(key: string): RateLimitStore {
  if (!stores.has(key)) stores.set(key, new Map());
  return stores.get(key)!;
}

export type RateLimitConfig = {
  /** Identifiant unique pour cette limite (ex: "bookings", "follow") */
  id: string;
  /** Nombre max de requêtes */
  limit: number;
  /** Fenêtre en secondes */
  windowSec: number;
};

export function rateLimit(req: NextRequest, config: RateLimitConfig): NextResponse | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const store = getStore(config.id);
  const now = Date.now();
  const key = ip;

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowSec * 1000 });
    return null;
  }

  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Trop de requêtes, réessayez dans quelques instants." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      },
    );
  }

  entry.count++;
  return null;
}

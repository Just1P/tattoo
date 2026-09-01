import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const { GET, POST: basePOST } = toNextJsHandler(auth);

export { GET };

// Toutes les actions d'authentification (connexion, inscription, mot de
// passe oublié...) passent par ce handler POST unique. On ne limite que la
// connexion par mot de passe : c'est la seule action où un attaquant peut
// deviner un secret par essais répétés (brute-force). Limiter aussi
// l'inscription pénaliserait des usages légitimes (démo, tests) sans gain
// de sécurité équivalent.
export async function POST(req: NextRequest) {
  if (req.nextUrl.pathname === "/api/auth/sign-in/email") {
    const limited = rateLimit(req, { id: "auth-sign-in", limit: 5, windowSec: 900 });
    if (limited) return limited;
  }
  return basePOST(req);
}

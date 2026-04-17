import { NextRequest, NextResponse } from "next/server";

// Routes accessibles sans être connecté
const PUBLIC_ROUTES = ["/", "/artists", "/login", "/register"];

// Préfixes de routes publiques (ex: /artists/[id])
const PUBLIC_PREFIXES = ["/artists/"];

// Routes réservées aux utilisateurs NON connectés
const AUTH_ROUTES = ["/login", "/register"];

// Nom du cookie de session Better Auth (préfixe par défaut = "better-auth")
const SESSION_COOKIE = "better-auth.session_token";

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionToken =
    req.cookies.get(SESSION_COOKIE)?.value ??
    req.cookies.get(`__Secure-${SESSION_COOKIE}`)?.value;

  const isAuthenticated = !!sessionToken;

  // Utilisateur connecté qui tente d'accéder à /login ou /register → accueil
  if (isAuthenticated && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Utilisateur non connecté sur une route protégée → /login
  if (!isAuthenticated && !isPublic(pathname)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Intercepte toutes les requêtes SAUF :
     * - _next/static  (assets compilés)
     * - _next/image   (optimisation d'images)
     * - favicon.ico
     * - fichiers publics avec extension (png, jpg, svg…)
     * - routes API d'auth Better Auth
     * - routes uploadthing
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};

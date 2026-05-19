import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/artists", "/feed", "/login", "/register"];

const PUBLIC_PREFIXES = ["/artists/", "/feed"];

const AUTH_ROUTES = ["/login", "/register"];

const SESSION_COOKIE = "better-auth.session_token";

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)))
    return true;
  return false;
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://utfs.io https://*.ufs.sh https://lh3.googleusercontent.com",
      "font-src 'self'",
      "connect-src 'self'",
      "media-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );
  return res;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionToken =
    req.cookies.get(SESSION_COOKIE)?.value ??
    req.cookies.get(`__Secure-${SESSION_COOKIE}`)?.value;

  const isAuthenticated = !!sessionToken;

  if (isAuthenticated && AUTH_ROUTES.includes(pathname)) {
    return applySecurityHeaders(NextResponse.redirect(new URL("/", req.url)));
  }

  if (!isAuthenticated && !isPublic(pathname)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};

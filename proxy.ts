import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/artists", "/login", "/register"];

const PUBLIC_PREFIXES = ["/artists/"];

const AUTH_ROUTES = ["/login", "/register"];

const SESSION_COOKIE = "better-auth.session_token";

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)))
    return true;
  return false;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionToken =
    req.cookies.get(SESSION_COOKIE)?.value ??
    req.cookies.get(`__Secure-${SESSION_COOKIE}`)?.value;

  const isAuthenticated = !!sessionToken;

  if (isAuthenticated && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!isAuthenticated && !isPublic(pathname)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};

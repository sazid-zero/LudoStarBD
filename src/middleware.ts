import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("ludoearn_token")?.value;

  // Protected paths that strictly require login
  const protectedPrefixes = [
    "/dashboard",
    "/matches",
    "/game",
    "/wallet",
    "/profile",
    "/play",
    "/admin",
  ];

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/matches/:path*",
    "/game/:path*",
    "/wallet/:path*",
    "/profile/:path*",
    "/play/:path*",
    "/admin/:path*",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPrefixes = ["/dashboard", "/pipelines", "/api/internal", "/api/pipelines", "/api/finops"];
const authPrefixes = ["/auth/sign-in", "/auth/sign-up"];

function startsWithPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = Boolean(token?.sub);
  const { pathname } = request.nextUrl;

  if (!isAuthenticated && startsWithPrefix(pathname, protectedPrefixes)) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthenticated && startsWithPrefix(pathname, authPrefixes)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pipelines/:path*",
    "/api/internal/:path*",
    "/api/pipelines/:path*",
    "/api/finops/:path*",
    "/auth/sign-in",
    "/auth/sign-up",
  ],
};

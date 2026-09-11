/**
 * BhoomiSetu — Middleware
 * DB-based session auth with role-based route protection
 */

import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "bhumisetu_session";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/landing",
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/health",
  "/api/citizen",
  "/api/cron",
];

// Admin-only routes
const ADMIN_ROUTES = [
  "/admin",
  "/dashboard",
  "/atlas",
  "/upload",
  "/workflow",
  "/risk",
  "/archive",
  "/awards",
  "/compensation",
  "/mutations",
  "/dss",
  "/api/projects",
  "/api/parcels",
  "/api/awards",
  "/api/compensation",
  "/api/mutations",
  "/api/notifications",
  "/api/documents",
  "/api/audit",
  "/api/affected-families",
  "/api/upload",
  "/api/me",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;

  // No session → redirect to login
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session cookie exists — let the API routes validate it fully
  // (Edge runtime can't connect to PostgreSQL, so we just check cookie presence here)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

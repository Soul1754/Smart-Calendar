import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/calendar", "/meetings", "/profile"];

// Routes that should redirect to calendar if already authenticated
const authRoutes = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies or check if it exists in the request
  // Note: Since we're using localStorage, we can't check token server-side
  // This middleware serves as a basic check, but the real auth check happens client-side

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Check if it's an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // For protected routes, allow the request to proceed
  // The client-side auth check in the layout will handle the redirect
  if (isProtectedRoute) {
    return NextResponse.next();
  }

  // For auth routes, allow the request
  // The client-side check in the pages will redirect if already authenticated
  if (isAuthRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};

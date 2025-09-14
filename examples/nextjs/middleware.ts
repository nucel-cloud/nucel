import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Add security headers
  const headers = new Headers(request.headers);
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Log request for monitoring (in production, use proper observability tools)
  const { pathname, search } = request.nextUrl;
  console.log(`[${new Date().toISOString()}] ${request.method} ${pathname}${search}`);
  
  // Example: Redirect old URLs
  if (pathname === "/old-products") {
    return NextResponse.redirect(new URL("/products", request.url));
  }
  
  // Example: Add custom header for API routes
  if (pathname.startsWith("/api/")) {
    headers.set("X-API-Version", "1.0");
  }
  
  return NextResponse.next({
    request: {
      headers,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
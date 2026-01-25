import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // ✅ Block login page if already logged in
  if (token && pathname.startsWith("/auth/login")) {
    return NextResponse.redirect(
      new URL("/admin/dashboard", req.url)
    );
  }
  
  

  // ✅ Protect admin routes
  if (!token && pathname.startsWith("/admin")) {
    return NextResponse.redirect(
      new URL("/auth/login", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/auth/login",
    "/admin/:path*"
  ],
};

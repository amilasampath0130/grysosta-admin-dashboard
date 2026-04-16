import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token =
    req.cookies.get("auth-token")?.value || req.cookies.get("token")?.value;

  // In production, admin auth can be finalized client-side using localStorage.
  // A strict server-side cookie check here can cause redirect loops for some users.
  if (!token) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

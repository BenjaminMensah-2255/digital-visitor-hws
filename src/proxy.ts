import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (!request.cookies.has("dvl_session")) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/companies/:path*", "/staff/:path*", "/visitors/:path*", "/requests/:path*", "/reports/:path*", "/attendance/:path*", "/profile/:path*"],
};

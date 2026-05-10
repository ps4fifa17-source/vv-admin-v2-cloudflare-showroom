import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PASSWORD = process.env.ADMIN_PASSWORD;

export function middleware(request: NextRequest) {
  const auth = request.cookies.get("admin_auth")?.value;
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) return NextResponse.next();
  if (pathname === "/login") return NextResponse.next();

  if (PASSWORD && auth === PASSWORD) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
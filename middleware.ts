import { NextResponse, type NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "bbb_admin_session";

function hasValidAdminSession(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (sessionCookie) {
    try {
      const decoded = JSON.parse(
        Buffer.from(sessionCookie, "base64").toString("utf-8")
      ) as { email?: string };
      if (decoded && typeof decoded.email === "string" && decoded.email.length > 3) {
        return true;
      }
    } catch {
      return false;
    }
  }

  // Também aceita cookie de sessão padrão do Supabase Auth caso presente
  const allCookies = request.cookies.getAll();
  const hasSbAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token") && Boolean(c.value)
  );
  return hasSbAuthCookie;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isLoginRoute = pathname === "/admin/login" || pathname.startsWith("/admin/login/");
  const isAuthenticated = hasValidAdminSession(request);

  if (isLoginRoute) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};


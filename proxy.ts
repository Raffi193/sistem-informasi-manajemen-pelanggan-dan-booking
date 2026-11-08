import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminClaims } from "./lib/auth";
import { supabaseAnonKey, supabaseUrl } from "./lib/supabase/config";

/**
 * Proxy (pengganti `middleware` di Next.js 16).
 * Menyegarkan sesi Supabase dan menjaga area /admin.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getClaims memverifikasi JWT tanpa selalu melakukan round-trip ke Auth.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const signedIn = Boolean(claims);
  const isAdmin = isAdminClaims(claims);

  const { pathname } = request.nextUrl;

  // Belum masuk tetapi membuka area admin -> arahkan ke login.
  if (!signedIn && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Sudah masuk tetapi bukan admin -> jangan beri akses ke panel admin.
  if (signedIn && !isAdmin && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.delete("next");
    url.searchParams.set("error", "not-admin");
    return NextResponse.redirect(url);
  }

  // Admin yang sudah masuk dan membuka /login -> langsung ke dashboard.
  if (signedIn && isAdmin && pathname === "/login") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};

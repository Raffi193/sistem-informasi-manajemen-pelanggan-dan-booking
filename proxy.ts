import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminClaims } from "./lib/auth";
import { supabaseAnonKey, supabaseUrl } from "./lib/supabase/config";
import { getAuthCookieOptions } from "./lib/supabase/cookie-options";

/**
 * Proxy (pengganti `middleware` di Next.js 16).
 * Menyegarkan sesi Supabase dan menjaga area /admin.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: getAuthCookieOptions(),
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
  let isAdmin = isAdminClaims(claims);

  // JWT lama bisa belum memuat app_metadata.role yang baru di-set.
  // Verifikasi ulang ke Auth agar admin tidak terjebak logout-loop.
  if (signedIn && !isAdmin) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAdmin = isAdminClaims({
      email: user?.email,
      app_metadata: user?.app_metadata,
    });
  }

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

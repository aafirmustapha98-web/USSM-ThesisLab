import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionToken, safeEqual } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const password = process.env.APP_PASSWORD;

  /* Aucun mot de passe défini : usage local. Une bannière le rappelle dans l'interface. */
  if (!password) return NextResponse.next();

  const cookie = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  const expected = await sessionToken(password);
  if (cookie && safeEqual(cookie, expected)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  const target = request.nextUrl.pathname + request.nextUrl.search;
  if (target !== "/") url.searchParams.set("next", target);
  return NextResponse.redirect(url);
}

export const config = {
  /* Tout est protégé sauf la page de connexion et les fichiers statiques. */
  matcher: [
    "/((?!login|_next/static|_next/image|.*\\.png$|.*\\.ico$|.*\\.svg$|.*\\.webmanifest$).*)",
  ],
};

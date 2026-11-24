import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { signInRedirectPath } from "@/lib/session-gate";

/**
 * Sends signed-out requests for protected pages to /login, carrying the
 * requested page as callbackURL. This checks that a session cookie is present;
 * it does not validate the session. Validation belongs with the session gate
 * work in the route handlers.
 */
export function proxy(request: NextRequest) {
  const redirect = signInRedirectPath(
    request.nextUrl.pathname,
    request.nextUrl.search,
    getSessionCookie(request.headers) !== null,
  );

  if (redirect === null) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL(redirect, request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

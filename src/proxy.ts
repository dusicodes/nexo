import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { isProtectedPath, signInRedirectPath } from "@/lib/session-gate";

/**
 * Sends signed-out requests for protected pages to /login, carrying the
 * requested page as callbackURL. The session is validated against the
 * database through the auth instance, so a forged or expired cookie does not
 * pass. Proxy runs on the Node.js runtime, which the database client needs.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Open paths skip the database lookup entirely.
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: request.headers });
  const redirect = signInRedirectPath(pathname, search, session !== null);

  if (redirect === null) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL(redirect, request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

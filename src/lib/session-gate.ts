/**
 * Session gate decisions, kept free of Next.js and Better Auth so they can be
 * tested directly. src/proxy.ts applies them to each request.
 *
 * Every page is protected by default. Only the first path segment in
 * OPEN_SEGMENTS is exempt: the login page, the Better Auth handler, and
 * Next.js internals and static files.
 */

const OPEN_SEGMENTS = new Set(["login", "api", "_next", "favicon.ico"]);

export function isProtectedPath(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? "";
  const firstSegment = path.split("/")[1] ?? "";
  return !OPEN_SEGMENTS.has(firstSegment);
}

/**
 * Returns the login URL to redirect to, with the requested page (path and
 * query) as callbackURL, or null when the request may continue.
 */
export function signInRedirectPath(
  pathname: string,
  search: string,
  hasSession: boolean,
): string | null {
  if (hasSession || !isProtectedPath(pathname)) {
    return null;
  }
  return `/login?callbackURL=${encodeURIComponent(pathname + search)}`;
}

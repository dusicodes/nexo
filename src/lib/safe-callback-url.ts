/**
 * Returns the post-sign-in return path, or "/" when the requested value is
 * not a same-origin relative path. Only a single leading "/" is accepted:
 * "//host" and "/\host" would make browsers navigate off-origin, so they fall
 * back to "/" as well. Whitespace and control characters are rejected too,
 * because browsers strip tabs and newlines from URLs, so "/\t/host" would
 * otherwise become "//host".
 */
export function safeCallbackURL(raw: string | string[] | undefined): string {
  if (typeof raw !== "string" || raw.length === 0) {
    return "/";
  }
  if (/[\s\x00-\x1f\x7f]/.test(raw)) {
    return "/";
  }
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/";
  }
  return raw;
}

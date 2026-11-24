/**
 * Email allowlist for Google sign-in. ALLOWED_EMAIL is a comma-separated list.
 * Matching ignores letter case and surrounding whitespace. An empty list
 * (no addresses after trimming) allows no one.
 */

function parseAllowlist(raw: string): Set<string> {
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0),
  );
}

export function isEmailAllowed(
  email: string | undefined,
  allowlistRaw: string,
): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return parseAllowlist(allowlistRaw).has(normalized);
}

/**
 * Email allowlist for Google sign-in. ALLOWED_EMAIL is a comma-separated list,
 * parsed once at startup. Matching ignores letter case and surrounding
 * whitespace. An empty list allows no one.
 */

import { NOT_AUTHORIZED_CODE } from "./auth-errors";

/** Normalized (trimmed, lower-case) addresses that may sign in. */
export type Allowlist = ReadonlySet<string>;

export function parseAllowlist(raw: string): Allowlist {
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0),
  );
}

export function isEmailAllowed(
  email: string | undefined,
  allowlist: Allowlist,
): boolean {
  const normalized = email?.trim().toLowerCase();
  return normalized ? allowlist.has(normalized) : false;
}

/**
 * Better Auth `user.validateUserInfo` hook: rejects any account whose email is
 * not on the allowlist, before a user, account or session row is written.
 */
export function rejectUnlistedEmails(allowlist: Allowlist) {
  return ({ user }: { user: { email?: string } }) =>
    isEmailAllowed(user.email, allowlist)
      ? undefined
      : {
          error: NOT_AUTHORIZED_CODE,
          errorDescription: "This Google account is not authorized to sign in.",
        };
}

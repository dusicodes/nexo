import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../db/client";
import { account, session, user, verification } from "../db/schema/auth";
import { isEmailAllowed } from "./auth-allowlist";
import { readAuthConfig } from "./auth-config";

/**
 * Better Auth foundation instance. Server-side only.
 *
 * - Required settings (BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID,
 *   GOOGLE_CLIENT_SECRET, ALLOWED_EMAIL) are checked by readAuthConfig. The
 *   instance throws at load time when any is missing or empty.
 * - The Drizzle adapter persists auth data through src/db/client.ts, so the
 *   same tables work on Postgres and local PGlite.
 * - Google is the only sign-in provider.
 * - Only emails listed in ALLOWED_EMAIL may sign in. The check runs in
 *   user.validateUserInfo, which Better Auth calls before it writes any user,
 *   account or session row.
 *
 * The Next.js API route that mounts this instance (app/api/auth/[...all]/route.ts)
 * serves the HTTP handler; this file is the configuration seam.
 */

const config = readAuthConfig();

// The Better Auth CLI generates the individual table exports in
// src/db/schema/auth.ts; the adapter expects them as one object.
const authSchema = { user, session, account, verification };

export const auth = betterAuth({
  secret: config.secret,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: authSchema,
  }),
  user: {
    validateUserInfo: ({ user }) =>
      isEmailAllowed(user.email, config.allowedEmail)
        ? undefined
        : {
            error: "not_authorized",
            errorDescription: "This Google account is not authorized to sign in.",
          },
  },
  socialProviders: {
    google: {
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
    },
  },
});

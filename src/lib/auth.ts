import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../db/client";
import {
  account,
  session,
  user,
  verification,
} from "../db/schema/auth";

/**
 * Better Auth foundation instance. Server-side only.
 *
 * - Secret comes from BETTER_AUTH_SECRET (never committed; see .env.example).
 * - The Drizzle adapter persists auth data through src/db/client.ts, so the
 *   same tables work on Postgres and local PGlite.
 * - Google OAuth is registered when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
 *   are configured. No provider is registered otherwise, and the instance
 *   stays usable for local development.
 *
 * The Next.js API route that mounts this instance (app/api/auth/[...all])
 * is added in the auth slice; this file is the configuration seam.
 */

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

// The Better Auth CLI generates the individual table exports in
// src/db/schema/auth.ts; the adapter expects them as one object.
const authSchema = { user, session, account, verification };

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "",
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: authSchema,
  }),
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID ?? "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        },
      }
    : {},
});

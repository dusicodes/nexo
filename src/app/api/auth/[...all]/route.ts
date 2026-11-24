import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/**
 * Mounts Better Auth's HTTP handler under /api/auth/*, including the Google
 * callback at /api/auth/callback/google. Server-side only.
 */
export const { GET, POST } = toNextJsHandler(auth);

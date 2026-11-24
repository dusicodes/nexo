"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Better Auth browser client. Calls the handler mounted at /api/auth on the
 * same origin, so no baseURL is needed.
 */
export const authClient = createAuthClient();

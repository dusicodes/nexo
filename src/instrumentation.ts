import { readAuthConfig } from "@/lib/auth-config";

/**
 * Runs once when the Next.js server starts. Fails startup, with a message
 * naming the missing setting, when a required auth setting is absent.
 */
export function register() {
  readAuthConfig();
}

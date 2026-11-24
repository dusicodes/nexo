import { beforeAll, describe, expect, it } from "vitest";
import { useAuthTestDatabase } from "@/test/auth-test-database";

/**
 * The Better Auth HTTP handler is mounted at /api/auth/* so the Google
 * callback is served at the local address. These tests call the real route
 * module against an in-memory PGlite database.
 */

const BASE = "http://localhost:3000";

type Route = typeof import("@/app/api/auth/[...all]/route");

describe("auth route handler", () => {
  let route: Route;

  useAuthTestDatabase({ baseURL: BASE });

  beforeAll(async () => {
    route = await import("@/app/api/auth/[...all]/route");
  });


  it("answers Better Auth's session endpoint with a JSON body", async () => {
    const response = await route.GET(
      new Request(`${BASE}/api/auth/get-session`),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    // No cookie was sent, so the session is null (signed out).
    expect(await response.json()).toBeNull();
  });

  it("routes the Google callback path to Better Auth, which redirects a bogus callback", async () => {
    const response = await route.GET(
      new Request(`${BASE}/api/auth/callback/google?error=access_denied`),
    );

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get("location")).toBeTruthy();
  });
});

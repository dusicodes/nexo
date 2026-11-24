import { describe, expect, it } from "vitest";
import {
  isProtectedPath,
  signInRedirectPath,
} from "@/lib/session-gate";

describe("isProtectedPath", () => {
  it.each(["/", "/projects", "/projects/42"])(
    "protects the app page %s",
    (pathname) => {
      expect(isProtectedPath(pathname)).toBe(true);
    },
  );

  it.each(["/login", "/login/", "/api/auth/callback/google", "/api/auth/get-session", "/favicon.ico", "/_next/static/chunk.js"])(
    "leaves %s open",
    (pathname) => {
      expect(isProtectedPath(pathname)).toBe(false);
    },
  );
});

describe("signInRedirectPath", () => {
  it("sends a signed-out request for a protected page to login with the page as callbackURL", () => {
    expect(signInRedirectPath("/projects/42", "?tab=2", false)).toBe(
      "/login?callbackURL=%2Fprojects%2F42%3Ftab%3D2",
    );
  });

  it("sends the home page to login with / as callbackURL", () => {
    expect(signInRedirectPath("/", "", false)).toBe("/login?callbackURL=%2F");
  });

  it("lets a signed-in request through", () => {
    expect(signInRedirectPath("/projects/42", "", true)).toBeNull();
  });

  it("lets an unprotected path through even when signed out", () => {
    expect(signInRedirectPath("/login", "?callbackURL=%2F", false)).toBeNull();
    expect(signInRedirectPath("/api/auth/get-session", "", false)).toBeNull();
  });
});

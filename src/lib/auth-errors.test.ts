import { describe, expect, it } from "vitest";
import { signInErrorMessage } from "@/lib/auth-errors";

describe("signInErrorMessage", () => {
  it("explains that the account is not on the allowlist", () => {
    expect(signInErrorMessage("not_authorized").title).toBe(
      "This Google account can't use nexo",
    );
  });

  it("says the sign-in was cancelled when Google reports access_denied", () => {
    expect(signInErrorMessage("access_denied").title).toBe("Sign-in was cancelled");
  });

  it.each([undefined, "", "state_mismatch", "validation_failed", "something_new"])(
    "falls back to a generic message for %s",
    (code) => {
      expect(signInErrorMessage(code).title).toBe("Sign-in didn't complete");
    },
  );

  it("gives every message a body that says what to do next", () => {
    for (const code of ["not_authorized", "access_denied", undefined]) {
      expect(signInErrorMessage(code).body.length).toBeGreaterThan(0);
    }
  });
});

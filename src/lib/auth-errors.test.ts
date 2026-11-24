import { describe, expect, it } from "vitest";
import { signInErrorMessage } from "@/lib/auth-errors";

describe("signInErrorMessage", () => {
  it("shows no message when there is no error parameter", () => {
    expect(signInErrorMessage(undefined)).toBeNull();
  });

  it("explains that the account is not authorized and offers another account", () => {
    expect(signInErrorMessage("not_authorized")).toEqual({
      text: "This Google account isn't authorized for nexo",
      offerAnotherAccount: true,
    });
  });

  it.each(["access_denied", "state_mismatch", "something_new", ""])(
    "shows the retry message for %j",
    (code) => {
      expect(signInErrorMessage(code)).toEqual({
        text: "Sign-in didn't complete. Try again.",
        offerAnotherAccount: false,
      });
    },
  );
});

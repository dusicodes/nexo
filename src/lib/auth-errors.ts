/**
 * Where Better Auth sends a failed sign-in: the login page, with the error
 * code in the `error` query parameter. Used as both onAPIError.errorURL in
 * src/lib/auth.ts and errorCallbackURL in the Google sign-in button.
 */
export const SIGN_IN_ERROR_PATH = "/login";

/** The error code src/lib/auth.ts returns for an account off the allowlist. */
export const NOT_AUTHORIZED_CODE = "not_authorized";

export type SignInErrorMessage = {
  text: string;
  /** Show a link that lets the owner pick a different Google account. */
  offerAnotherAccount: boolean;
};

/**
 * Maps the login page's `error` query parameter to the message shown there.
 * A missing parameter shows nothing; any value other than the not-authorized
 * code, including unknown ones, shows the retry message.
 */
export function signInErrorMessage(
  code: string | undefined,
): SignInErrorMessage | null {
  if (code === undefined) {
    return null;
  }
  if (code === NOT_AUTHORIZED_CODE) {
    return {
      text: "This Google account isn't authorized for nexo",
      offerAnotherAccount: true,
    };
  }
  return { text: "Sign-in didn't complete. Try again.", offerAnotherAccount: false };
}

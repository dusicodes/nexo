/**
 * Where Better Auth sends a failed sign-in: the error code arrives as the
 * `error` query parameter. Used as both onAPIError.errorURL in src/lib/auth.ts
 * and errorCallbackURL in the Google sign-in button.
 */
export const SIGN_IN_ERROR_PATH = "/auth/error";

export type SignInErrorMessage = { title: string; body: string };

const NOT_AUTHORIZED: SignInErrorMessage = {
  title: "This Google account can't use nexo",
  body: "Sign in with the Google account that was set up for this app.",
};

const CANCELLED: SignInErrorMessage = {
  title: "Sign-in was cancelled",
  body: "Nothing was changed. Try again when you're ready.",
};

const GENERIC: SignInErrorMessage = {
  title: "Sign-in didn't complete",
  body: "Something went wrong while signing in. Try again.",
};

/** Maps a Better Auth error code to a message the owner can act on. */
export function signInErrorMessage(code: string | undefined): SignInErrorMessage {
  switch (code) {
    case "not_authorized":
      return NOT_AUTHORIZED;
    case "access_denied":
      return CANCELLED;
    default:
      return GENERIC;
  }
}

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

/**
 * Shows who is signed in, with a sign-out button. Reads the session on the
 * server, so it must render inside a Suspense boundary.
 */
export async function SessionPanel() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
      <span>
        Signed in as <span className="text-foreground">{session.user.email}</span>
      </span>
      <SignOutButton />
    </div>
  );
}

import { runWithEndpointContext } from "@better-auth/core/context";
import { makeSignature } from "better-auth/crypto";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { readAuthConfig } from "@/lib/auth-config";
import { safeCallbackURL } from "@/lib/safe-callback-url";

/**
 * Development only: signs in as the first allowlisted email without Google,
 * so agents and scripts can exercise signed-in pages.
 *
 *   curl -c jar -L "http://localhost:3000/api/dev/session?callbackURL=/"
 *
 * Creates the user on first use, then a real database session, and sets the
 * signed session cookie. Responds 404 outside `next dev`.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const [email] = readAuthConfig().allowlist;
  if (!email) {
    return new NextResponse(null, { status: 404 });
  }

  const ctx = await auth.$context;
  const existing = await ctx.internalAdapter.findUserByEmail(email);
  const user =
    existing?.user ??
    (await runWithEndpointContext(
      { context: ctx } as unknown as Parameters<typeof runWithEndpointContext>[0],
      () =>
        ctx.internalAdapter.createUser(
          { email, name: "Dev owner", emailVerified: true },
          { method: "oauth", oauth: { providerId: "google" } },
        ),
    ));

  const session = await ctx.internalAdapter.createSession(user.id);
  const signed = `${session.token}.${await makeSignature(session.token, ctx.secret)}`;

  const target = safeCallbackURL(
    request.nextUrl.searchParams.get("callbackURL") ?? undefined,
  );
  const response = NextResponse.redirect(new URL(target, request.url));
  const cookie = ctx.authCookies.sessionToken;
  response.cookies.set(cookie.name, signed, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: cookie.attributes.maxAge,
  });
  return response;
}

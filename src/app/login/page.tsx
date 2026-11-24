import type { Metadata } from "next";
import { safeCallbackURL } from "@/lib/safe-callback-url";
import { GoogleSignIn } from "./_components/google-sign-in";

export const metadata: Metadata = {
  title: "Sign in - nexo",
  description: "Sign in to nexo with Google.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const { callbackURL } = await props.searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to nexo
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            A calm, local-first workspace. Sign in to continue.
          </p>
        </div>
        <GoogleSignIn callbackURL={safeCallbackURL(callbackURL)} />
      </div>
    </main>
  );
}

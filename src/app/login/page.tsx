import type { Metadata } from "next";
import { Suspense } from "react";
import { safeCallbackURL } from "@/lib/safe-callback-url";
import { GoogleSignIn } from "./_components/google-sign-in";

export const metadata: Metadata = {
  title: "Sign in - nexo",
  description: "Sign in to nexo with Google.",
};

export default function LoginPage(props: PageProps<"/login">) {
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
        {/* searchParams is read inside the boundary so the page can prerender
            its shell under Cache Components. */}
        <Suspense fallback={<GoogleSignIn callbackURL="/" disabled />}>
          <SignInForm searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function SignInForm({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string | string[] }>;
}) {
  const { callbackURL } = await searchParams;
  return <GoogleSignIn callbackURL={safeCallbackURL(callbackURL)} />;
}

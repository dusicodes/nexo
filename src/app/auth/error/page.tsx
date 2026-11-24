import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { signInErrorMessage } from "@/lib/auth-errors";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Sign-in error - nexo",
  description: "A sign-in to nexo did not complete.",
};

export default function SignInErrorPage(props: PageProps<"/auth/error">) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        {/* searchParams is read inside the boundary so the page can prerender
            its shell under Cache Components. */}
        <Suspense fallback={<ErrorBody code={undefined} />}>
          <ErrorFromParams searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function ErrorFromParams({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  return <ErrorBody code={typeof error === "string" ? error : undefined} />;
}

function ErrorBody({ code }: { code: string | undefined }) {
  const message = signInErrorMessage(code);
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{message.title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{message.body}</p>
      </div>
      <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
        Back to sign in
      </Link>
    </div>
  );
}

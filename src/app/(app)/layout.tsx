import { SignOutButton } from "./sign-out-button";

/**
 * Layout for every protected page. Pages outside this route group (login, the
 * auth API) are public; src/proxy.ts is what enforces the sign-in.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* pr-16 leaves room for the theme toggle fixed in the root layout. */}
      <header className="flex justify-end py-3 pl-6 pr-16">
        <SignOutButton />
      </header>
      {children}
    </>
  );
}

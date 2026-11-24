import { SignOutButton } from "./sign-out-button";

/**
 * Layout for every protected page. Pages outside this route group (login, the
 * auth API) are public; src/proxy.ts is what enforces the sign-in.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="flex justify-end px-6 py-3">
        <SignOutButton />
      </header>
      {children}
    </>
  );
}

import { SignOutButton } from "./sign-out-button";

/**
 * Layout for every protected page. Pages outside this route group (login, the
 * auth API) are public; src/proxy.ts is what enforces the sign-in.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Almost no chrome: the nexo mark and a quiet Sign out. pr-16 leaves room
          for the theme toggle fixed in the root layout. */}
      <header className="flex items-center justify-between py-3 pr-16 pl-6 sm:pl-10">
        <span className="flex items-center gap-2.5 text-[15px] font-medium tracking-[-0.01em]">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" className="fill-current">
            <circle cx="7" cy="7" r="5.5" />
            <circle cx="11.5" cy="11" r="1.4" />
          </svg>
          nexo
        </span>
        <SignOutButton />
      </header>
      {children}
    </>
  );
}

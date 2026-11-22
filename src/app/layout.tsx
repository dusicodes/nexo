import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { WelcomeAnimation } from "@/components/welcome-animation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nexo",
  description: "nexo - a calm, local-first, AI-powered workspace.",
};

// Reading the theme cookie at the root layout prevents static prerendering of
// this segment. We intentionally accept a blocking route so the server can
// render the correct theme class and avoid a flash on first load.
export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("nexo-theme")?.value;
  const isDark = theme !== "light";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${isDark ? "dark" : ""}`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider defaultTheme={isDark ? "dark" : "light"}>
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          <WelcomeAnimation />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

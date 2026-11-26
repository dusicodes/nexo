import type { Metadata } from "next";
import { Inter_Tight, Lilex, Newsreader } from "next/font/google";
import { ThemeToggle } from "@/components/theme-toggle";
import { WelcomeAnimation } from "@/components/welcome-animation";
import { BEFORE_PAINT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const lilex = Lilex({
  variable: "--font-lilex",
  subsets: ["latin"],
  weight: "variable",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});

// Two voices (CODING_STANDARDS.md, "Design language"): the user's own words
// are set in Inter Tight, nexo's own words in italic Newsreader.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: "variable",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  title: "nexo",
  description: "nexo - a calm, local-first, AI-powered workspace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Dark by default; BEFORE_PAINT_SCRIPT may switch the class before paint,
    // so the server and client class lists can differ.
    <html
      lang="en"
      className={`${interTight.variable} ${newsreader.variable} ${lilex.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BEFORE_PAINT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <div className="fixed top-3 right-4 z-50">
          <ThemeToggle />
        </div>
        <WelcomeAnimation />
        {children}
      </body>
    </html>
  );
}

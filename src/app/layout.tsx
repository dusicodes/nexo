import type { Metadata } from "next";
import { Lilex } from "next/font/google";
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
      className={`${lilex.variable} dark h-full antialiased`}
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

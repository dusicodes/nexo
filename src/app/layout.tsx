import type { Metadata } from "next";
import { Lilex } from "next/font/google";
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
    <html lang="en" className={`${lilex.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

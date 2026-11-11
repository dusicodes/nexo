import type { NextConfig } from "next";

// Tauri sets TAURI_ENV_* variables for its beforeBuildCommand. When present we
// are building for the desktop shell, which bundles static assets from `out/`.
// Plain web builds keep the serverful Next.js app (API routes, server
// components) intact.
const isTauriBuild = Boolean(process.env.TAURI_ENV_TARGET_TRIPLE);

const nextConfig: NextConfig = {
  output: isTauriBuild ? "export" : undefined,
  images: isTauriBuild ? { unoptimized: true } : undefined,
  cacheComponents: !isTauriBuild,
  partialPrefetching: !isTauriBuild,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// The nexo palette lives as theme tokens in src/app/globals.css
// (CODING_STANDARDS.md, "Design language"); components use the tokens, never a
// colour of their own: no hex, no rgb()/hsl()/oklch(), no Tailwind `[#...]`.
const RAW_COLOUR = String.raw`/(^|[^&\w])#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\b(rgba?|hsla?|oklch|oklab|lch|lab)\(/`;
const rawColourMessage =
  "Use a theme token from src/app/globals.css instead of a raw colour (CODING_STANDARDS.md, Design language).";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=${RAW_COLOUR}]`, message: rawColourMessage },
        { selector: `TemplateElement[value.raw=${RAW_COLOUR}]`, message: rawColourMessage },
      ],
    },
  },
  {
    // Google's sign-in mark must keep Google's own colours.
    files: ["src/app/login/_components/google-sign-in.tsx"],
    rules: { "no-restricted-syntax": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

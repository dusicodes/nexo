import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The nexo palette (CODING_STANDARDS.md, "Design language") lives as theme
 * tokens in globals.css: Daybook paper in :root (light), Ink in .dark. Every
 * colour text is set in must reach 4.5:1 against the ground in both themes.
 */
const css = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

const TEXT_TOKENS = [
  "foreground",
  "muted-foreground",
  "faint",
  "link",
  "link-hover",
  "checklist",
] as const;

function tokensOf(selector: string): Record<string, string> {
  const block = css.match(new RegExp(`^${selector.replace(".", "\\.")} \\{([^}]*)\\}`, "m"));
  if (block === null) {
    throw new Error(`No ${selector} block in globals.css`);
  }
  return Object.fromEntries(
    [...block[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]),
  );
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const [r, g, b] = channels.map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("palette contrast", () => {
  it("works out contrast as WCAG does", () => {
    expect(contrast("#ffffff", "#000000")).toBeCloseTo(21);
    expect(contrast("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  for (const [theme, selector] of [
    ["light (Daybook paper)", ":root"],
    ["dark (Ink)", ".dark"],
  ] as const) {
    it(`keeps every text colour at 4.5:1 or more in the ${theme} theme`, () => {
      const tokens = tokensOf(selector);

      for (const token of TEXT_TOKENS) {
        expect(tokens[token], `--${token}`).toMatch(/^#[0-9a-f]{6}$/i);
        expect(
          contrast(tokens[token], tokens.background),
          `--${token} on --background`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});

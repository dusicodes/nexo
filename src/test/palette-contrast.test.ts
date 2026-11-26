import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The nexo palette (CODING_STANDARDS.md, "Design language") lives as theme
 * tokens in globals.css: Daybook paper in :root (light), Ink in .dark. Every
 * colour that text is set in somewhere under src/ (a `text-<token>` class) must
 * reach 4.5:1 against the surface it sits on, in both themes. The tokens are
 * found by scanning the components, so a new text colour is checked without
 * anyone listing it.
 */
const css = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");
const srcDir = fileURLToPath(new URL("..", import.meta.url));

/** Text tokens set on a surface other than the page ground. */
const SURFACE: Record<string, string> = {
  "primary-foreground": "primary",
  "secondary-foreground": "secondary",
  "card-foreground": "card",
  "popover-foreground": "popover",
  "accent-foreground": "accent",
  // The inverted toast: background-coloured text on a foreground ground.
  background: "foreground",
};

/** Every `text-<name>` class in the components, for names that are theme tokens. */
function textTokensUsed(themeTokens: Record<string, string>): string[] {
  const names = new Set<string>();
  for (const file of readdirSync(srcDir, { recursive: true, encoding: "utf8" })) {
    if (!file.endsWith(".tsx")) {
      continue;
    }
    const source = readFileSync(join(srcDir, file), "utf8");
    for (const match of source.matchAll(/\btext-([a-z]+(?:-[a-z]+)*)/g)) {
      if (match[1] in themeTokens) {
        names.add(match[1]);
      }
    }
  }
  return [...names].sort();
}

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
    it(`keeps every text colour at 4.5:1 or more on its surface in the ${theme} theme`, () => {
      const tokens = tokensOf(selector);
      const used = textTokensUsed(tokens);

      // The scan finds the palette's own text colours; if it finds none, it is broken.
      expect(used).toEqual(expect.arrayContaining(["foreground", "muted-foreground", "faint"]));
      for (const token of used) {
        const surface = SURFACE[token] ?? "background";
        expect(tokens[token], `--${token}`).toMatch(/^#[0-9a-f]{6}$/i);
        expect(
          contrast(tokens[token], tokens[surface]),
          `--${token} on --${surface}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});

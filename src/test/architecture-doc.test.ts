import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * architecture.md is edited by hand and by scripts; a bad edit can duplicate
 * or drop whole sections. Its numbered `## N. Title` sections must run
 * 1, 2, 3, ... with no repeats or gaps.
 */
const doc = readFileSync(
  fileURLToPath(new URL("../../architecture.md", import.meta.url)),
  "utf8",
);

describe("architecture.md", () => {
  it("numbers its sections 1..n with no duplicates or gaps", () => {
    const numbers = [...doc.matchAll(/^## (\d+)\. /gm)].map((m) => Number(m[1]));

    expect(numbers.length).toBeGreaterThan(0);
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  });

  it("has no repeated section titles", () => {
    const titles = [...doc.matchAll(/^## (.+)$/gm)].map((m) => m[1]);

    expect(new Set(titles).size).toBe(titles.length);
  });
});

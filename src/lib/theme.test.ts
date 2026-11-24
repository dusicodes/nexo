import { describe, expect, it } from "vitest";
import {
  BEFORE_PAINT_SCRIPT,
  THEME_STORAGE_KEY,
  WELCOME_SEEN_KEY,
  otherTheme,
  resolveTheme,
} from "@/lib/theme";

describe("resolveTheme", () => {
  it("starts dark when the owner has not chosen", () => {
    expect(resolveTheme(null)).toBe("dark");
  });

  it("keeps an explicit choice", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("falls back to dark for an unknown stored value", () => {
    expect(resolveTheme("sepia")).toBe("dark");
  });
});

describe("otherTheme", () => {
  it("toggles between dark and light", () => {
    expect(otherTheme("dark")).toBe("light");
    expect(otherTheme("light")).toBe("dark");
  });
});

/** Runs the before-paint script against fake browser globals. */
function runBeforePaint(local: Record<string, string>, session: Record<string, string>) {
  const classes = new Set(["dark"]);
  const attributes = new Map<string, string>();
  const document = {
    documentElement: {
      classList: { remove: (name: string) => classes.delete(name) },
      setAttribute: (name: string, value: string) => attributes.set(name, value),
    },
  };
  const storage = (values: Record<string, string>) => ({
    getItem: (key: string) => values[key] ?? null,
  });
  new Function("document", "localStorage", "sessionStorage", BEFORE_PAINT_SCRIPT)(
    document,
    storage(local),
    storage(session),
  );
  return { dark: classes.has("dark"), welcomeSeen: attributes.has("data-welcome-seen") };
}

describe("BEFORE_PAINT_SCRIPT", () => {
  it("leaves a first visit dark with the welcome animation unseen", () => {
    expect(runBeforePaint({}, {})).toEqual({ dark: true, welcomeSeen: false });
  });

  it("switches to light when the owner chose light", () => {
    expect(runBeforePaint({ [THEME_STORAGE_KEY]: "light" }, {}).dark).toBe(false);
  });

  it("marks the welcome animation as seen later in the same session", () => {
    expect(runBeforePaint({}, { [WELCOME_SEEN_KEY]: "1" }).welcomeSeen).toBe(true);
  });
});

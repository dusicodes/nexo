import { describe, expect, it } from "vitest";
import { safeCallbackURL } from "@/lib/safe-callback-url";

describe("safeCallbackURL", () => {
  it("keeps a same-origin relative path", () => {
    expect(safeCallbackURL("/projects/42")).toBe("/projects/42");
  });

  it("keeps a path with a query string and fragment", () => {
    expect(safeCallbackURL("/notes?tab=2#top")).toBe("/notes?tab=2#top");
  });

  it("falls back to / when no value is given", () => {
    expect(safeCallbackURL(undefined)).toBe("/");
  });

  it("falls back to / when the value is an array", () => {
    expect(safeCallbackURL(["/a", "/b"])).toBe("/");
  });

  it("falls back to / when the value is empty", () => {
    expect(safeCallbackURL("")).toBe("/");
  });

  it.each([
    ["an absolute https URL", "https://evil.example.com/steal"],
    ["an absolute http URL", "http://evil.example.com"],
    ["a protocol-relative URL", "//evil.example.com"],
    ["a backslash protocol-relative URL", "/\\evil.example.com"],
    ["a path with no leading slash", "projects/42"],
    ["a javascript URL", "javascript:alert(1)"],
    ["a tab hidden inside a protocol-relative URL", "/\t/evil.example.com"],
    ["a newline hidden inside a protocol-relative URL", "/\n/evil.example.com"],
    ["a carriage return inside the path", "/projects\r/42"],
    ["a space in the path", "/projects 42"],
  ])("falls back to / for %s", (_label, raw) => {
    expect(safeCallbackURL(raw)).toBe("/");
  });
});

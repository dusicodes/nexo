import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins class names with a single space", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });
});

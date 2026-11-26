import { describe, expect, it } from "vitest";
import {
  normaliseDetails,
  NotAChecklistItemError,
  readDetails,
  tickChecklistItem,
} from "./details";

describe("readDetails", () => {
  it("reads open and ticked Checklist items and keeps other lines as text", () => {
    const details = "https://example.com\n[] Draft\n[x] Outline\n- not a Checklist item";

    expect(readDetails(details)).toEqual([
      { kind: "text", text: "https://example.com" },
      { kind: "checklist", ticked: false, text: "Draft" },
      { kind: "checklist", ticked: true, text: "Outline" },
      { kind: "text", text: "- not a Checklist item" },
    ]);
  });

  it('reads a line starting with "[ ] " as an open Checklist item', () => {
    expect(readDetails("[ ] Draft")).toEqual([{ kind: "checklist", ticked: false, text: "Draft" }]);
  });

  it("needs the marker at the very start of the line, followed by a space", () => {
    expect(readDetails(" [] indented\n[]no space\n[X] capital\n[]")).toEqual([
      { kind: "text", text: " [] indented" },
      { kind: "text", text: "[]no space" },
      { kind: "text", text: "[X] capital" },
      { kind: "text", text: "[]" },
    ]);
  });
});

describe("normaliseDetails", () => {
  it('rewrites a leading "[ ] " to "[] " and leaves everything else as typed', () => {
    const details = "[ ] Draft\nsee [ ] later\n- [ ] not a Checklist item\n[x] Done  ";

    expect(normaliseDetails(details)).toBe(
      "[] Draft\nsee [ ] later\n- [ ] not a Checklist item\n[x] Done  ",
    );
  });
});

describe("tickChecklistItem", () => {
  const details = "Plan:\n[] Draft\n[x] Outline\n- not a Checklist item";

  it("ticks and unticks one Checklist item, rewriting only its marker", () => {
    expect(tickChecklistItem(details, { lineIndex: 1, text: "Draft" }, true)).toBe(
      "Plan:\n[x] Draft\n[x] Outline\n- not a Checklist item",
    );
    expect(tickChecklistItem(details, { lineIndex: 2, text: "Outline" }, false)).toBe(
      "Plan:\n[] Draft\n[] Outline\n- not a Checklist item",
    );
  });

  it("leaves a Checklist item already in the asked state as it is", () => {
    expect(tickChecklistItem(details, { lineIndex: 2, text: "Outline" }, true)).toBe(details);
  });

  it('writes a "[ ] " line it ticks with the usual marker', () => {
    expect(tickChecklistItem("[ ] Draft\n[ ] Send", { lineIndex: 1, text: "Send" }, true)).toBe(
      "[ ] Draft\n[x] Send",
    );
  });

  it("refuses a line that is not a Checklist item", () => {
    for (const lineIndex of [0, 3, 4, -1, 1.5]) {
      expect(() => tickChecklistItem(details, { lineIndex, text: "Draft" }, true)).toThrow(
        NotAChecklistItemError,
      );
    }
  });

  it("refuses a Checklist item whose text is not the one asked for", () => {
    expect(() => tickChecklistItem(details, { lineIndex: 2, text: "Draft" }, true)).toThrow(
      NotAChecklistItemError,
    );
  });
});

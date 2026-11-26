import { describe, expect, it } from "vitest";
import { isLocalDate, startOfLocalDate, toLocalDate } from "./local-date";

describe("toLocalDate", () => {
  it("names the local day, switching at local midnight", () => {
    expect(toLocalDate(new Date(2026, 10, 26, 23, 59, 59))).toBe("2026-11-26");
    expect(toLocalDate(new Date(2026, 10, 27, 0, 0, 0))).toBe("2026-11-27");
  });

  it("pads single-digit months and days", () => {
    expect(toLocalDate(new Date(2027, 0, 5, 12))).toBe("2027-01-05");
  });
});

describe("isLocalDate", () => {
  it("accepts a real YYYY-MM-DD day", () => {
    expect(isLocalDate("2028-02-29")).toBe(true);
  });

  it("refuses days that do not exist and other shapes", () => {
    expect(isLocalDate("2026-02-30")).toBe(false);
    expect(isLocalDate("2026-11-26T10:00")).toBe(false);
    expect(isLocalDate(20261126)).toBe(false);
  });
});

describe("startOfLocalDate", () => {
  it("is local midnight at the start of that day, and round-trips", () => {
    const start = startOfLocalDate("2026-11-26");

    expect([start.getFullYear(), start.getMonth(), start.getDate(), start.getHours()]).toEqual([
      2026, 10, 26, 0,
    ]);
    expect(toLocalDate(start)).toBe("2026-11-26");
  });
});

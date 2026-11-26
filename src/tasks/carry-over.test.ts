import { describe, expect, it } from "vitest";
import { isOnToday, plannedDayHint } from "./carry-over";

// 2026-11-26 is a Thursday.
describe("plannedDayHint", () => {
  it("names the weekday of a Planned day within the last week", () => {
    expect(plannedDayHint("2026-11-25", "2026-11-26", "en-US")).toBe("from Wednesday");
    expect(plannedDayHint("2026-11-24", "2026-11-26", "en-US")).toBe("from Tuesday");
    expect(plannedDayHint("2026-11-20", "2026-11-26", "en-US")).toBe("from Friday");
  });

  it("gives a short date a week ago or earlier, so the weekday is never ambiguous", () => {
    expect(plannedDayHint("2026-11-19", "2026-11-26", "en-US")).toBe("from Nov 19");
    expect(plannedDayHint("2026-10-02", "2026-11-26", "en-US")).toBe("from Oct 2");
  });

  it("adds the year to a Planned day in an earlier year", () => {
    expect(plannedDayHint("2025-12-30", "2026-01-02", "en-US")).toBe("from Tuesday");
    expect(plannedDayHint("2025-12-20", "2026-01-02", "en-US")).toBe("from Dec 20, 2025");
  });
});

describe("isOnToday", () => {
  const open = (plannedDay: string) => ({ plannedDay, completedDay: null });

  it("holds open Tasks planned for today or carried over from an earlier day", () => {
    expect(isOnToday(open("2026-11-26"), "2026-11-26")).toBe(true);
    expect(isOnToday(open("2026-11-02"), "2026-11-26")).toBe(true);
  });

  it("leaves out Tasks planned for a future day", () => {
    expect(isOnToday(open("2026-11-27"), "2026-11-26")).toBe(false);
  });

  it("holds a done Task only on the day it was completed", () => {
    const done = { plannedDay: "2026-11-24", completedDay: "2026-11-25" };

    expect(isOnToday(done, "2026-11-25")).toBe(true);
    expect(isOnToday(done, "2026-11-26")).toBe(false);
  });
});

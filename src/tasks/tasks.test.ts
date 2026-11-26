import { beforeAll, describe, expect, it } from "vitest";
import { useTestDatabase } from "@/test/test-database";

type Tasks = typeof import("./tasks");

describe("Tasks", () => {
  let tasks: Tasks;

  useTestDatabase();

  beforeAll(async () => {
    tasks = await import("./tasks");
  });

  // The database is shared by the whole file, so each test works on its own
  // day to stay independent of the others.

  it("shows a Task added today on Today", async () => {
    await tasks.add("Email the hiring manager", "2026-11-26");

    const today = await tasks.today("2026-11-26");

    expect(today.map((task) => task.title)).toEqual(["Email the hiring manager"]);
    expect(today[0].plannedDay).toBe("2026-11-26");
  });

  it("lists Today's Tasks oldest first", async () => {
    await tasks.add("First", "2026-11-27");
    await tasks.add("Second", "2026-11-27");
    await tasks.add("Third", "2026-11-27");

    const today = await tasks.today("2026-11-27");

    expect(today.map((task) => task.title)).toEqual(["First", "Second", "Third"]);
  });

  it("does not show a Task planned for another day", async () => {
    await tasks.add("Saturday's Task", "2026-11-28");

    expect(await tasks.today("2026-11-29")).toEqual([]);
  });

  it("refuses a blank title and saves nothing", async () => {
    await expect(tasks.add("   ", "2026-11-30")).rejects.toBeInstanceOf(
      tasks.BlankTaskTitleError,
    );

    expect(await tasks.today("2026-11-30")).toEqual([]);
  });

  it("trims the title it saves", async () => {
    await tasks.add("  Pay rent \n", "2026-12-01");

    const today = await tasks.today("2026-12-01");

    expect(today.map((task) => task.title)).toEqual(["Pay rent"]);
  });

  it("refuses a day that is not a local date", async () => {
    await expect(tasks.add("Pay rent", "2026-02-30")).rejects.toThrow("Not a local date");
    await expect(tasks.today("26/11/2026")).rejects.toThrow("Not a local date");
  });
});

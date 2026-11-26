import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearTasks, useTestDatabase } from "@/test/test-database";
import { isOnToday } from "./carry-over";

type Tasks = typeof import("./tasks");

describe("Tasks", () => {
  let tasks: Tasks;

  useTestDatabase();

  beforeAll(async () => {
    tasks = await import("./tasks");
  });

  // The database is shared by the whole file, and open Tasks carry over to
  // later days, so each test starts with no Tasks stored.
  beforeEach(clearTasks);

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

  it("does not show a Task planned for a future day", async () => {
    await tasks.add("Saturday's Task", "2026-11-28");

    expect(await tasks.today("2026-11-27")).toEqual([]);
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

  it("renames a Task, trimming the new title", async () => {
    const task = await tasks.add("Email the hiring maneger", "2026-12-02");

    const renamed = await tasks.rename(task.id, "  Email the hiring manager ");

    expect(renamed.title).toBe("Email the hiring manager");
    expect((await tasks.today("2026-12-02")).map((shown) => shown.title)).toEqual([
      "Email the hiring manager",
    ]);
  });

  it("refuses to rename a Task to a blank title and keeps the old one", async () => {
    const task = await tasks.add("Pay rent", "2026-12-03");

    await expect(tasks.rename(task.id, "  ")).rejects.toBeInstanceOf(tasks.BlankTaskTitleError);

    expect((await tasks.today("2026-12-03")).map((shown) => shown.title)).toEqual(["Pay rent"]);
  });

  it("refuses to rename a Task that does not exist", async () => {
    await expect(tasks.rename("no-such-task", "Pay rent")).rejects.toBeInstanceOf(
      tasks.TaskNotFoundError,
    );
  });

  it("deletes a Task from Today", async () => {
    await tasks.add("Keep", "2026-12-04");
    const doomed = await tasks.add("Delete me", "2026-12-04");

    await tasks.delete(doomed.id);

    expect((await tasks.today("2026-12-04")).map((shown) => shown.title)).toEqual(["Keep"]);
  });

  it("restores a deleted Task identically, in its old place", async () => {
    await tasks.add("First", "2026-12-05");
    const middle = await tasks.add("Middle", "2026-12-05");
    await tasks.add("Last", "2026-12-05");
    const before = await tasks.today("2026-12-05");

    const snapshot = await tasks.delete(middle.id);
    await tasks.add("Added while deleted", "2026-12-05");
    await tasks.restore(snapshot);

    expect(await tasks.today("2026-12-05")).toEqual([
      before[0],
      before[1],
      before[2],
      expect.objectContaining({ title: "Added while deleted" }),
    ]);
    // The snapshot carries every stored field, so deleting again gives the same one.
    expect(await tasks.delete(middle.id)).toEqual(snapshot);
  });

  it("refuses to delete a Task that does not exist", async () => {
    await expect(tasks.delete("no-such-task")).rejects.toBeInstanceOf(tasks.TaskNotFoundError);
  });
  it("stores a Task's Details exactly as typed and shows them on Today", async () => {
    const task = await tasks.add("Read the RFC", "2026-12-06");
    const details = "  https://example.com/rfc\n- section 3 first\n";

    const updated = await tasks.setDetails(task.id, details);

    expect(updated.details).toBe(details);
    expect((await tasks.today("2026-12-06")).map((shown) => shown.details)).toEqual([details]);
  });

  it("starts a Task with no Details and lets them be cleared", async () => {
    const task = await tasks.add("Pay rent", "2026-12-07");
    expect(task.details).toBe("");

    await tasks.setDetails(task.id, "Landlord's account");
    await tasks.setDetails(task.id, "");

    expect((await tasks.today("2026-12-07"))[0].details).toBe("");
  });

  it("keeps Details through a rename and a delete followed by restore", async () => {
    const task = await tasks.add("Book flights", "2026-12-08");
    await tasks.setDetails(task.id, "Window seat");
    await tasks.rename(task.id, "Book flights to Lisbon");

    await tasks.restore(await tasks.delete(task.id));

    expect((await tasks.today("2026-12-08"))[0]).toMatchObject({
      title: "Book flights to Lisbon",
      details: "Window seat",
    });
  });

  it("refuses to set Details on a Task that does not exist", async () => {
    await expect(tasks.setDetails("no-such-task", "Notes")).rejects.toBeInstanceOf(
      tasks.TaskNotFoundError,
    );
  });
  it("saves a \"[ ] \" Checklist item as \"[] \" and keeps other lines as typed", async () => {
    const task = await tasks.add("Write the post", "2026-12-09");

    const details = "[ ] Draft\n- [ ] not a Checklist item\n[x] Outline";

    const updated = await tasks.setDetails(task.id, details);

    expect(updated.details).toBe("[] Draft\n- [ ] not a Checklist item\n[x] Outline");
  });

  it("ticks and unticks a Checklist item, rewriting only that line", async () => {
    const task = await tasks.add("Write the post", "2026-12-10");
    await tasks.setDetails(task.id, "https://example.com\n[] Draft\n[] Edit");

    const edit = { lineIndex: 2, text: "Edit" };
    const ticked = await tasks.setChecklistItem(task.id, edit, true);
    expect(ticked.details).toBe("https://example.com\n[] Draft\n[x] Edit");

    await tasks.setChecklistItem(task.id, edit, false);
    expect((await tasks.today("2026-12-10"))[0].details).toBe(
      "https://example.com\n[] Draft\n[] Edit",
    );
  });

  it("refuses to tick a line that is not a Checklist item, leaving the Details", async () => {
    const task = await tasks.add("Write the post", "2026-12-11");
    await tasks.setDetails(task.id, "- outline\n[] Draft");

    for (const item of [
      { lineIndex: 0, text: "- outline" },
      { lineIndex: 2, text: "Draft" },
    ]) {
      await expect(tasks.setChecklistItem(task.id, item, true)).rejects.toBeInstanceOf(
        tasks.NotAChecklistItemError,
      );
    }

    expect((await tasks.today("2026-12-11"))[0].details).toBe("- outline\n[] Draft");
  });

  it("leaves the Task open when its only Checklist item is ticked", async () => {
    const task = await tasks.add("Write the post", "2026-12-12");
    await tasks.setDetails(task.id, "[] Draft");

    await tasks.setChecklistItem(task.id, { lineIndex: 0, text: "Draft" }, true);

    // The snapshot holds every stored field, including the day it was completed.
    expect((await tasks.delete(task.id)).completedDay).toBeNull();
  });

  it("refuses to tick a Checklist item of a Task that does not exist", async () => {
    const draft = { lineIndex: 0, text: "Draft" };

    await expect(tasks.setChecklistItem("no-such-task", draft, true)).rejects.toBeInstanceOf(
      tasks.TaskNotFoundError,
    );
  });
  it("marks a Task done on the day it is completed", async () => {
    const task = await tasks.add("Pay rent", "2026-12-13");
    expect(task.completedDay).toBeNull();

    const done = await tasks.complete(task.id, "2026-12-13");

    expect(done.completedDay).toBe("2026-12-13");
    expect((await tasks.today("2026-12-13"))[0].completedDay).toBe("2026-12-13");
  });
  it("keeps done Tasks in their place and adds new Tasks after them", async () => {
    const first = await tasks.add("First", "2026-12-14");
    await tasks.add("Second", "2026-12-14");
    const third = await tasks.add("Third", "2026-12-14");

    await tasks.complete(third.id, "2026-12-14");
    await tasks.complete(first.id, "2026-12-14");
    await tasks.add("Fourth", "2026-12-14");

    expect((await tasks.today("2026-12-14")).map((shown) => shown.title)).toEqual([
      "First",
      "Second",
      "Third",
      "Fourth",
    ]);
  });

  it("drops a done Task from the next day's Today but keeps it stored", async () => {
    const task = await tasks.add("Pay rent", "2026-12-15");
    await tasks.complete(task.id, "2026-12-15");

    expect(await tasks.today("2026-12-16")).toEqual([]);
    expect(await tasks.delete(task.id)).toMatchObject({
      title: "Pay rent",
      completedDay: "2026-12-15",
    });
  });
  it("reopens a done Task in its place", async () => {
    const first = await tasks.add("First", "2026-12-17");
    await tasks.add("Second", "2026-12-17");
    await tasks.complete(first.id, "2026-12-17");

    const reopened = await tasks.reopen(first.id);

    expect(reopened.completedDay).toBeNull();
    expect((await tasks.today("2026-12-17")).map((shown) => shown.title)).toEqual([
      "First",
      "Second",
    ]);
  });

  it("leaves a Task's Checklist items as they are when it is completed and reopened", async () => {
    const task = await tasks.add("Write the post", "2026-12-18");
    await tasks.setDetails(task.id, "[x] Draft\n[] Edit");

    expect((await tasks.complete(task.id, "2026-12-18")).details).toBe("[x] Draft\n[] Edit");
    expect((await tasks.reopen(task.id)).details).toBe("[x] Draft\n[] Edit");
  });

  it("refuses to complete or reopen a Task that does not exist", async () => {
    await expect(tasks.complete("no-such-task", "2026-12-19")).rejects.toBeInstanceOf(
      tasks.TaskNotFoundError,
    );
    await expect(tasks.reopen("no-such-task")).rejects.toBeInstanceOf(tasks.TaskNotFoundError);
  });

  it("refuses to complete a Task on a day that is not a local date", async () => {
    const task = await tasks.add("Pay rent", "2026-12-20");

    await expect(tasks.complete(task.id, "20/12/2026")).rejects.toThrow("Not a local date");
  });
  it("refuses to tick a line that no longer holds the Checklist item asked for", async () => {
    const task = await tasks.add("Write the post", "2026-12-21");
    await tasks.setDetails(task.id, "[] Outline first\n[] Draft");

    // The page still showed "Draft" on line 0, before the line above was saved.
    await expect(
      tasks.setChecklistItem(task.id, { lineIndex: 0, text: "Draft" }, true),
    ).rejects.toBeInstanceOf(tasks.NotAChecklistItemError);

    expect((await tasks.today("2026-12-21"))[0].details).toBe("[] Outline first\n[] Draft");
  });

  it("carries an open Task from yesterday over to Today, flagged with its Planned day", async () => {
    await tasks.add("Call the bank", "2026-11-25");

    expect(await tasks.today("2026-11-26")).toEqual([
      expect.objectContaining({
        title: "Call the bank",
        plannedDay: "2026-11-25",
        carriedOver: true,
      }),
    ]);
  });

  it("carries open Tasks over several days, oldest first, above today's", async () => {
    await tasks.add("From last week", "2026-11-18");
    const doneEarlier = await tasks.add("Done on Monday", "2026-11-23");
    await tasks.complete(doneEarlier.id, "2026-11-23");
    await tasks.add("From Tuesday", "2026-11-24");
    await tasks.add("Planned today", "2026-11-26");

    const today = await tasks.today("2026-11-26");

    expect(today.map(({ title, carriedOver }) => [title, carriedOver])).toEqual([
      ["From last week", true],
      ["From Tuesday", true],
      ["Planned today", false],
    ]);
    // The page decides what Today holds with the same rule.
    expect(today.every((task) => isOnToday(task, "2026-11-26"))).toBe(true);
  });

  it("keeps a Carried-over Task completed today on Today, no longer carried over", async () => {
    const task = await tasks.add("Call the bank", "2026-11-24");

    await tasks.complete(task.id, "2026-11-26");

    expect(await tasks.today("2026-11-26")).toEqual([
      expect.objectContaining({ title: "Call the bank", carriedOver: false }),
    ]);
    expect(await tasks.today("2026-11-27")).toEqual([]);
  });
});
